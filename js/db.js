/* Couche de stockage — tout est persisté en localStorage, rien ne quitte le téléphone. */
const STORAGE_KEY = 'suiviFitness.v1';

const DEFAULT_EXERCISES = [
  'Développé couché', 'Développé militaire', 'Squat', 'Soulevé de terre',
  'Tractions', 'Rowing barre', 'Curl biceps', 'Extensions triceps',
  'Presse à cuisses', 'Fentes', 'Élévations latérales', 'Dips'
];

function defaultData() {
  return {
    workouts: [],
    exerciseLibrary: [...DEFAULT_EXERCISES],
    nutritionEntries: [],
    nutritionGoals: { calories: 2200, protein: 150, carbs: 220, fat: 70 },
    favoriteFoods: [],
    weightEntries: [],
    cardioEntries: []
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultData(), parsed);
  } catch (e) {
    console.error('Erreur de lecture des données, réinitialisation.', e);
    return defaultData();
  }
}

let data = load();

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
    const w = { id: uid(), date: todayISO(), name: '', exercises: [], ...workout };
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
