/* Chronomètre de repos entre les séries — basé sur un timestamp de fin pour rester précis même en arrière-plan. */
const RestTimer = (() => {
  let endTime = null;
  let duration = 90;
  let intervalId = null;
  const listeners = new Set();

  function notify(event = 'tick') { listeners.forEach(fn => fn(event)); }

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
      osc.onended = () => ctx.close();
    } catch (e) { /* audio indisponible, tant pis */ }
  }

  function tick() {
    if (endTime && Date.now() >= endTime) {
      endTime = null;
      clearInterval(intervalId);
      intervalId = null;
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 300]);
      playBeep();
      notify('end');
      return;
    }
    notify();
  }

  function start(seconds) {
    duration = seconds || duration;
    endTime = Date.now() + duration * 1000;
    if (!intervalId) intervalId = setInterval(tick, 250);
    notify();
  }
  function reset() {
    endTime = null;
    clearInterval(intervalId);
    intervalId = null;
    notify();
  }
  function addSeconds(delta) {
    if (!endTime) return;
    endTime = Math.max(Date.now(), endTime + delta * 1000);
    notify();
  }
  function getRemaining() {
    if (!endTime) return 0;
    return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
  }
  function isRunning() { return endTime !== null; }
  function getDuration() { return duration; }
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  return { start, reset, addSeconds, getRemaining, isRunning, getDuration, subscribe };
})();

window.RestTimer = RestTimer;
