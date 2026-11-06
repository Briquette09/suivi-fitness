const MuscuView = (() => {
  let openWorkoutId = null;
  let progressionExercise = null;

  const ROTATION = ['Haut A', 'Bas A', 'Haut B', 'Bas B'];
  const MOODS = [
    { v: 1, e: '😫', l: 'Galère' },
    { v: 2, e: '😕', l: 'Bof' },
    { v: 3, e: '😐', l: 'Correct' },
    { v: 4, e: '🙂', l: 'Bien' },
    { v: 5, e: '🤩', l: 'Top' }
  ];

  // ---------- Données ----------

  function ensureTodayWorkout() {
    const workouts = DB.getWorkouts();
    if (openWorkoutId) {
      const opened = workouts.find(x => x.id === openWorkoutId);
      if (opened) return opened;
    }
    const today = DB.todayISO();
    let w = workouts.find(x => x.date === today && !x.completed);
    if (!w) w = DB.addWorkout({ date: today });
    openWorkoutId = w.id;
    return w;
  }

  function sortedTemplates() {
    const rank = t => { const i = ROTATION.indexOf(t.name); return i === -1 ? 99 : i; };
    return DB.getTemplates().sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'fr'));
  }

  function nextInRotation() {
    const templates = DB.getTemplates();
    const inRotation = ROTATION.map(n => templates.find(t => t.name === n)).filter(Boolean);
    if (!inRotation.length) return null;
    const last = DB.getWorkouts()
      .filter(w => w.completed && ROTATION.includes(w.name))
      .sort((a, b) => (b.completedAt || b.date).localeCompare(a.completedAt || a.date))[0];
    if (!last) return inRotation[0];
    const idx = inRotation.findIndex(t => t.name === last.name);
    return inRotation[(idx + 1) % inRotation.length];
  }

  function exerciseOptions() {
    const names = new Set(DB.getExerciseLibrary());
    ExerciseCatalog.EXERCISES.filter(e => e.suggest !== false).forEach(e => names.add(e.name));
    return [...names].sort((a, b) => a.localeCompare(b, 'fr'));
  }

  function parseTopReps(repsStr) {
    if (!repsStr) return null;
    const withoutJambe = repsStr.replace(/\/\s*jambe/i, '');
    if (/[a-zA-Z]/.test(withoutJambe)) return null; // ex: "30-60 s" est une durée, pas des reps
    const nums = withoutJambe.match(/\d+/g);
    if (!nums || !nums.length) return null;
    return Number(nums[nums.length - 1]);
  }

  function isTargetReached(ex) {
    if (!ex.target || !ex.target.sets) return false;
    const topReps = parseTopReps(ex.target.reps);
    if (!topReps) return false;
    if (ex.sets.length < ex.target.sets) return false;
    return ex.sets.every(s => Number(s.reps) >= topReps);
  }

  function lastPerformance(name, currentWorkoutId) {
    for (const w of DB.getWorkouts()) {
      if (w.id === currentWorkoutId) continue;
      const ex = w.exercises.find(e => e.name === name && e.sets.length);
      if (ex) return { date: w.date, ex };
    }
    return null;
  }

  function prefillValues(ex, last) {
    const current = ex.sets[ex.sets.length - 1];
    const lastSets = last ? last.ex.sets : [];
    const lastSameSet = lastSets[ex.sets.length] || lastSets[lastSets.length - 1];
    const reps = (lastSets[ex.sets.length] || current || lastSameSet || {}).reps;
    const weight = (current || lastSameSet || {}).weight;
    return { reps: reps ?? '', weight: weight ?? '' };
  }

  function moodOf(v) { return MOODS.find(m => m.v === v); }

  // ---------- Petits morceaux d'interface ----------

  function groupChip(name) {
    const g = ExerciseCatalog.groupInfo(name);
    if (!g) return '';
    return `<span class="group-chip" style="color:${g.color};background:${g.color}22;border-color:${g.color}55">${g.label}</span>`;
  }

  function targetLabel(target) {
    if (!target || (!target.sets && !target.reps && !target.restSeconds)) return '';
    const parts = [];
    if (target.sets) parts.push(`${target.sets} séries`);
    if (target.reps) parts.push(`${target.reps} reps`);
    if (target.restSeconds) parts.push(`repos ${target.restSeconds}s`);
    return `<div class="ex-target">🎯 ${parts.join(' · ')}</div>`;
  }

  function lastTimeLabel(last) {
    if (!last) return '';
    const sets = last.ex.sets.map(s => `${s.reps}×${s.weight}`).join(' · ');
    const hint = isTargetReached(last.ex)
      ? '<div class="progress-hint">⬆️ Objectif validé la dernière fois → monte la charge</div>'
      : '';
    return `<div class="last-time">🕑 Dernière fois (${shortDate(last.date)}) : ${sets} kg</div>${hint}`;
  }

  function heroCard() {
    const count = Avatar.completedCount();
    const lv = Avatar.levelFor(count);
    return `
      <button class="hero-card" id="hero-card" style="--level-color:${lv.level.color}">
        <div class="hero-avatar">${Avatar.svg(count, 74)}</div>
        <div class="hero-info">
          <div class="hero-level">Niveau ${lv.index + 1} · ${lv.level.name}</div>
          <div class="hero-sub">${count} séance${count > 1 ? 's' : ''} terminée${count > 1 ? 's' : ''}</div>
          <div class="xp-track"><div class="xp-fill" style="width:${Math.round(lv.progress * 100)}%"></div></div>
          <div class="hero-sub">${lv.next ? `Encore ${lv.remaining} pour « ${lv.next.name} »` : 'Niveau max 🔥'}</div>
        </div>
      </button>`;
  }

  // ---------- Onglets ----------

  function render(container, tab) {
    if (tab === 'programme') renderProgramme(container);
    else if (tab === 'historique') renderHistorique(container);
    else if (tab === 'progres') renderProgres(container);
    else renderSeance(container);
  }

  function renderSeance(content) {
    const w = ensureTodayWorkout();
    const templates = sortedTemplates();
    const suggested = w.exercises.length === 0 ? nextInRotation() : null;
    const reached = w.exercises.filter(isTargetReached);
    const doneSets = w.exercises.reduce((s, ex) => s + ex.sets.length, 0);
    const targetSets = w.exercises.reduce((s, ex) => s + ((ex.target && ex.target.sets) || 0), 0);

    content.innerHTML = `
      ${heroCard()}
      <div class="card session-head">
        <input type="text" id="w-name" class="input input-title" placeholder="Nom de la séance" value="${escapeAttr(w.name || '')}">
        <div class="session-meta">
          <span>📅 ${formatDate(w.date)}</span>
          ${targetSets ? `<span class="pill">${doneSets}/${targetSets} séries</span>` : ''}
        </div>
        ${targetSets ? `<div class="xp-track thin"><div class="xp-fill" style="width:${Math.min(100, Math.round(doneSets / targetSets * 100))}%"></div></div>` : ''}
      </div>
      ${reached.length ? `
        <div class="card alert-card">
          🎯 Objectif atteint : <strong>${reached.map(ex => escapeHtml(ex.name)).join(', ')}</strong>.
          La prochaine fois, ajoute le plus petit disque dispo.
        </div>
      ` : ''}
      ${w.exercises.length === 0 && templates.length ? `
        <div class="card">
          <h3>Quelle séance aujourd'hui ?</h3>
          ${suggested ? `<div class="small-muted">Suivante dans ta rotation : <strong>${escapeHtml(suggested.name)}</strong></div>` : ''}
          <div class="template-grid">
            ${templates.map((t, i) => `
              <button class="tpl-btn tpl-c${i % 4} ${suggested && t.id === suggested.id ? 'suggested' : ''}" data-load-tpl="${t.id}">
                ${suggested && t.id === suggested.id ? '<span class="tpl-tag">Conseillée</span>' : ''}
                <span class="tpl-name">${escapeHtml(t.name)}</span>
                <span class="tpl-sub">${t.exercises.length} exercices</span>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}
      <div id="exercise-list">${w.exercises.map((ex, i) => exerciseCard(ex, i, w)).join('')}</div>
      <div class="card add-ex-card">
        <div class="row-inline">
          <input type="text" id="new-ex-name" class="input" list="exercise-options" placeholder="Ajouter un exercice">
          <button class="btn btn-primary" id="add-ex-btn">+</button>
        </div>
        <datalist id="exercise-options">
          ${exerciseOptions().map(e => `<option value="${escapeAttr(e)}">`).join('')}
        </datalist>
      </div>
      ${w.exercises.some(ex => ex.sets.length) ? '<button class="btn btn-warm btn-block btn-big" id="finish-workout-btn">🏁 Terminer la séance</button>' : ''}
    `;

    content.querySelector('#hero-card').addEventListener('click', () => App.goTo('progres'));

    content.querySelector('#w-name').addEventListener('change', e => {
      DB.updateWorkout(w.id, { name: e.target.value });
    });

    content.querySelector('#add-ex-btn').addEventListener('click', () => {
      const name = content.querySelector('#new-ex-name').value.trim();
      if (!name) return;
      DB.addExerciseToLibrary(name);
      w.exercises.push({ name, sets: [] });
      DB.updateWorkout(w.id, { exercises: w.exercises });
      renderSeance(content);
    });

    content.querySelectorAll('[data-load-tpl]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tpl = DB.getTemplates().find(t => t.id === btn.dataset.loadTpl);
        if (!tpl) return;
        w.exercises = tpl.exercises.map(te => ({
          name: te.name,
          sets: [],
          target: { sets: te.targetSets, reps: te.targetReps, restSeconds: te.restSeconds }
        }));
        if (!w.name) w.name = tpl.name;
        DB.updateWorkout(w.id, { name: w.name, exercises: w.exercises });
        renderSeance(content);
      });
    });

    const finishBtn = content.querySelector('#finish-workout-btn');
    if (finishBtn) finishBtn.addEventListener('click', () => openMoodSheet(w, content));

    bindExerciseCards(content, w);
  }

  function exerciseCard(ex, i, w) {
    const last = lastPerformance(ex.name, w.id);
    const prefill = prefillValues(ex, last);
    const g = ExerciseCatalog.groupInfo(ex.name);
    const color = g ? g.color : '#818cf8';
    const targetSets = ex.target && ex.target.sets;
    const done = ex.sets.length;
    const dots = targetSets
      ? `<div class="set-dots">${Array.from({ length: Math.max(targetSets, done) }, (_, k) => `<span class="dot ${k < done ? 'on' : ''}"></span>`).join('')}</div>`
      : '';
    return `
      <div class="card exercise-card ${targetSets && done >= targetSets ? 'complete' : ''}" style="--group-color:${color}">
        <div class="ex-head">
          <div class="ex-title">
            ${groupChip(ex.name)}
            <div class="ex-name">${escapeHtml(ex.name)}</div>
            ${ex.replaced ? `<div class="small-muted">remplace ${escapeHtml(ex.replaced)}</div>` : ''}
          </div>
          <button class="pill-btn" data-remove-ex="${i}">⇄ Changer</button>
        </div>
        ${targetLabel(ex.target)}
        ${lastTimeLabel(last)}
        ${isTargetReached(ex) ? '<div class="badge">🎯 Prêt à monter la charge</div>' : ''}
        ${dots}
        <div class="set-list">
          ${ex.sets.map((s, si) => `
            <div class="set-row">
              <span class="set-num">${si + 1}</span>
              <span class="set-val"><strong>${s.reps}</strong> reps × <strong>${s.weight}</strong> kg</span>
              <button class="btn-icon" data-remove-set="${i}:${si}" aria-label="Supprimer la série">✕</button>
            </div>
          `).join('')}
        </div>
        <div class="set-input">
          <label><span>Reps</span><input type="number" inputmode="numeric" class="input" data-reps-for="${i}" value="${prefill.reps}"></label>
          <label><span>Kg</span><input type="number" inputmode="decimal" class="input" data-weight-for="${i}" value="${prefill.weight}"></label>
          <button class="btn btn-primary" data-add-set="${i}">+ Série</button>
        </div>
      </div>
    `;
  }

  function bindExerciseCards(content, w) {
    content.querySelectorAll('[data-reps-for], [data-weight-for]').forEach(inp => {
      inp.addEventListener('focus', () => inp.select());
    });
    content.querySelectorAll('[data-remove-ex]').forEach(btn => {
      btn.addEventListener('click', () => openReplaceSheet(content, w, Number(btn.dataset.removeEx)));
    });
    content.querySelectorAll('[data-remove-set]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [exi, si] = btn.dataset.removeSet.split(':').map(Number);
        w.exercises[exi].sets.splice(si, 1);
        DB.updateWorkout(w.id, { exercises: w.exercises });
        renderSeance(content);
      });
    });
    content.querySelectorAll('[data-add-set]').forEach(btn => {
      btn.addEventListener('click', () => {
        const exi = Number(btn.dataset.addSet);
        const repsInput = content.querySelector(`[data-reps-for="${exi}"]`);
        const weightInput = content.querySelector(`[data-weight-for="${exi}"]`);
        const reps = Number(repsInput.value);
        const weight = Number(weightInput.value);
        if (!reps) { repsInput.focus(); return; }
        const ex = w.exercises[exi];
        ex.sets.push({ reps, weight: weight || 0 });
        DB.updateWorkout(w.id, { exercises: w.exercises });
        RestTimer.start(ex.target && ex.target.restSeconds);
        if (ex.target && ex.sets.length === ex.target.sets && isTargetReached(ex)) {
          toast(`🎯 ${ex.name} : augmente la charge la prochaine fois !`, 3000);
        }
        renderSeance(content);
      });
    });
  }

  // ---------- Panneaux ----------

  function openReplaceSheet(content, w, exi) {
    const ex = w.exercises[exi];
    const g = ExerciseCatalog.groupInfo(ex.name);
    const alts = ExerciseCatalog.alternatives(ex.name, w.exercises.map(e => e.name));
    const confirmLoss = () => !ex.sets.length || confirm('Les séries déjà saisies sur cet exercice seront effacées. Continuer ?');

    openSheet((body, close) => {
      body.innerHTML = `
        <h3 class="sheet-title">Pas envie de cet exercice ?</h3>
        <div class="sheet-current">${groupChip(ex.name)}<div>${escapeHtml(ex.name)}</div></div>
        ${alts.length ? `
          <div class="small-muted">Remplace-le par un exercice qui travaille ${g ? `les <strong>${g.label.toLowerCase()}</strong>` : 'le même muscle'} (mêmes séries, reps et repos) :</div>
          <div class="alt-list">
            ${alts.map(a => {
              const last = lastPerformance(a, w.id);
              return `
                <button class="alt-btn" data-alt="${escapeAttr(a)}" style="--group-color:${g.color}">
                  <span class="alt-name">${escapeHtml(a)}</span>
                  <span class="alt-sub">${last ? `déjà fait le ${shortDate(last.date)}` : 'nouveau'}</span>
                </button>`;
            }).join('')}
          </div>
        ` : '<p class="small-muted">Je ne connais pas d\'alternative pour cet exercice.</p>'}
        <button class="btn btn-secondary btn-block" data-remove>🗑️ Enlever sans remplacer</button>
        <button class="btn btn-ghost btn-block" data-cancel>Annuler</button>
      `;

      body.querySelectorAll('[data-alt]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!confirmLoss()) return;
          const alt = btn.dataset.alt;
          DB.addExerciseToLibrary(alt);
          w.exercises[exi] = { name: alt, sets: [], target: ex.target, replaced: ex.replaced || ex.name };
          DB.updateWorkout(w.id, { exercises: w.exercises });
          close();
          renderSeance(content);
          toast(`🔁 ${alt}`);
        });
      });
      body.querySelector('[data-remove]').addEventListener('click', () => {
        if (!confirmLoss()) return;
        w.exercises.splice(exi, 1);
        DB.updateWorkout(w.id, { exercises: w.exercises });
        close();
        renderSeance(content);
      });
      body.querySelector('[data-cancel]').addEventListener('click', close);
    });
  }

  function openMoodSheet(w, content) {
    const before = Avatar.levelFor(Avatar.completedCount());
    openSheet((body, close) => {
      body.innerHTML = `
        <h3 class="sheet-title center">Séance terminée ! 💪</h3>
        <p class="small-muted center">Tu es satisfait de cette séance ?</p>
        <div class="mood-grid">
          ${MOODS.map(m => `
            <button class="mood-btn" data-mood="${m.v}">
              <span class="mood-emoji">${m.e}</span>
              <span class="mood-label">${m.l}</span>
            </button>`).join('')}
        </div>
        <button class="btn btn-ghost btn-block" data-skip>Passer</button>
      `;
      const finish = mood => {
        DB.updateWorkout(w.id, { completed: true, completedAt: new Date().toISOString(), mood });
        openWorkoutId = null;
        RestTimer.reset();
        close();
        const after = Avatar.levelFor(Avatar.completedCount());
        if (after.index > before.index) {
          toast(`🎉 Niveau ${after.index + 1} : ${after.level.name} ! Ton perso prend du muscle`, 4000);
        } else {
          toast(mood ? `${moodOf(mood).e} Séance enregistrée` : 'Séance enregistrée 💪');
        }
        renderSeance(content);
      };
      body.querySelectorAll('[data-mood]').forEach(btn => {
        btn.addEventListener('click', () => finish(Number(btn.dataset.mood)));
      });
      body.querySelector('[data-skip]').addEventListener('click', () => finish(null));
    });
  }

  // ---------- Historique ----------

  function renderHistorique(content) {
    const workouts = DB.getWorkouts().filter(w => w.exercises.length);
    if (!workouts.length) {
      content.innerHTML = '<div class="card empty">📅 Aucune séance pour le moment.<br>Ta première t\'attend dans l\'onglet Séance !</div>';
      return;
    }
    content.innerHTML = workouts.map(w => {
      const mood = moodOf(w.mood);
      const sets = w.exercises.reduce((s, ex) => s + ex.sets.length, 0);
      return `
        <div class="card history-card">
          <div class="ex-head">
            <div>
              <div class="ex-name">${escapeHtml(w.name || 'Séance')} ${w.completed ? '' : '<span class="badge">En cours</span>'}</div>
              <div class="small-muted">${formatDate(w.date)} · ${w.exercises.length} exercices · ${sets} séries</div>
            </div>
            ${mood ? `<div class="history-mood" title="${mood.l}">${mood.e}</div>` : ''}
          </div>
          <div class="history-exercises">
            ${w.exercises.filter(ex => ex.sets.length).map(ex => `
              <div class="history-ex">
                <span class="dot-color" style="background:${(ExerciseCatalog.groupInfo(ex.name) || { color: '#818cf8' }).color}"></span>
                <span>${escapeHtml(ex.name)}</span>
                <span class="small-muted">${ex.sets.map(s => `${s.reps}×${s.weight}`).join(' · ')}</span>
              </div>`).join('')}
          </div>
          <div class="row-inline">
            <button class="btn btn-secondary" data-open="${w.id}">Ouvrir</button>
            <button class="btn btn-ghost" data-del="${w.id}">Supprimer</button>
          </div>
        </div>
      `;
    }).join('');
    content.querySelectorAll('[data-open]').forEach(btn => {
      btn.addEventListener('click', () => {
        openWorkoutId = btn.dataset.open;
        App.goTo('seance');
      });
    });
    content.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Supprimer cette séance ?')) {
          DB.deleteWorkout(btn.dataset.del);
          if (openWorkoutId === btn.dataset.del) openWorkoutId = null;
          renderHistorique(content);
        }
      });
    });
  }

  // ---------- Progrès ----------

  function renderProgres(content) {
    const count = Avatar.completedCount();
    const lv = Avatar.levelFor(count);
    const withHistory = DB.getExerciseLibrary().filter(e => DB.getExerciseHistory(e).length);
    if (!withHistory.includes(progressionExercise)) progressionExercise = withHistory[0] || null;
    const history = progressionExercise ? DB.getExerciseHistory(progressionExercise) : [];
    const moods = DB.getWorkouts().filter(w => w.completed && w.mood).slice(0, 10).reverse();

    content.innerHTML = `
      <div class="card avatar-stage" style="--level-color:${lv.level.color}">
        <div class="avatar-big">${Avatar.svg(count, 160)}</div>
        <div class="level-title">Niveau ${lv.index + 1} · ${lv.level.name}</div>
        <div class="small-muted">${count} séance${count > 1 ? 's' : ''} terminée${count > 1 ? 's' : ''}</div>
        <div class="xp-track"><div class="xp-fill" style="width:${Math.round(lv.progress * 100)}%"></div></div>
        <div class="small-muted">${lv.next ? `Encore ${lv.remaining} séance${lv.remaining > 1 ? 's' : ''} pour passer « ${lv.next.name} »` : 'Niveau max atteint 🔥'}</div>
        <div class="stages">
          ${Avatar.LEVELS.map((l, i) => `
            <div class="stage ${i <= lv.index ? 'unlocked' : ''}">
              ${Avatar.svg(l.min, 34, { noGlow: true })}
              <span>${l.name}</span>
            </div>`).join('')}
        </div>
      </div>
      ${moods.length ? `
        <div class="card">
          <h3>Ton ressenti (dernières séances)</h3>
          <div class="mood-history">${moods.map(w => `<span title="${escapeAttr(w.name || '')} · ${shortDate(w.date)}">${moodOf(w.mood).e}</span>`).join('')}</div>
        </div>
      ` : ''}
      <div class="card">
        <h3>Courbes par exercice</h3>
        ${withHistory.length ? `
          <select id="prog-select" class="input">
            ${withHistory.map(e => `<option value="${escapeAttr(e)}" ${e === progressionExercise ? 'selected' : ''}>${escapeHtml(e)}</option>`).join('')}
          </select>
          <div class="chart-title">Charge max (kg)</div>
          ${Charts.lineChart(history.map(h => ({ label: shortDate(h.date), value: h.maxWeight })), { unit: 'kg', color: '#22d3ee' })}
          <div class="chart-title">Volume total (reps × kg)</div>
          ${Charts.lineChart(history.map(h => ({ label: shortDate(h.date), value: h.volume })), { unit: '', color: '#f472b6' })}
        ` : '<div class="small-muted">Termine une première séance pour voir tes courbes.</div>'}
      </div>
    `;
    content.querySelector('#prog-select')?.addEventListener('change', e => {
      progressionExercise = e.target.value;
      renderProgres(content);
    });
  }

  // ---------- Programme ----------

  function renderProgramme(content) {
    const templates = sortedTemplates();
    content.innerHTML = `
      <div class="card small-muted">Tes séances-types. Modifie les exercices, séries, reps et repos : tu les charges ensuite en un tap depuis l'onglet Séance.</div>
      <div id="templates-list">${templates.map((t, i) => templateCard(t, i)).join('')}</div>
      <button class="btn btn-primary btn-block" id="add-template-btn">+ Nouvelle séance-type</button>
      <datalist id="exercise-options">
        ${exerciseOptions().map(e => `<option value="${escapeAttr(e)}">`).join('')}
      </datalist>
    `;

    content.querySelector('#add-template-btn').addEventListener('click', () => {
      DB.addTemplate({ name: 'Nouvelle séance', exercises: [] });
      renderProgramme(content);
    });

    templates.forEach(t => bindTemplateCard(content, t));
  }

  function templateCard(t, i) {
    return `
      <div class="card tpl-card tpl-c${i % 4}" data-tpl-id="${t.id}">
        <div class="row-inline space-between">
          <input type="text" class="input input-title tpl-name" value="${escapeAttr(t.name)}" placeholder="Nom (ex : Haut A)">
          <button class="btn-icon" data-del-tpl aria-label="Supprimer la séance-type">✕</button>
        </div>
        ${t.exercises.map((te, k) => `
          <div class="tpl-exercise-row">
            <div class="row-inline space-between">
              <div>${groupChip(te.name)}<div class="ex-name small">${escapeHtml(te.name)}</div></div>
              <button class="btn-icon" data-del-tpl-ex="${k}" aria-label="Supprimer l'exercice">✕</button>
            </div>
            <div class="tpl-fields">
              <label><span>Séries</span><input type="number" inputmode="numeric" class="input" value="${te.targetSets ?? ''}" data-tpl-sets="${k}"></label>
              <label><span>Reps</span><input type="text" class="input" value="${escapeAttr(te.targetReps || '')}" data-tpl-reps="${k}"></label>
              <label><span>Repos (s)</span><input type="number" inputmode="numeric" class="input" value="${te.restSeconds ?? ''}" data-tpl-rest="${k}"></label>
            </div>
          </div>
        `).join('') || '<div class="small-muted">Aucun exercice</div>'}
        <div class="row-inline">
          <input type="text" class="input tpl-new-ex" list="exercise-options" placeholder="Ajouter un exercice">
          <button class="btn btn-secondary" data-add-tpl-ex>+</button>
        </div>
      </div>
    `;
  }

  function bindTemplateCard(content, t) {
    const card = content.querySelector(`[data-tpl-id="${t.id}"]`);
    if (!card) return;

    card.querySelector('.tpl-name').addEventListener('change', e => {
      DB.updateTemplate(t.id, { name: e.target.value });
    });

    card.querySelector('[data-del-tpl]').addEventListener('click', () => {
      if (confirm(`Supprimer la séance-type "${t.name}" ?`)) {
        DB.deleteTemplate(t.id);
        renderProgramme(content);
      }
    });

    card.querySelectorAll('[data-del-tpl-ex]').forEach(btn => {
      btn.addEventListener('click', () => {
        t.exercises.splice(Number(btn.dataset.delTplEx), 1);
        DB.updateTemplate(t.id, { exercises: t.exercises });
        renderProgramme(content);
      });
    });

    const bindField = (attr, key, parse) => {
      card.querySelectorAll(`[${attr}]`).forEach(inp => {
        inp.addEventListener('change', () => {
          t.exercises[Number(inp.getAttribute(attr))][key] = parse(inp.value);
          DB.updateTemplate(t.id, { exercises: t.exercises });
        });
      });
    };
    bindField('data-tpl-sets', 'targetSets', v => (v ? Number(v) : null));
    bindField('data-tpl-reps', 'targetReps', v => v.trim());
    bindField('data-tpl-rest', 'restSeconds', v => (v ? Number(v) : null));

    card.querySelector('[data-add-tpl-ex]').addEventListener('click', () => {
      const name = card.querySelector('.tpl-new-ex').value.trim();
      if (!name) return;
      DB.addExerciseToLibrary(name);
      t.exercises.push({ name, targetSets: null, targetReps: '', restSeconds: null });
      DB.updateTemplate(t.id, { exercises: t.exercises });
      renderProgramme(content);
    });
  }

  return { render };
})();
