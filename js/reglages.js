const ReglagesView = (() => {
  function render(container) {
    container.innerHTML = `
      <div class="card">
        <h3>Sauvegarde</h3>
        <p class="small-muted">Toutes tes données restent sur ce téléphone. Exporte un fichier de sauvegarde pour les transférer sur un autre appareil ou éviter de les perdre.</p>
        <button class="btn btn-primary" id="export-btn">Exporter mes données</button>
        <label class="btn btn-secondary" style="display:block;text-align:center;margin-top:8px;">
          Importer une sauvegarde
          <input type="file" id="import-file" accept="application/json" style="display:none;">
        </label>
      </div>
      <div class="card">
        <h3>Réinitialiser</h3>
        <p class="small-muted">Supprime définitivement toutes les données enregistrées sur ce téléphone.</p>
        <button class="btn btn-danger" id="reset-btn">Tout effacer</button>
      </div>
      <div class="card small-muted">
        Suivi Fitness — application locale, aucune donnée envoyée sur internet.
      </div>
    `;

    container.querySelector('#export-btn').addEventListener('click', () => {
      const blob = new Blob([DB.exportJSON()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suivi-fitness-${DB.todayISO()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    container.querySelector('#import-file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        DB.importJSON(text);
        toast('Import réussi');
        render(container);
      } catch (err) {
        alert('Fichier invalide.');
      }
    });

    container.querySelector('#reset-btn').addEventListener('click', () => {
      if (confirm('Es-tu sûr ? Cette action est irréversible.')) {
        localStorage.clear();
        location.reload();
      }
    });
  }
  return { render };
})();
