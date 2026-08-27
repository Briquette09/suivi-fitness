const DashboardView = (() => {
  function render(container) {
    const today = DB.todayISO();
    const goals = DB.getNutritionGoals();
    const todayEntries = DB.getNutritionEntries(today);
    const caloriesToday = todayEntries.reduce((s, e) => s + (Number(e.calories) || 0), 0);

    const weights = DB.getWeightEntries();
    const lastWeight = weights[weights.length - 1];

    const workouts = DB.getWorkouts();
    const lastWorkout = workouts[0];

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoISO = weekAgo.toISOString().slice(0, 10);
    const cardioWeek = DB.getCardioEntries().filter(e => e.date >= weekAgoISO);
    const cardioMinutes = cardioWeek.reduce((s, e) => s + (Number(e.duration) || 0), 0);
    const workoutsWeek = workouts.filter(w => w.date >= weekAgoISO && w.exercises.length).length;

    container.innerHTML = `
      <div class="card">
        <h3>Aujourd'hui</h3>
        <div class="row-inline space-between">
          <span>Calories</span>
          <span class="small-muted">${Math.round(caloriesToday)} / ${goals.calories} kcal</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, Math.round((caloriesToday / goals.calories) * 100) || 0)}%"></div></div>
      </div>
      <div class="card">
        <div class="stat-row">
          <div class="stat"><div class="stat-value">${lastWeight ? lastWeight.weight + ' kg' : '—'}</div><div class="stat-label">Dernier poids</div></div>
          <div class="stat"><div class="stat-value">${workoutsWeek}</div><div class="stat-label">Séances (7j)</div></div>
          <div class="stat"><div class="stat-value">${cardioMinutes}</div><div class="stat-label">Min cardio (7j)</div></div>
        </div>
      </div>
      <div class="card">
        <h3>Dernière séance de muscu</h3>
        ${lastWorkout
          ? `<div>${escapeHtml(lastWorkout.name || 'Séance')} — ${formatDate(lastWorkout.date)}</div>
             <div class="small-muted">${lastWorkout.exercises.length} exercice(s)</div>`
          : '<div class="small-muted">Aucune séance pour le moment.</div>'}
      </div>
    `;
  }
  return { render };
})();
