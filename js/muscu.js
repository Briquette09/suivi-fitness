const MuscuView = (() => {
  let subTab = 'seance'; // seance | historique | progression
  let openWorkoutId = null;
  let progressionExercise = null;
  let timerUnsub = null;

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

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function stopWatchingTimer() {
    if (timerUnsub) { timerUnsub(); timerUnsub = null; }
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

  function render(container) {
    container.innerHTML = `
      <div class="subtabs">
        <button data-sub="seance" class="${subTab === 'seance' ? 'active' : ''}">Séance</button>
        <button data-sub="programme" class="${subTab === 'programme' ? 'active' : ''}">Programme</button>
        <button data-sub="historique" class="${subTab === 'historique' ? 'active' : ''}">Historique</button>
        <button data-sub="progression" class="${subTab === 'progression' ? 'active' : ''}">Progression</button>
      </div>
      <div id="muscu-content"></div>
    `;
    container.querySelectorAll('[data-sub]').forEach(btn => {
      btn.addEventListener('click', () => { subTab = btn.dataset.sub; render(container); });
    });
    const content = container.querySelector('#muscu-content');
    stopWatchingTimer();
    if (subTab === 'seance') renderSeance(content);
    else if (subTab === 'programme') renderProgramme(content);
    else if (subTab === 'historique') renderHistorique(content);
    else renderProgression(content);
  }

  function renderSeance(content) {
    stopWatchingTimer();
    const w = ensureTodayWorkout();
    content.innerHTML = `
      <div class="card timer-card">
        <div class="timer-display" id="timer-display">${formatTime(RestTimer.getRemaining())}</div>
        <div class="timer-presets">
          ${[30, 60, 90, 120, 180].map(s => `<button class="btn btn-secondary timer-preset" data-preset="${s}">${s < 60 ? s + 's' : (s / 60) + 'min'}</button>`).join('')}
        </div>
        <div class="row-inline">
          <button class="btn btn-secondary" id="timer-minus">-15s</button>
          <button class="btn btn-secondary" id="timer-stop">Stop</button>
          <button class="btn btn-secondary" id="timer-plus">+15s</button>
        </div>
      </div>
      <div class="card">
        <input type="text" id="w-name" class="input" placeholder="Nom de la séance (ex: Push day)" value="${escapeAttr(w.name || '')}">
        <div class="small-muted">${formatDate(w.date)}</div>
      </div>
      ${w.exercises.filter(isTargetReached).length ? `
        <div class="card alert-card">
          🎯 Objectif atteint sur ${w.exercises.filter(isTargetReached).length > 1 ? 'ces exercices' : 'cet exercice'} : ${w.exercises.filter(isTargetReached).map(ex => escapeHtml(ex.name)).join(', ')}.
          Augmente la charge la prochaine fois (+ le plus petit disque dispo).
        </div>
      ` : ''}
      ${w.exercises.length === 0 && DB.getTemplates().length ? `
        <div class="card">
          <h3>Démarrer depuis un modèle</h3>
          <div class="template-chips">
            ${DB.getTemplates().map(t => `<button class="btn btn-secondary" data-load-tpl="${t.id}">${escapeHtml(t.name)}</button>`).join('')}
          </div>
        </div>
      ` : ''}
      <div id="exercise-list">${w.exercises.map((ex, i) => exerciseCard(ex, i, w)).join('')}</div>
      <div class="card">
        <div class="row-inline">
          <input type="text" id="new-ex-name" class="input" list="exercise-options" placeholder="Ajouter un exercice">
          <button class="btn btn-primary" id="add-ex-btn">+ Exercice</button>
        </div>
        <datalist id="exercise-options">
          ${DB.getExerciseLibrary().map(e => `<option value="${escapeAttr(e)}">`).join('')}
        </datalist>
      </div>
      <button class="btn btn-primary btn-block" id="finish-workout-btn">✅ Terminer la séance</button>
    `;

    content.querySelector('#w-name').addEventListener('change', e => {
      DB.updateWorkout(w.id, { name: e.target.value });
    });

    content.querySelector('#add-ex-btn').addEventListener('click', () => {
      const input = content.querySelector('#new-ex-name');
      const name = input.value.trim();
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

    content.querySelector('#finish-workout-btn').addEventListener('click', () => {
      if (!w.exercises.length || w.exercises.every(ex => !ex.sets.length)) {
        DB.deleteWorkout(w.id);
      } else {
        DB.updateWorkout(w.id, { completed: true, completedAt: new Date().toISOString() });
        toast('Séance terminée 💪');
      }
      openWorkoutId = null;
      RestTimer.reset();
      renderSeance(content);
    });

    bindTimer(content);
    bindExerciseCards(content, w);
  }

  function bindTimer(content) {
    const update = () => {
      const el = content.querySelector('#timer-display');
      if (!el) return;
      el.textContent = formatTime(RestTimer.getRemaining());
      el.classList.toggle('timer-running', RestTimer.isRunning());
    };
    update();
    timerUnsub = RestTimer.subscribe(update);

    content.querySelectorAll('.timer-preset').forEach(btn => {
      btn.addEventListener('click', () => RestTimer.start(Number(btn.dataset.preset)));
    });
    content.querySelector('#timer-stop').addEventListener('click', () => RestTimer.reset());
    content.querySelector('#timer-minus').addEventListener('click', () => RestTimer.addSeconds(-15));
    content.querySelector('#timer-plus').addEventListener('click', () => RestTimer.addSeconds(15));
  }

  function targetLabel(target) {
    if (!target || (!target.sets && !target.reps && !target.restSeconds)) return '';
    const parts = [];
    if (target.sets) parts.push(`${target.sets} séries`);
    if (target.reps) parts.push(`${target.reps} reps`);
    if (target.restSeconds) parts.push(`repos ${target.restSeconds}s`);
    return `<div class="small-muted">Objectif : ${parts.join(' · ')}</div>`;
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

  function lastTimeLabel(last) {
    if (!last) return '';
    const sets = last.ex.sets.map(s => `${s.reps}×${s.weight}`).join(' · ');
    const hint = isTargetReached(last.ex)
      ? '<div class="small-muted progress-hint">🎯 Objectif validé la dernière fois → monte la charge</div>'
      : '';
    return `<div class="small-muted last-time">Dernière fois (${shortDate(last.date)}) : ${sets} kg</div>${hint}`;
  }

  function exerciseCard(ex, i, w) {
    const last = lastPerformance(ex.name, w.id);
    const prefill = prefillValues(ex, last);
    return `
      <div class="card exercise-card" data-ex-index="${i}">
        <div class="row-inline space-between">
          <strong>${escapeHtml(ex.name)}</strong>
          <button class="btn-icon" data-remove-ex="${i}" aria-label="Supprimer">✕</button>
        </div>
        ${targetLabel(ex.target)}
        ${lastTimeLabel(last)}
        ${isTargetReached(ex) ? '<div class="badge">🎯 Prêt à monter la charge</div>' : ''}
        <div class="set-list">
          ${ex.sets.map((s, si) => `
            <div class="set-row">
              <span class="set-num">${si + 1}</span>
              <span>${s.reps} reps × ${s.weight} kg</span>
              <button class="btn-icon" data-remove-set="${i}:${si}" aria-label="Supprimer la série">✕</button>
            </div>
          `).join('') || '<div class="small-muted">Aucune série</div>'}
        </div>
        <div class="row-inline">
          <input type="number" inputmode="numeric" class="input input-small" placeholder="Reps" data-reps-for="${i}" value="${prefill.reps}">
          <input type="number" inputmode="decimal" class="input input-small" placeholder="Kg" data-weight-for="${i}" value="${prefill.weight}">
          <button class="btn btn-secondary" data-add-set="${i}">+ Série</button>
        </div>
      </div>
    `;
  }

  function bindExerciseCards(content, w) {
    content.querySelectorAll('[data-reps-for], [data-weight-for]').forEach(inp => {
      inp.addEventListener('focus', () => inp.select());
    });
    content.querySelectorAll('[data-remove-ex]').forEach(btn => {
      btn.addEventListener('click', () => {
        w.exercises.splice(Number(btn.dataset.removeEx), 1);
        DB.updateWorkout(w.id, { exercises: w.exercises });
        renderSeance(content);
      });
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
          toast(`🎯 ${ex.name} : augmente la charge la prochaine fois !`);
        }
        renderSeance(content);
      });
    });
  }

  function renderHistorique(content) {
    const workouts = DB.getWorkouts();
    if (!workouts.length) {
      content.innerHTML = `<div class="card small-muted">Aucune séance enregistrée pour le moment.</div>`;
      return;
    }
    content.innerHTML = workouts.map(w => `
      <div class="card">
        <div class="row-inline space-between">
          <div>
            <strong>${escapeHtml(w.name || 'Séance')}</strong>
            ${w.completed ? '' : '<span class="badge">En cours</span>'}
            <div class="small-muted">${formatDate(w.date)} · ${w.exercises.length} exercice(s)</div>
          </div>
          <div class="row-inline">
            <button class="btn btn-secondary" data-open="${w.id}">Ouvrir</button>
            <button class="btn-icon" data-del="${w.id}" aria-label="Supprimer">✕</button>
          </div>
        </div>
        ${w.exercises.map(ex => `<div class="small-muted">${escapeHtml(ex.name)} — ${ex.sets.length} série(s)</div>`).join('')}
      </div>
    `).join('');
    content.querySelectorAll('[data-open]').forEach(btn => {
      btn.addEventListener('click', () => {
        openWorkoutId = btn.dataset.open;
        subTab = 'seance';
        render(document.getElementById('view'));
      });
    });
    content.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Supprimer cette séance ?')) {
          DB.deleteWorkout(btn.dataset.del);
          renderHistorique(content);
        }
      });
    });
  }

  function renderProgression(content) {
    const exercises = DB.getExerciseLibrary();
    if (!progressionExercise && exercises.length) progressionExercise = exercises[0];
    const history = progressionExercise ? DB.getExerciseHistory(progressionExercise) : [];
    content.innerHTML = `
      <div class="card">
        <select id="prog-select" class="input">
          ${exercises.map(e => `<option value="${escapeAttr(e)}" ${e === progressionExercise ? 'selected' : ''}>${escapeHtml(e)}</option>`).join('')}
        </select>
      </div>
      <div class="card">
        <h3>Charge max (kg)</h3>
        ${Charts.lineChart(history.map(h => ({ label: shortDate(h.date), value: h.maxWeight })), { unit: 'kg' })}
      </div>
      <div class="card">
        <h3>Volume total (reps × kg)</h3>
        ${Charts.lineChart(history.map(h => ({ label: shortDate(h.date), value: h.volume })), { unit: '' })}
      </div>
    `;
    content.querySelector('#prog-select')?.addEventListener('change', e => {
      progressionExercise = e.target.value;
      renderProgression(content);
    });
  }

  function renderProgramme(content) {
    const templates = DB.getTemplates();
    content.innerHTML = `
      <div class="card small-muted">Crée des modèles de séance (ex: Push, Pull, Legs) avec les exercices, l'objectif séries/reps et le temps de repos. Charge-les ensuite en un clic depuis l'onglet Séance.</div>
      <div id="templates-list">${templates.map(t => templateCard(t)).join('')}</div>
      <button class="btn btn-primary btn-block" id="add-template-btn">+ Nouveau modèle</button>
      <datalist id="exercise-options">
        ${DB.getExerciseLibrary().map(e => `<option value="${escapeAttr(e)}">`).join('')}
      </datalist>
    `;

    content.querySelector('#add-template-btn').addEventListener('click', () => {
      DB.addTemplate({ name: 'Nouveau modèle', exercises: [] });
      renderProgramme(content);
    });

    templates.forEach(t => bindTemplateCard(content, t));
  }

  function templateCard(t) {
    return `
      <div class="card" data-tpl-id="${t.id}">
        <div class="row-inline space-between">
          <input type="text" class="input tpl-name" value="${escapeAttr(t.name)}" placeholder="Nom du modèle (ex: Push)">
          <button class="btn-icon" data-del-tpl aria-label="Supprimer le modèle">✕</button>
        </div>
        ${t.exercises.map((te, i) => `
          <div class="tpl-exercise-row">
            <div class="row-inline space-between">
              <strong>${escapeHtml(te.name)}</strong>
              <button class="btn-icon" data-del-tpl-ex="${i}" aria-label="Supprimer l'exercice">✕</button>
            </div>
            <div class="row-inline">
              <input type="number" inputmode="numeric" class="input input-small" placeholder="Séries" value="${te.targetSets ?? ''}" data-tpl-sets="${i}">
              <input type="text" class="input input-small" placeholder="Reps (ex 8-10)" value="${escapeAttr(te.targetReps || '')}" data-tpl-reps="${i}">
              <input type="number" inputmode="numeric" class="input input-small" placeholder="Repos (s)" value="${te.restSeconds ?? ''}" data-tpl-rest="${i}">
            </div>
          </div>
        `).join('') || '<div class="small-muted">Aucun exercice</div>'}
        <div class="row-inline">
          <input type="text" class="input tpl-new-ex" list="exercise-options" placeholder="Ajouter un exercice">
          <button class="btn btn-secondary" data-add-tpl-ex>+ Exercice</button>
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
      if (confirm(`Supprimer le modèle "${t.name}" ?`)) {
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

    card.querySelectorAll('[data-tpl-sets]').forEach(inp => {
      inp.addEventListener('change', () => {
        t.exercises[Number(inp.dataset.tplSets)].targetSets = inp.value ? Number(inp.value) : null;
        DB.updateTemplate(t.id, { exercises: t.exercises });
      });
    });
    card.querySelectorAll('[data-tpl-reps]').forEach(inp => {
      inp.addEventListener('change', () => {
        t.exercises[Number(inp.dataset.tplReps)].targetReps = inp.value.trim();
        DB.updateTemplate(t.id, { exercises: t.exercises });
      });
    });
    card.querySelectorAll('[data-tpl-rest]').forEach(inp => {
      inp.addEventListener('change', () => {
        t.exercises[Number(inp.dataset.tplRest)].restSeconds = inp.value ? Number(inp.value) : null;
        DB.updateTemplate(t.id, { exercises: t.exercises });
      });
    });

    card.querySelector('[data-add-tpl-ex]').addEventListener('click', () => {
      const input = card.querySelector('.tpl-new-ex');
      const name = input.value.trim();
      if (!name) return;
      DB.addExerciseToLibrary(name);
      t.exercises.push({ name, targetSets: null, targetReps: '', restSeconds: null });
      DB.updateTemplate(t.id, { exercises: t.exercises });
      renderProgramme(content);
    });
  }

  return { render };
})();
