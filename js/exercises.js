/* Catalogue d'exercices par groupe musculaire — sert à proposer un remplacement.
   Matériel pris en compte : barre, barre EZ, haltères, banc, barre de traction, HG Compact.
   Précautions clavicule : pas de dips, prise neutre privilégiée sur les poussées. */
const ExerciseCatalog = (() => {
  const GROUPS = {
    pectoraux: { label: 'Pectoraux', color: '#f472b6' },
    dos: { label: 'Dos', color: '#22d3ee' },
    epaules: { label: 'Épaules', color: '#a78bfa' },
    biceps: { label: 'Biceps', color: '#fb923c' },
    triceps: { label: 'Triceps', color: '#facc15' },
    quadriceps: { label: 'Quadriceps', color: '#34d399' },
    ischios: { label: 'Ischios', color: '#2dd4bf' },
    fessiers: { label: 'Fessiers', color: '#f87171' },
    mollets: { label: 'Mollets', color: '#60a5fa' },
    abdos: { label: 'Abdos', color: '#fbbf24' }
  };

  const EXERCISES = [
    // Pectoraux
    { name: 'Développé couché barre (amplitude sans douleur)', group: 'pectoraux' },
    { name: 'Développé incliné haltères (prise neutre)', group: 'pectoraux' },
    { name: 'Développé couché haltères (prise neutre)', group: 'pectoraux' },
    { name: 'Floor press haltères (prise neutre)', group: 'pectoraux' },
    { name: 'Pompes (amplitude sans douleur)', group: 'pectoraux' },
    { name: 'Écarté haltères couché (léger)', group: 'pectoraux' },

    // Dos
    { name: 'Rowing barre', group: 'dos' },
    { name: 'Tractions (assistées élastique si besoin)', group: 'dos' },
    { name: 'Tirage poulie haute / lat pulldown (HG Compact)', group: 'dos' },
    { name: 'Tirage poulie haute prise serrée (HG Compact)', group: 'dos' },
    { name: 'Rowing haltère unilatéral', group: 'dos' },
    { name: 'Rowing haltères buste penché', group: 'dos' },
    { name: 'Pull-over haltère', group: 'dos' },

    // Épaules
    { name: 'Développé militaire haltères (prise neutre)', group: 'epaules' },
    { name: 'Élévations latérales haltères', group: 'epaules' },
    { name: 'Oiseau haltères (arrière d\'épaule)', group: 'epaules' },
    { name: 'Face pull poulie haute (HG Compact)', group: 'epaules' },
    { name: 'Développé Arnold haltères', group: 'epaules' },

    // Biceps
    { name: 'Curl barre EZ', group: 'biceps' },
    { name: 'Curl marteau haltères', group: 'biceps' },
    { name: 'Curl haltères alterné', group: 'biceps' },
    { name: 'Curl incliné haltères', group: 'biceps' },
    { name: 'Curl concentré haltère', group: 'biceps' },

    // Triceps
    { name: 'Extensions triceps poulie haute (HG Compact)', group: 'triceps' },
    { name: 'Skull crusher barre EZ (léger)', group: 'triceps' },
    { name: 'Extension triceps haltère au-dessus de la tête', group: 'triceps' },
    { name: 'Kickback haltère', group: 'triceps' },
    { name: 'Pompes prise serrée', group: 'triceps' },
    { name: 'Dips', group: 'triceps', suggest: false },

    // Quadriceps
    { name: 'Squat barre', group: 'quadriceps' },
    { name: 'Leg extension (HG Compact)', group: 'quadriceps' },
    { name: 'Fentes haltères', group: 'quadriceps' },
    { name: 'Goblet squat haltère', group: 'quadriceps' },
    { name: 'Fentes bulgares haltères', group: 'quadriceps' },
    { name: 'Step-up sur banc haltères', group: 'quadriceps' },

    // Ischios
    { name: 'Soulevé de terre roumain (RDL)', group: 'ischios' },
    { name: 'Leg curl (HG Compact)', group: 'ischios' },
    { name: 'Soulevé de terre roumain haltères', group: 'ischios' },
    { name: 'Good morning barre (léger)', group: 'ischios' },

    // Fessiers
    { name: 'Hip thrust barre (dos sur le banc)', group: 'fessiers' },
    { name: 'Hip thrust unilatéral', group: 'fessiers' },
    { name: 'Pont fessier au sol (haltère)', group: 'fessiers' },
    { name: 'Fentes arrière haltères', group: 'fessiers' },

    // Mollets
    { name: 'Mollets debout (haltère en main)', group: 'mollets' },
    { name: 'Mollets debout', group: 'mollets' },
    { name: 'Mollets unilatéral haltère', group: 'mollets' },
    { name: 'Mollets assis (haltère sur les genoux)', group: 'mollets' },

    // Abdos
    { name: 'Gainage planche', group: 'abdos' },
    { name: 'Relevé de jambes (barre de traction)', group: 'abdos' },
    { name: 'Relevé de genoux suspendu', group: 'abdos' },
    { name: 'Gainage latéral', group: 'abdos' },
    { name: 'Crunch', group: 'abdos' },
    { name: 'Dead bug', group: 'abdos' }
  ];

  // Pour les exercices ajoutés à la main : on devine le groupe d'après le nom (ordre = priorité).
  const KEYWORDS = [
    ['leg curl', 'ischios'], ['leg extension', 'quadriceps'], ['militaire', 'epaules'], ['arnold', 'epaules'],
    ['élévation', 'epaules'], ['elevation', 'epaules'], ['oiseau', 'epaules'], ['face pull', 'epaules'],
    ['triceps', 'triceps'], ['skull', 'triceps'], ['kickback', 'triceps'], ['dips', 'triceps'],
    ['curl', 'biceps'], ['développé', 'pectoraux'], ['developpe', 'pectoraux'], ['pompe', 'pectoraux'],
    ['écarté', 'pectoraux'], ['rowing', 'dos'], ['tirage', 'dos'], ['traction', 'dos'], ['pull-over', 'dos'],
    ['squat', 'quadriceps'], ['fente', 'quadriceps'], ['presse', 'quadriceps'], ['soulevé', 'ischios'],
    ['hip thrust', 'fessiers'], ['fessier', 'fessiers'], ['mollet', 'mollets'], ['gainage', 'abdos'],
    ['relevé', 'abdos'], ['crunch', 'abdos'], ['abdo', 'abdos']
  ];

  function groupOf(name) {
    if (!name) return null;
    const exact = EXERCISES.find(e => e.name === name);
    if (exact) return exact.group;
    const lower = name.toLowerCase();
    const hit = KEYWORDS.find(([kw]) => lower.includes(kw));
    return hit ? hit[1] : null;
  }

  function groupInfo(name) {
    const g = groupOf(name);
    return g ? { key: g, ...GROUPS[g] } : null;
  }

  function alternatives(name, excludeNames = []) {
    const g = groupOf(name);
    if (!g) return [];
    return EXERCISES
      .filter(e => e.group === g && e.suggest !== false && e.name !== name && !excludeNames.includes(e.name))
      .map(e => e.name);
  }

  return { GROUPS, EXERCISES, groupOf, groupInfo, alternatives };
})();

window.ExerciseCatalog = ExerciseCatalog;
