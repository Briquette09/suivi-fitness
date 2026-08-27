const PoidsView = (() => {
  function render(container) {
    const entries = DB.getWeightEntries();
    const last = entries[entries.length - 1];
    const variation = (days) => {
      if (!entries.length) return null;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffISO = cutoff.toISOString().slice(0, 10);
      const past = [...entries].reverse().find(e => e.date <= cutoffISO);
      if (!past || !last) return null;
      return (last.weight - past.weight).toFixed(1);
    };
    const v7 = variation(7);
    const v30 = variation(30);

    container.innerHTML = `
      <div class="card">
        <div class="stat-row">
          <div class="stat"><div class="stat-value">${last ? last.weight : '—'}</div><div class="stat-label">kg actuel</div></div>
          <div class="stat"><div class="stat-value">${v7 !== null ? (v7 > 0 ? '+' : '') + v7 : '—'}</div><div class="stat-label">7 jours</div></div>
          <div class="stat"><div class="stat-value">${v30 !== null ? (v30 > 0 ? '+' : '') + v30 : '—'}</div><div class="stat-label">30 jours</div></div>
        </div>
      </div>
      <div class="card">
        <h3>Évolution</h3>
        ${Charts.lineChart(entries.map(e => ({ label: shortDate(e.date), value: e.weight })), { unit: 'kg' })}
      </div>
      <div class="card">
        <h3>Ajouter une pesée</h3>
        <input type="date" id="w-date" class="input" value="${DB.todayISO()}">
        <input type="number" step="0.1" inputmode="decimal" id="w-weight" class="input" placeholder="Poids (kg)">
        <button class="btn btn-primary" id="add-weight-btn">+ Enregistrer</button>
      </div>
      <div id="weight-list">
        ${[...entries].reverse().map(e => `
          <div class="card row-inline space-between">
            <div>${formatDate(e.date)} — <strong>${e.weight} kg</strong></div>
            <button class="btn-icon" data-del="${e.id}" aria-label="Supprimer">✕</button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#add-weight-btn').addEventListener('click', () => {
      const date = container.querySelector('#w-date').value || DB.todayISO();
      const weight = Number(container.querySelector('#w-weight').value);
      if (!weight) return;
      DB.addWeightEntry({ date, weight });
      render(container);
    });

    container.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        DB.deleteWeightEntry(btn.dataset.del);
        render(container);
      });
    });
  }

  return { render };
})();
