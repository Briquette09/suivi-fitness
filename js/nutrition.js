const NutritionView = (() => {
  let subTab = 'jour';
  let currentDate = DB.todayISO();

  function render(container) {
    container.innerHTML = `
      <div class="subtabs">
        <button data-sub="jour" class="${subTab === 'jour' ? 'active' : ''}">Journée</button>
        <button data-sub="objectifs" class="${subTab === 'objectifs' ? 'active' : ''}">Objectifs</button>
      </div>
      <div id="nutrition-content"></div>
    `;
    container.querySelectorAll('[data-sub]').forEach(btn => {
      btn.addEventListener('click', () => { subTab = btn.dataset.sub; render(container); });
    });
    const content = container.querySelector('#nutrition-content');
    if (subTab === 'jour') renderJour(content);
    else renderObjectifs(content);
  }

  function shiftDate(days) {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    currentDate = d.toISOString().slice(0, 10);
  }

  function renderJour(content) {
    const entries = DB.getNutritionEntries(currentDate);
    const goals = DB.getNutritionGoals();
    const totals = entries.reduce((acc, e) => {
      acc.calories += Number(e.calories) || 0;
      acc.protein += Number(e.protein) || 0;
      acc.carbs += Number(e.carbs) || 0;
      acc.fat += Number(e.fat) || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const meals = ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Collation'];
    const favorites = DB.getFavoriteFoods();

    content.innerHTML = `
      <div class="card">
        <div class="row-inline space-between">
          <button class="btn-icon" id="prev-day">‹</button>
          <strong>${formatDate(currentDate)}</strong>
          <button class="btn-icon" id="next-day">›</button>
        </div>
      </div>
      <div class="card">
        ${progressBar('Calories', totals.calories, goals.calories, 'kcal')}
        ${progressBar('Protéines', totals.protein, goals.protein, 'g')}
        ${progressBar('Glucides', totals.carbs, goals.carbs, 'g')}
        ${progressBar('Lipides', totals.fat, goals.fat, 'g')}
      </div>
      <div id="entries-list">
        ${meals.map(meal => {
          const mealEntries = entries.filter(e => e.meal === meal);
          if (!mealEntries.length) return '';
          return `
            <div class="card">
              <h3>${meal}</h3>
              ${mealEntries.map(e => `
                <div class="row-inline space-between">
                  <div>
                    <div>${escapeHtml(e.name)}</div>
                    <div class="small-muted">${e.calories} kcal · P${e.protein} G${e.carbs} L${e.fat}</div>
                  </div>
                  <button class="btn-icon" data-del="${e.id}" aria-label="Supprimer">✕</button>
                </div>
              `).join('')}
            </div>
          `;
        }).join('')}
      </div>
      <div class="card">
        <h3>Ajouter un aliment</h3>
        <select id="meal-select" class="input">
          ${meals.map(m => `<option value="${m}">${m}</option>`).join('')}
        </select>
        <input type="text" id="food-name" class="input" list="favorite-foods" placeholder="Nom de l'aliment">
        <datalist id="favorite-foods">
          ${favorites.map(f => `<option value="${escapeAttr(f.name)}">`).join('')}
        </datalist>
        <div class="row-inline">
          <input type="number" inputmode="numeric" id="food-cal" class="input input-small" placeholder="Kcal">
          <input type="number" inputmode="numeric" id="food-prot" class="input input-small" placeholder="Prot (g)">
        </div>
        <div class="row-inline">
          <input type="number" inputmode="numeric" id="food-carb" class="input input-small" placeholder="Gluc (g)">
          <input type="number" inputmode="numeric" id="food-fat" class="input input-small" placeholder="Lip (g)">
        </div>
        <button class="btn btn-primary" id="add-food-btn">+ Ajouter</button>
      </div>
    `;

    content.querySelector('#prev-day').addEventListener('click', () => { shiftDate(-1); renderJour(content); });
    content.querySelector('#next-day').addEventListener('click', () => { shiftDate(1); renderJour(content); });

    content.querySelector('#food-name').addEventListener('change', e => {
      const fav = favorites.find(f => f.name.toLowerCase() === e.target.value.trim().toLowerCase());
      if (fav) {
        content.querySelector('#food-cal').value = fav.calories;
        content.querySelector('#food-prot').value = fav.protein;
        content.querySelector('#food-carb').value = fav.carbs;
        content.querySelector('#food-fat').value = fav.fat;
      }
    });

    content.querySelector('#add-food-btn').addEventListener('click', () => {
      const name = content.querySelector('#food-name').value.trim();
      if (!name) return;
      DB.addNutritionEntry({
        date: currentDate,
        meal: content.querySelector('#meal-select').value,
        name,
        calories: Number(content.querySelector('#food-cal').value) || 0,
        protein: Number(content.querySelector('#food-prot').value) || 0,
        carbs: Number(content.querySelector('#food-carb').value) || 0,
        fat: Number(content.querySelector('#food-fat').value) || 0
      });
      renderJour(content);
    });

    content.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        DB.deleteNutritionEntry(btn.dataset.del);
        renderJour(content);
      });
    });
  }

  function progressBar(label, value, goal, unit) {
    const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
    return `
      <div class="progress-row">
        <div class="row-inline space-between">
          <span>${label}</span>
          <span class="small-muted">${Math.round(value)} / ${goal} ${unit}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
    `;
  }

  function renderObjectifs(content) {
    const goals = DB.getNutritionGoals();
    content.innerHTML = `
      <div class="card">
        <label>Calories (kcal/jour)</label>
        <input type="number" id="goal-cal" class="input" value="${goals.calories}">
        <label>Protéines (g/jour)</label>
        <input type="number" id="goal-prot" class="input" value="${goals.protein}">
        <label>Glucides (g/jour)</label>
        <input type="number" id="goal-carb" class="input" value="${goals.carbs}">
        <label>Lipides (g/jour)</label>
        <input type="number" id="goal-fat" class="input" value="${goals.fat}">
        <button class="btn btn-primary" id="save-goals">Enregistrer</button>
      </div>
    `;
    content.querySelector('#save-goals').addEventListener('click', () => {
      DB.setNutritionGoals({
        calories: Number(content.querySelector('#goal-cal').value) || 0,
        protein: Number(content.querySelector('#goal-prot').value) || 0,
        carbs: Number(content.querySelector('#goal-carb').value) || 0,
        fat: Number(content.querySelector('#goal-fat').value) || 0
      });
      toast('Objectifs enregistrés');
    });
  }

  return { render };
})();
