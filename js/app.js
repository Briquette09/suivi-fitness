function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(str) { return escapeHtml(str); }

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}
function shortDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

let toastTimer = null;
function toast(message) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

const TABS = [
  { id: 'dashboard', label: 'Accueil', icon: '🏠', view: () => DashboardView },
  { id: 'muscu', label: 'Muscu', icon: '🏋️', view: () => MuscuView },
  { id: 'nutrition', label: 'Nutrition', icon: '🍽️', view: () => NutritionView },
  { id: 'poids', label: 'Poids', icon: '⚖️', view: () => PoidsView },
  { id: 'cardio', label: 'Cardio', icon: '🏃', view: () => CardioView },
  { id: 'reglages', label: 'Réglages', icon: '⚙️', view: () => ReglagesView }
];

let activeTab = 'dashboard';

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = TABS.map(t => `
    <button class="nav-btn ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}">
      <span class="nav-icon">${t.icon}</span>
      <span class="nav-label">${t.label}</span>
    </button>
  `).join('');
  nav.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      renderNav();
      renderView();
    });
  });
}

function renderView() {
  const view = document.getElementById('view');
  const tab = TABS.find(t => t.id === activeTab);
  document.getElementById('header-title').textContent = tab.label;
  tab.view().render(view);
}

function init() {
  renderNav();
  renderView();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW registration failed', err));
  }
}

document.addEventListener('DOMContentLoaded', init);
