/* Personnage qui se muscle au fil des séances terminées.
   m (0 → 1) pilote toute la morphologie : épaules, bras, pecs, abdos, jambes ; le ventre fond. */
const Avatar = (() => {
  const LEVELS = [
    { min: 0, name: 'Reprise', color: '#60a5fa' },
    { min: 6, name: 'Échauffé', color: '#22d3ee' },
    { min: 15, name: 'Régulier', color: '#34d399' },
    { min: 30, name: 'Costaud', color: '#facc15' },
    { min: 50, name: 'Athlète', color: '#fb923c' },
    { min: 80, name: 'Machine', color: '#f472b6' }
  ];
  const FULL_AT = 100; // nombre de séances pour atteindre la morphologie finale

  const SKIN = '#e9b48c';
  const SKIN_LIGHT = '#f7d2b0';
  const SKIN_SHADE = '#b97b55';
  const HAIR = '#2b1d16';

  let uid = 0;

  function levelFor(count) {
    let index = 0;
    LEVELS.forEach((l, i) => { if (count >= l.min) index = i; });
    const level = LEVELS[index];
    const next = LEVELS[index + 1] || null;
    const progress = next ? (count - level.min) / (next.min - level.min) : 1;
    return { index, level, next, progress: Math.max(0, Math.min(1, progress)), remaining: next ? next.min - count : 0 };
  }

  function muscleFactor(count) {
    return Math.max(0, Math.min(1, count / FULL_AT));
  }

  // Contours de tous les segments d'abord, puis le remplissage : évite l'effet « poupée articulée ».
  function limb(segments) {
    const line = (s, color, extra) =>
      `<line x1="${s[0]}" y1="${s[1]}" x2="${s[2]}" y2="${s[3]}" stroke="${color}" stroke-width="${s[4] + extra}" stroke-linecap="round"/>`;
    return segments.map(s => line(s, SKIN_SHADE, 3)).join('') + segments.map(s => line(s, SKIN, 0)).join('');
  }

  function svg(count, size = 120, opts = {}) {
    const m = opts.m !== undefined ? opts.m : muscleFactor(count);
    const { level } = levelFor(count);
    const id = `av${++uid}`;
    const c = 100;

    const S = 30 + 20 * m;          // demi-largeur d'épaules
    const W = 27 + 1 * m;           // demi-largeur de taille
    const b = 8 * (1 - m);          // ventre
    const nw = 9 + 5 * m;           // demi-largeur du cou
    const ua = 15 + 12 * m;         // épaisseur bras
    const fa = 12 + 8 * m;          // épaisseur avant-bras
    const tw = 20 + 12 * m;         // épaisseur cuisse
    const cw = 14 + 8 * m;          // épaisseur mollet
    const def = Math.max(0, (m - 0.2) / 0.8); // définition musculaire

    const arm = side => {
      const sx = c + side * (S - 3), sy = 92;
      const ex = c + side * (S + 4 + 3 * m), ey = 140;
      const hx = c + side * (S + 6 + 3 * m), hy = 184;
      return `
        ${limb([[sx, sy, ex, ey, ua], [ex, ey, hx, hy, fa]])}
        <ellipse cx="${(sx + ex) / 2 + side * 1}" cy="${(sy + ey) / 2 + 2}" rx="${ua / 2 - 1}" ry="${13 + 3 * m}" fill="${SKIN_LIGHT}" opacity="${0.55 * def}"/>
        <circle cx="${hx}" cy="${hy + 4}" r="${7 + m}" fill="${SKIN}" stroke="${SKIN_SHADE}" stroke-width="1.5"/>`;
    };

    const leg = side => {
      const hx = c + side * (13 + 3 * m), hy = 204;
      const kx = c + side * (16 + 3 * m), ky = 250;
      const ax = c + side * (16 + 2 * m), ay = 286;
      return `
        ${limb([[hx, hy, kx, ky, tw], [kx, ky, ax, ay, cw]])}
        <ellipse cx="${kx + side * 1}" cy="${ky + 14}" rx="${cw / 2 + 2 * m}" ry="12" fill="${SKIN}" />
        <ellipse cx="${(hx + kx) / 2}" cy="${(hy + ky) / 2 + 4}" rx="${tw / 2 - 3}" ry="14" fill="${SKIN_LIGHT}" opacity="${0.45 * def}"/>
        <ellipse cx="${ax + side * 2}" cy="${ay + 6}" rx="12" ry="6" fill="url(#${id}-shoe)" stroke="#0a1230" stroke-width="1.5"/>`;
    };

    const torso = `
      M ${c - nw} 66
      Q ${c - S * 0.6} 70 ${c - S} 84
      Q ${c - S - 3} 112 ${c - W - b} 138
      Q ${c - W - b + 1} 156 ${c - W} 170
      L ${c + W} 170
      Q ${c + W + b - 1} 156 ${c + W + b} 138
      Q ${c + S + 3} 112 ${c + S} 84
      Q ${c + S * 0.6} 70 ${c + nw} 66 Z`;

    const pec = side => `
      <path d="M ${c} 112 Q ${c + side * S * 0.55} 124 ${c + side * (S - 6)} 96"
        fill="none" stroke="${SKIN_SHADE}" stroke-width="2" stroke-linecap="round" opacity="${0.25 + 0.6 * def}"/>
      <ellipse cx="${c + side * S * 0.42}" cy="${102}" rx="${S * 0.36}" ry="${10 + 4 * m}" fill="${SKIN_LIGHT}" opacity="${0.5 * def}"/>
      <circle cx="${c + side * S * 0.45}" cy="${108 + 2 * (1 - m)}" r="2" fill="${SKIN_SHADE}"/>`;

    const abs = [0, 1, 2].map(row => [-1, 1].map(side => `
      <rect x="${side < 0 ? c - 12 : c + 1.5}" y="${124 + row * 13}" width="10.5" height="10.5" rx="4"
        fill="${SKIN_LIGHT}" stroke="${SKIN_SHADE}" stroke-width="1" opacity="${0.8 * Math.max(0, (m - 0.35) / 0.65)}"/>`).join('')).join('');

    const delt = side => `
      <ellipse cx="${c + side * (S - 3)}" cy="91" rx="${9 + 7 * m}" ry="${11 + 5 * m}" fill="${SKIN}" stroke="${SKIN_SHADE}" stroke-width="1.2" stroke-opacity="${0.35 + 0.5 * m}"/>
      <ellipse cx="${c + side * (S - 4)}" cy="87" rx="${5 + 3 * m}" ry="${5 + 2 * m}" fill="${SKIN_LIGHT}" opacity="${0.6 * def}"/>`;

    const headband = m >= 0.3
      ? `<rect x="${c - 20}" y="27" width="40" height="7" rx="3.5" fill="url(#${id}-band)"/>`
      : '';

    return `
      <svg viewBox="0 0 200 300" width="${size}" height="${size * 1.5}" class="avatar-svg" role="img" aria-label="Personnage niveau ${level.name}">
        <defs>
          <radialGradient id="${id}-glow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stop-color="${level.color}" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="${level.color}" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="${id}-shorts" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#6366f1"/>
          </linearGradient>
          <linearGradient id="${id}-shoe" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#fb923c"/><stop offset="100%" stop-color="#f472b6"/>
          </linearGradient>
          <linearGradient id="${id}-band" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#f472b6"/><stop offset="100%" stop-color="#a78bfa"/>
          </linearGradient>
        </defs>
        ${opts.noGlow ? '' : `<circle cx="100" cy="150" r="98" fill="url(#${id}-glow)"/>`}
        ${leg(-1)}${leg(1)}
        <path d="M ${c - W - 1} 164 L ${c + W + 1} 164 L ${c + W + 7 + 5 * m} 214 L ${c + 4} 214 L ${c} 198 L ${c - 4} 214 L ${c - W - 7 - 5 * m} 214 Z"
          fill="url(#${id}-shorts)" stroke="#0a1230" stroke-width="1.5"/>
        <rect x="${c - W - 1}" y="161" width="${2 * W + 2}" height="7" rx="3" fill="#0a1230" opacity="0.55"/>
        ${arm(-1)}${arm(1)}
        <rect x="${c - nw}" y="56" width="${2 * nw}" height="24" rx="6" fill="${SKIN}" stroke="${SKIN_SHADE}" stroke-width="1.5"/>
        <path d="${torso}" fill="${SKIN}" stroke="${SKIN_SHADE}" stroke-width="1.5"/>
        ${pec(-1)}${pec(1)}
        <line x1="${c}" y1="96" x2="${c}" y2="${118 + 40 * def}" stroke="${SKIN_SHADE}" stroke-width="1.5" opacity="${0.2 + 0.5 * def}"/>
        ${abs}
        <path d="M ${c - 22} 157 Q ${c} ${166 + 4 * (1 - m)} ${c + 22} 157" fill="none" stroke="${SKIN_SHADE}" stroke-width="1.5" opacity="${0.5 * (1 - m)}"/>
        <ellipse cx="${c}" cy="${150 + 2 * (1 - m)}" rx="1.6" ry="2.4" fill="${SKIN_SHADE}"/>
        ${delt(-1)}${delt(1)}
        <ellipse cx="${c - 20}" cy="42" rx="4" ry="6" fill="${SKIN}" stroke="${SKIN_SHADE}" stroke-width="1.5"/>
        <ellipse cx="${c + 20}" cy="42" rx="4" ry="6" fill="${SKIN}" stroke="${SKIN_SHADE}" stroke-width="1.5"/>
        <ellipse cx="${c}" cy="40" rx="20" ry="23" fill="${SKIN}" stroke="${SKIN_SHADE}" stroke-width="1.5"/>
        <path d="M ${c - 20} 38 Q ${c - 19} 13 ${c} 13 Q ${c + 19} 13 ${c + 20} 38 Q ${c + 13} 25 ${c} 25 Q ${c - 13} 25 ${c - 20} 38 Z" fill="${HAIR}"/>
        ${headband}
        <path d="M ${c - 12} ${36 - m} L ${c - 4} 37" stroke="${HAIR}" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M ${c + 12} ${36 - m} L ${c + 4} 37" stroke="${HAIR}" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="${c - 8}" cy="42" r="2.4" fill="#1b1530"/>
        <circle cx="${c + 8}" cy="42" r="2.4" fill="#1b1530"/>
        <path d="M ${c - 7} 52 Q ${c} ${56 + 2 * m} ${c + 7} 52" fill="none" stroke="#8a3f2c" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
  }

  function completedCount() {
    return DB.getWorkouts().filter(w => w.completed && w.exercises.some(e => e.sets.length)).length;
  }

  return { LEVELS, FULL_AT, levelFor, muscleFactor, svg, completedCount };
})();

window.Avatar = Avatar;
