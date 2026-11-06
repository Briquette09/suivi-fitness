/* Contenu du panneau ⚙️ : sauvegarde / restauration / remise à zéro. */
const ReglagesView = (() => {
  function render(container) {
    container.innerHTML = `
      <h3 class="sheet-title">Sauvegarde</h3>
      <p class="small-muted">Tes données restent sur ce téléphone. Exporte un fichier de temps en temps pour ne rien perdre (ou pour changer de téléphone).</p>
      <button class="btn btn-primary btn-block" id="export-btn">⬇️ Exporter mes données</button>
      <label class="btn btn-secondary btn-block">
        ⬆️ Importer une sauvegarde
        <input type="file" id="import-file" accept="application/json" hidden>
      </label>
      <h3 class="sheet-title">Réinitialiser</h3>
      <p class="small-muted">Efface définitivement toutes les données de ce téléphone.</p>
      <button class="btn btn-danger btn-block" id="reset-btn">Tout effacer</button>
    `;

    container.querySelector('#export-btn').addEventListener('click', () => {
      const blob = new Blob([DB.exportJSON()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suivi-muscu-${DB.todayISO()}.json`;
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
        location.reload();
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
