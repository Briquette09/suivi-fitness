/* Couche de stockage — tout est persisté en localStorage, rien ne quitte le téléphone. */
const STORAGE_KEY = 'suiviFitness.v1';

const DEFAULT_EXERCISES = [
  'Développé couché', 'Développé militaire', 'Squat', 'Soulevé de terre',
  'Tractions', 'Rowing barre', 'Curl biceps', 'Extensions triceps',
  'Presse à cuisses', 'Fentes', 'Élévations latérales', 'Dips'
];

// Programme Half-Body 3J de Brice (Haut A / Bas A / Haut B / Bas B).
// PROGRAM_VERSION s'incrémente à chaque mise à jour du programme par défaut ;
// seedDefaultProgram() ajoute alors les nouveaux modèles sans toucher à ceux déjà personnalisés par l'utilisateur.
const PROGRAM_VERSION = 1;
const DEFAULT_PROGRAM = [
  {
    name: 'Haut A',
    exercises: [
      { name: 'Développé couché barre (amplitude sans douleur)', targetSets: 4, targetReps: '5-8', restSeconds: 150 },
      { name: 'Rowing barre', targetSets: 4, targetReps: '6-8', restSeconds: 120 },
      { name: 'Développé militaire haltères (prise neutre)', targetSets: 3, targetReps: '8-10', restSeconds: 120 },
      { name: 'Tractions (assistées élastique si besoin)', targetSets: 3, targetReps: '6-10', restSeconds: 120 },
      { name: 'Curl barre EZ', targetSets: 3, targetReps: '8-12', restSeconds: 60 },
      { name: 'Extensions triceps poulie haute (HG Compact)', targetSets: 3, targetReps: '10-12', restSeconds: 60 }
    ]
  },
  {
    name: 'Bas A',
    exercises: [
      { name: 'Squat barre', targetSets: 4, targetReps: '5-8', restSeconds: 150 },
      { name: 'Soulevé de terre roumain (RDL)', targetSets: 3, targetReps: '8-10', restSeconds: 150 },
      { name: 'Leg extension (HG Compact)', targetSets: 3, targetReps: '12-15', restSeconds: 90 },
      { name: 'Leg curl (HG Compact)', targetSets: 3, targetReps: '10-12', restSeconds: 90 },
      { name: 'Mollets debout (haltère en main)', targetSets: 4, targetReps: '12-15', restSeconds: 60 },
      { name: 'Gainage planche', targetSets: 3, targetReps: '30-60 s', restSeconds: 60 }
    ]
  },
  {
    name: 'Haut B',
    exercises: [
      { name: 'Développé incliné haltères (prise neutre)', targetSets: 4, targetReps: '8-10', restSeconds: 120 },
      { name: 'Tirage poulie haute / lat pulldown (HG Compact)', targetSets: 4, targetReps: '8-10', restSeconds: 120 },
      { name: 'Rowing haltère unilatéral', targetSets: 3, targetReps: '10-12', restSeconds: 90 },
      { name: 'Élévations latérales haltères', targetSets: 4, targetReps: '12-15', restSeconds: 60 },
      { name: 'Curl marteau haltères', targetSets: 3, targetReps: '10-12', restSeconds: 60 },
      { name: 'Skull crusher barre EZ (léger)', targetSets: 3, targetReps: '10-12', restSeconds: 60 }
    ]
  },
  {
    name: 'Bas B',
    exercises: [
      { name: 'Fentes haltères', targetSets: 3, targetReps: '10-12 / jambe', restSeconds: 120 },
      { name: 'Hip thrust barre (dos sur le banc)', targetSets: 3, targetReps: '8-12', restSeconds: 120 },
      { name: 'Leg curl (HG Compact)', targetSets: 3, targetReps: '12-15', restSeconds: 90 },
      { name: 'Leg extension (HG Compact)', targetSets: 3, targetReps: '15-20', restSeconds: 90 },
      { name: 'Mollets debout', targetSets: 4, targetReps: '15-20', restSeconds: 60 },
      { name: 'Relevé de jambes (barre de traction)', targetSets: 3, targetReps: '10-15', restSeconds: 60 }
    ]
  }
];

function defaultData() {
  return {
    workouts: [],
    workoutTemplates: [],
    exerciseLibrary: [...DEFAULT_EXERCISES],
    nutritionEntries: [],
    nutritionGoals: { calories: 2200, protein: 150, carbs: 220, fat: 70 },
    favoriteFoods: [],
    weightEntries: [],
    cardioEntries: [],
    programVersion: 0
  };
}

function seedDefaultProgram(d) {
  if (d.programVersion >= PROGRAM_VERSION) return d;
  const existingNames = new Set(d.workoutTemplates.map(t => t.name));
  for (const tpl of DEFAULT_PROGRAM) {
    if (existingNames.has(tpl.name)) continue;
    d.workoutTemplates.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name: tpl.name,
      exercises: tpl.exercises.map(e => ({ ...e }))
    });
    for (const ex of tpl.exercises) {
      if (!d.exerciseLibrary.includes(ex.name)) d.exerciseLibrary.push(ex.name);
    }
  }
  d.programVersion = PROGRAM_VERSION;
  return d;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDefaultProgram(defaultData());
    const parsed = JSON.parse(raw);
    return seedDefaultProgram(Object.assign(defaultData(), parsed));
  } catch (e) {
    console.error('Erreur de lecture des données, réinitialisation.', e);
    return seedDefaultProgram(defaultData());
  }
}

let data = load();
save();

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

const DB = {
  todayISO,

  // Workouts (musculation)
  getWorkouts() { return [...data.workouts].sort((a, b) => b.date.localeCompare(a.date)); },
  addWorkout(workout) {
    const w = { id: uid(), date: todayISO(), name: '', exercises: [], completed: false, ...workout };
    data.workouts.push(w);
    save();
    return w;
  },
  updateWorkout(id, patch) {
    const w = data.workouts.find(x => x.id === id);
    if (!w) return;
    Object.assign(w, patch);
    save();
  },
  deleteWorkout(id) {
    data.workouts = data.workouts.filter(x => x.id !== id);
    save();
  },
  getExerciseLibrary() { return [...data.exerciseLibrary].sort((a, b) => a.localeCompare(b, 'fr')); },
  addExerciseToLibrary(name) {
    const clean = name.trim();
    if (clean && !data.exerciseLibrary.includes(clean)) {
      data.exerciseLibrary.push(clean);
      save();
    }
  },
  // Programme (modèles de séance)
  getTemplates() { return [...data.workoutTemplates].sort((a, b) => a.name.localeCompare(b.name, 'fr')); },
  addTemplate(tpl) {
    const t = { id: uid(), name: 'Nouveau modèle', exercises: [], ...tpl };
    data.workoutTemplates.push(t);
    save();
    return t;
  },
  updateTemplate(id, patch) {
    const t = data.workoutTemplates.find(x => x.id === id);
    if (!t) return;
    Object.assign(t, patch);
    save();
  },
  deleteTemplate(id) {
    data.workoutTemplates = data.workoutTemplates.filter(x => x.id !== id);
    save();
  },

  getExerciseHistory(exerciseName) {
    const points = [];
    for (const w of data.workouts) {
      const ex = w.exercises.find(e => e.name === exerciseName);
      if (!ex || !ex.sets.length) continue;
      const maxWeight = Math.max(...ex.sets.map(s => Number(s.weight) || 0));
      const volume = ex.sets.reduce((sum, s) => sum + (Number(s.reps) || 0) * (Number(s.weight) || 0), 0);
      points.push({ date: w.date, maxWeight, volume });
    }
    return points.sort((a, b) => a.date.localeCompare(b.date));
  },

  // Nutrition
  getNutritionGoals() { return { ...data.nutritionGoals }; },
  setNutritionGoals(goals) { Object.assign(data.nutritionGoals, goals); save(); },
  getNutritionEntries(date) { return data.nutritionEntries.filter(e => e.date === date); },
  getNutritionEntriesRange(startDate) {
    return data.nutritionEntries.filter(e => e.date >= startDate);
  },
  addNutritionEntry(entry) {
    const e = { id: uid(), date: todayISO(), meal: 'Autre', name: '', calories: 0, protein: 0, carbs: 0, fat: 0, ...entry };
    data.nutritionEntries.push(e);
    if (e.name) {
      const exists = data.favoriteFoods.some(f => f.name.toLowerCase() === e.name.toLowerCase());
      if (!exists) {
        data.favoriteFoods.push({ name: e.name, calories: e.calories, protein: e.protein, carbs: e.carbs, fat: e.fat });
        if (data.favoriteFoods.length > 40) data.favoriteFoods.shift();
      }
    }
    save();
    return e;
  },
  deleteNutritionEntry(id) {
    data.nutritionEntries = data.nutritionEntries.filter(e => e.id !== id);
    save();
  },
  getFavoriteFoods() { return [...data.favoriteFoods].sort((a, b) => a.name.localeCompare(b.name, 'fr')); },

  // Poids corporel
  getWeightEntries() { return [...data.weightEntries].sort((a, b) => a.date.localeCompare(b.date)); },
  addWeightEntry(entry) {
    const e = { id: uid(), date: todayISO(), weight: 0, ...entry };
    data.weightEntries = data.weightEntries.filter(x => x.date !== e.date);
    data.weightEntries.push(e);
    save();
    return e;
  },
  deleteWeightEntry(id) {
    data.weightEntries = data.weightEntries.filter(x => x.id !== id);
    save();
  },

  // Cardio / sport
  getCardioEntries() { return [...data.cardioEntries].sort((a, b) => b.date.localeCompare(a.date)); },
  addCardioEntry(entry) {
    const e = { id: uid(), date: todayISO(), type: 'Course', duration: 0, distance: null, ...entry };
    data.cardioEntries.push(e);
    save();
    return e;
  },
  deleteCardioEntry(id) {
    data.cardioEntries = data.cardioEntries.filter(x => x.id !== id);
    save();
  },

  // Export / import (sauvegarde manuelle, utile pour changer de téléphone)
  exportJSON() { return JSON.stringify(data, null, 2); },
  importJSON(json) {
    const parsed = JSON.parse(json);
    data = Object.assign(defaultData(), parsed);
    save();
  }
};

window.DB = DB;
