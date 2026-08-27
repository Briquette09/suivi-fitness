/* Petit générateur de courbes en SVG, sans dépendance externe (fonctionne hors-ligne). */
function lineChart(points, { width = 320, height = 140, color = 'var(--accent)', unit = '' } = {}) {
  if (!points.length) {
    return `<div class="chart-empty">Pas encore de données</div>`;
  }
  const pad = { top: 16, right: 12, bottom: 24, left: 12 };
  const values = points.map(p => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) { min -= 1; max += 1; }
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const x = i => pad.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = v => pad.top + innerH - ((v - min) / (max - min)) * innerH;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const dots = points.map((p, i) =>
    `<circle cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="3" fill="${color}"><title>${p.label}: ${p.value}${unit}</title></circle>`
  ).join('');

  const firstLabel = points[0].label;
  const lastLabel = points[points.length - 1].label;

  return `
    <svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="xMidYMid meet">
      <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      ${dots}
      <text x="${pad.left}" y="${height - 6}" class="chart-label">${firstLabel}</text>
      <text x="${width - pad.right}" y="${height - 6}" class="chart-label" text-anchor="end">${lastLabel}</text>
      <text x="${pad.left}" y="${pad.top}" class="chart-label" text-anchor="start">${max}${unit}</text>
      <text x="${pad.left}" y="${height - pad.bottom + 12}" class="chart-label" text-anchor="start">${min}${unit}</text>
    </svg>`;
}

window.Charts = { lineChart };
