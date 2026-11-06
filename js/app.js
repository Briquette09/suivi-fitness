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
function toast(message, duration = 2200) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

/* Panneau qui monte du bas de l'écran. render(body, close) remplit le contenu. */
function openSheet(render) {
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = '<div class="sheet"><div class="sheet-handle"></div><div class="sheet-body"></div></div>';
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  const close = () => {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 250);
  };
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  render(overlay.querySelector('.sheet-body'), close);
  return close;
}

const TABS = [
  { id: 'seance', label: 'Séance', icon: '🏋️' },
  { id: 'programme', label: 'Programme', icon: '📋' },
  { id: 'historique', label: 'Historique', icon: '📅' },
  { id: 'progres', label: 'Progrès', icon: '📈' }
];

let activeTab = 'seance';

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = TABS.map(t => `
    <button class="nav-btn ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}">
      <span class="nav-icon">${t.icon}</span>
      <span class="nav-label">${t.label}</span>
    </button>
  `).join('');
  nav.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => goTo(btn.dataset.tab));
  });
}

function renderView() {
  const view = document.getElementById('view');
  const tab = TABS.find(t => t.id === activeTab);
  document.getElementById('header-title').textContent = tab.label;
  MuscuView.render(view, activeTab);
}

function goTo(tabId) {
  activeTab = tabId;
  renderNav();
  renderView();
  document.getElementById('view').scrollTop = 0;
}

function init() {
  renderNav();
  renderView();
  TimerWidget.init();

  document.getElementById('settings-btn').addEventListener('click', () => {
    openSheet(body => ReglagesView.render(body));
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW registration failed', err));
  }
}

window.App = { goTo };

document.addEventListener('DOMContentLoaded', init);
