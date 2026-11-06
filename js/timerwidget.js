/* Chrono flottant : bouton toujours visible (même en scrollant), un tap ouvre le panneau de réglage. */
const TimerWidget = (() => {
  const PRESETS = [30, 60, 90, 120, 150, 180];
  let fab, panel, isOpen = false, doneTimer = null;

  function fmt(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function presetLabel(s) {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r ? `${m}min${r}` : `${m}min`;
  }

  function open() { isOpen = true; panel.classList.add('open'); fab.classList.add('active'); }
  function close() { isOpen = false; panel.classList.remove('open'); fab.classList.remove('active'); }

  function update(event) {
    const running = RestTimer.isRunning();
    const remaining = RestTimer.getRemaining();
    fab.classList.toggle('running', running);
    fab.querySelector('.fab-time').textContent = running ? fmt(remaining) : '';
    panel.querySelector('.tw-display').textContent = fmt(remaining);
    panel.querySelector('.tw-display').classList.toggle('running', running);

    if (event === 'end') {
      fab.classList.add('done');
      panel.querySelector('.tw-display').textContent = 'GO !';
      clearTimeout(doneTimer);
      doneTimer = setTimeout(() => { fab.classList.remove('done'); update(); }, 4000);
    } else if (event === 'tick' && running) {
      fab.classList.remove('done');
    }
  }

  function init() {
    fab = document.createElement('button');
    fab.className = 'timer-fab';
    fab.setAttribute('aria-label', 'Chrono de repos');
    fab.innerHTML = '<span class="fab-icon">⏱️</span><span class="fab-time"></span>';

    panel = document.createElement('div');
    panel.className = 'timer-panel';
    panel.innerHTML = `
      <div class="tw-title">Repos</div>
      <div class="tw-display">0:00</div>
      <div class="tw-presets">
        ${PRESETS.map(s => `<button class="chip" data-preset="${s}">${presetLabel(s)}</button>`).join('')}
      </div>
      <div class="tw-controls">
        <button class="btn btn-secondary" data-act="minus">−15s</button>
        <button class="btn btn-warm" data-act="stop">Stop</button>
        <button class="btn btn-secondary" data-act="plus">+15s</button>
      </div>
    `;

    document.body.append(panel, fab);

    fab.addEventListener('click', e => {
      e.stopPropagation();
      isOpen ? close() : open();
    });
    panel.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', () => { if (isOpen) close(); });

    panel.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => RestTimer.start(Number(btn.dataset.preset)));
    });
    panel.querySelector('[data-act="minus"]').addEventListener('click', () => RestTimer.addSeconds(-15));
    panel.querySelector('[data-act="plus"]').addEventListener('click', () => RestTimer.addSeconds(15));
    panel.querySelector('[data-act="stop"]').addEventListener('click', () => RestTimer.reset());

    RestTimer.subscribe(update);
    update();
  }

  return { init, open, close };
})();

window.TimerWidget = TimerWidget;
