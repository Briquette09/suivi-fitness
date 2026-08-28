const NutritionView = (() => {
  let subTab = 'jour';
  let currentDate = DB.todayISO();
  let selectedFood = null; // { type: 'db', food } | { type: 'favorite', food }

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
        <input type="text" id="food-search" class="input" placeholder="Rechercher un aliment (ex : poulet, riz, pomme...)" autocomplete="off">
        <div id="food-suggestions" class="suggestion-list"></div>
        <div id="food-selected"></div>
        <details class="manual-food">
          <summary>Aliment personnalisé (saisie manuelle)</summary>
          <input type="text" id="food-name" class="input" placeholder="Nom de l'aliment">
          <div class="row-inline">
            <input type="number" inputmode="numeric" id="food-cal" class="input input-small" placeholder="Kcal">
            <input type="number" inputmode="numeric" id="food-prot" class="input input-small" placeholder="Prot (g)">
          </div>
          <div class="row-inline">
            <input type="number" inputmode="numeric" id="food-carb" class="input input-small" placeholder="Gluc (g)">
            <input type="number" inputmode="numeric" id="food-fat" class="input input-small" placeholder="Lip (g)">
          </div>
          <button class="btn btn-secondary" id="add-food-btn">+ Ajouter (manuel)</button>
        </details>
      </div>
    `;

    content.querySelector('#prev-day').addEventListener('click', () => { shiftDate(-1); renderJour(content); });
    content.querySelector('#next-day').addEventListener('click', () => { shiftDate(1); renderJour(content); });

    content.querySelector('#food-search').addEventListener('input', () => updateSuggestions(content));

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
      selectedFood = null;
      renderJour(content);
    });

    content.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        DB.deleteNutritionEntry(btn.dataset.del);
        renderJour(content);
      });
    });

    if (selectedFood) renderSelectedFood(content);
  }

  function updateSuggestions(content) {
    const query = content.querySelector('#food-search').value;
    const box = content.querySelector('#food-suggestions');
    if (!query.trim()) { box.innerHTML = ''; return; }
    const q = query.trim().toLowerCase();
    const dbResults = FoodDB.search(query);
    const favResults = DB.getFavoriteFoods().filter(f => f.name.toLowerCase().includes(q)).slice(0, 5);
    if (!dbResults.length && !favResults.length) {
      box.innerHTML = '<div class="small-muted">Aucun résultat — utilise la saisie manuelle ci-dessous.</div>';
      return;
    }
    box.innerHTML = `
      ${favResults.map(f => `
        <button type="button" class="suggestion-item" data-fav="${escapeAttr(f.name)}">
          ${escapeHtml(f.name)} <span class="small-muted">· ${f.calories} kcal (déjà enregistré)</span>
        </button>
      `).join('')}
      ${dbResults.map(f => `
        <button type="button" class="suggestion-item" data-db="${escapeAttr(f.name)}">
          ${escapeHtml(f.name)} <span class="small-muted">· ${f.kcal} kcal/100g</span>
        </button>
      `).join('')}
    `;
    box.querySelectorAll('[data-db]').forEach(btn => {
      btn.addEventListener('click', () => {
        const food = FoodDB.FOODS.find(f => f.name === btn.dataset.db);
        selectedFood = { type: 'db', food, qty: 100 };
        content.querySelector('#food-search').value = '';
        box.innerHTML = '';
        renderSelectedFood(content);
      });
    });
    box.querySelectorAll('[data-fav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const food = DB.getFavoriteFoods().find(f => f.name === btn.dataset.fav);
        selectedFood = { type: 'favorite', food };
        content.querySelector('#food-search').value = '';
        box.innerHTML = '';
        renderSelectedFood(content);
      });
    });
  }

  function renderSelectedFood(content) {
    const box = content.querySelector('#food-selected');
    if (!selectedFood) { box.innerHTML = ''; return; }
    const { type, food } = selectedFood;

    if (type === 'db') {
      const qty = selectedFood.qty || 100;
      const computed = {
        calories: Math.round(food.kcal * qty / 100),
        protein: Math.round(food.protein * qty / 100 * 10) / 10,
        carbs: Math.round(food.carbs * qty / 100 * 10) / 10,
        fat: Math.round(food.fat * qty / 100 * 10) / 10
      };
      box.innerHTML = `
        <div class="card selected-food-card">
          <strong>${escapeHtml(food.name)}</strong> <span class="small-muted">(base pour 100g)</span>
          <div class="row-inline">
            <input type="number" id="food-qty" class="input input-small" value="${qty}" min="1">
            <span class="small-muted">grammes</span>
          </div>
          <div class="small-muted" id="food-computed">${computed.calories} kcal · P${computed.protein} G${computed.carbs} L${computed.fat}</div>
          <div class="row-inline">
            <button class="btn btn-primary" id="confirm-select-btn">+ Ajouter</button>
            <button class="btn btn-secondary" id="cancel-select-btn">Annuler</button>
          </div>
        </div>
      `;
      box.querySelector('#food-qty').addEventListener('input', e => {
        selectedFood.qty = Number(e.target.value) || 0;
        renderSelectedFood(content);
      });
      box.querySelector('#confirm-select-btn').addEventListener('click', () => {
        DB.addNutritionEntry({
          date: currentDate,
          meal: content.querySelector('#meal-select').value,
          name: food.name,
          calories: computed.calories,
          protein: computed.protein,
          carbs: computed.carbs,
          fat: computed.fat
        });
        selectedFood = null;
        renderJour(content);
      });
    } else {
      box.innerHTML = `
        <div class="card selected-food-card">
          <strong>${escapeHtml(food.name)}</strong> <span class="small-muted">(portion déjà enregistrée)</span>
          <div class="small-muted">${food.calories} kcal · P${food.protein} G${food.carbs} L${food.fat}</div>
          <div class="row-inline">
            <button class="btn btn-primary" id="confirm-select-btn">+ Ajouter</button>
            <button class="btn btn-secondary" id="cancel-select-btn">Annuler</button>
          </div>
        </div>
      `;
      box.querySelector('#confirm-select-btn').addEventListener('click', () => {
        DB.addNutritionEntry({
          date: currentDate,
          meal: content.querySelector('#meal-select').value,
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat
        });
        selectedFood = null;
        renderJour(content);
      });
    }

    box.querySelector('#cancel-select-btn').addEventListener('click', () => {
      selectedFood = null;
      renderSelectedFood(content);
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
