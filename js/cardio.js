const CardioView = (() => {
  const TYPES = ['Course', 'Vélo', 'Natation', 'Marche', 'Rameur', 'Autre'];

  function render(container) {
    const entries = DB.getCardioEntries();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoISO = weekAgo.toISOString().slice(0, 10);
    const weekEntries = entries.filter(e => e.date >= weekAgoISO);
    const weekDuration = weekEntries.reduce((s, e) => s + (Number(e.duration) || 0), 0);

    container.innerHTML = `
      <div class="card">
        <div class="stat-row">
          <div class="stat"><div class="stat-value">${weekEntries.length}</div><div class="stat-label">séances (7j)</div></div>
          <div class="stat"><div class="stat-value">${weekDuration}</div><div class="stat-label">min (7j)</div></div>
        </div>
      </div>
      <div class="card">
        <h3>Ajouter une séance</h3>
        <select id="c-type" class="input">
          ${TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
        <input type="date" id="c-date" class="input" value="${DB.todayISO()}">
        <div class="row-inline">
          <input type="number" inputmode="numeric" id="c-duration" class="input input-small" placeholder="Durée (min)">
          <input type="number" step="0.1" inputmode="decimal" id="c-distance" class="input input-small" placeholder="Distance (km)">
        </div>
        <button class="btn btn-primary" id="add-cardio-btn">+ Ajouter</button>
      </div>
      <div id="cardio-list">
        ${entries.map(e => `
          <div class="card row-inline space-between">
            <div>
              <strong>${escapeHtml(e.type)}</strong>
              <div class="small-muted">${formatDate(e.date)} · ${e.duration} min${e.distance ? ' · ' + e.distance + ' km' : ''}</div>
            </div>
            <button class="btn-icon" data-del="${e.id}" aria-label="Supprimer">✕</button>
          </div>
        `).join('') || '<div class="card small-muted">Aucune séance enregistrée.</div>'}
      </div>
    `;

    container.querySelector('#add-cardio-btn').addEventListener('click', () => {
      const duration = Number(container.querySelector('#c-duration').value);
      if (!duration) return;
      DB.addCardioEntry({
        type: container.querySelector('#c-type').value,
        date: container.querySelector('#c-date').value || DB.todayISO(),
        duration,
        distance: container.querySelector('#c-distance').value ? Number(container.querySelector('#c-distance').value) : null
      });
      render(container);
    });

    container.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        DB.deleteCardioEntry(btn.dataset.del);
        render(container);
      });
    });
  }

  return { render };
})();
