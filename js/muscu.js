const MuscuView = (() => {
  let subTab = 'seance'; // seance | historique | progression
  let openWorkoutId = null;
  let progressionExercise = null;

  function ensureTodayWorkout() {
    const today = DB.todayISO();
    let w = DB.getWorkouts().find(x => x.date === today && x.id === openWorkoutId);
    if (w) return w;
    w = DB.getWorkouts().find(x => x.date === today);
    if (!w) w = DB.addWorkout({ date: today });
    openWorkoutId = w.id;
    return w;
  }

  function render(container) {
    container.innerHTML = `
      <div class="subtabs">
        <button data-sub="seance" class="${subTab === 'seance' ? 'active' : ''}">Séance</button>
        <button data-sub="historique" class="${subTab === 'historique' ? 'active' : ''}">Historique</button>
        <button data-sub="progression" class="${subTab === 'progression' ? 'active' : ''}">Progression</button>
      </div>
      <div id="muscu-content"></div>
    `;
    container.querySelectorAll('[data-sub]').forEach(btn => {
      btn.addEventListener('click', () => { subTab = btn.dataset.sub; render(container); });
    });
    const content = container.querySelector('#muscu-content');
    if (subTab === 'seance') renderSeance(content);
    else if (subTab === 'historique') renderHistorique(content);
    else renderProgression(content);
  }

  function renderSeance(content) {
    const w = ensureTodayWorkout();
    content.innerHTML = `
      <div class="card">
        <input type="text" id="w-name" class="input" placeholder="Nom de la séance (ex: Push day)" value="${escapeAttr(w.name || '')}">
        <div class="small-muted">${formatDate(w.date)}</div>
      </div>
      <div id="exercise-list">${w.exercises.map((ex, i) => exerciseCard(ex, i)).join('')}</div>
      <div class="card">
        <div class="row-inline">
          <input type="text" id="new-ex-name" class="input" list="exercise-options" placeholder="Ajouter un exercice">
          <button class="btn btn-primary" id="add-ex-btn">+ Exercice</button>
        </div>
        <datalist id="exercise-options">
          ${DB.getExerciseLibrary().map(e => `<option value="${escapeAttr(e)}">`).join('')}
        </datalist>
      </div>
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

    bindExerciseCards(content, w);
  }

  function exerciseCard(ex, i) {
    return `
      <div class="card exercise-card" data-ex-index="${i}">
        <div class="row-inline space-between">
          <strong>${escapeHtml(ex.name)}</strong>
          <button class="btn-icon" data-remove-ex="${i}" aria-label="Supprimer">✕</button>
        </div>
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
          <input type="number" inputmode="numeric" class="input input-small" placeholder="Reps" data-reps-for="${i}">
          <input type="number" inputmode="decimal" class="input input-small" placeholder="Kg" data-weight-for="${i}">
          <button class="btn btn-secondary" data-add-set="${i}">+ Série</button>
        </div>
      </div>
    `;
  }

  function bindExerciseCards(content, w) {
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
        w.exercises[exi].sets.push({ reps, weight: weight || 0 });
        DB.updateWorkout(w.id, { exercises: w.exercises });
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

  return { render };
})();
