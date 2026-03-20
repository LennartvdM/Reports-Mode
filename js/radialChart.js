/**
 * Radial bar chart (spider/radar) Canvas renderer.
 * Six axes at 60° intervals, four concentric rings (scores 1-4).
 */

const RADIAL_LABELS = [
  'Leiderschap',
  'Strategie en\nmanagement',
  'HR\nmanagement',
  'Communicatie',
  'Kennis en\nvaardigheden',
  'Klimaat'
];

const BLUE_RING_COLORS = [
  '#B5DFE8', // ring 1 (innermost)
  '#7EC8D8', // ring 2
  '#3A7CA5', // ring 3
  '#1B2A4A'  // ring 4 (outermost)
];

const ORANGE_RING_COLORS = [
  '#F5D6B8',
  '#F0B88A',
  '#E8924A',
  '#E8712A'
];

function drawRadialChart(canvas, scores, options = {}) {
  const {
    palette = 'blue',
    size = 300,
    showLabels = true,
    labelFontSize = 10
  } = options;

  const dpr = window.devicePixelRatio || 1;
  const padding = showLabels ? 60 : 20;
  const totalSize = size + padding * 2;

  canvas.width = totalSize * dpr;
  canvas.height = totalSize * dpr;
  canvas.style.width = totalSize + 'px';
  canvas.style.height = totalSize + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, totalSize, totalSize);

  const cx = totalSize / 2;
  const cy = totalSize / 2;
  const maxR = size / 2;
  const ringColors = palette === 'orange' ? ORANGE_RING_COLORS : BLUE_RING_COLORS;
  const numAxes = 6;
  const startAngle = -Math.PI / 2; // Start from top

  // Helper: angle for axis i
  const axisAngle = (i) => startAngle + (2 * Math.PI / numAxes) * i;

  // Draw concentric ring backgrounds
  for (let ring = 4; ring >= 1; ring--) {
    const r = (ring / 4) * maxR;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(240,243,245,0.3)';
    ctx.fill();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Draw axis lines
  for (let i = 0; i < numAxes; i++) {
    const angle = axisAngle(i);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Draw filled area with colored segments
  // For each pair of adjacent axes, fill the area from center to score level
  for (let i = 0; i < numAxes; i++) {
    const nextI = (i + 1) % numAxes;
    const score1 = Math.min(Math.max(scores[i] || 0, 0), 4);
    const score2 = Math.min(Math.max(scores[nextI] || 0, 0), 4);
    const angle1 = axisAngle(i);
    const angle2 = axisAngle(nextI);

    // Draw ring by ring for this segment
    const maxScore = Math.ceil(Math.max(score1, score2));
    for (let ring = 1; ring <= maxScore; ring++) {
      const f1 = Math.min(score1, ring) / 4;
      const f2 = Math.min(score2, ring) / 4;
      const prevF1 = Math.min(score1, ring - 1) / 4;
      const prevF2 = Math.min(score2, ring - 1) / 4;

      if (f1 <= prevF1 && f2 <= prevF2) continue;

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle1) * prevF1 * maxR, cy + Math.sin(angle1) * prevF1 * maxR);
      ctx.lineTo(cx + Math.cos(angle1) * f1 * maxR, cy + Math.sin(angle1) * f1 * maxR);
      ctx.lineTo(cx + Math.cos(angle2) * f2 * maxR, cy + Math.sin(angle2) * f2 * maxR);
      ctx.lineTo(cx + Math.cos(angle2) * prevF2 * maxR, cy + Math.sin(angle2) * prevF2 * maxR);
      ctx.closePath();
      ctx.fillStyle = ringColors[ring - 1];
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Draw score outline
  ctx.beginPath();
  for (let i = 0; i < numAxes; i++) {
    const angle = axisAngle(i);
    const r = (Math.min(scores[i] || 0, 4) / 4) * maxR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = palette === 'orange' ? '#c0551a' : '#1B2A4A';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw score dots
  for (let i = 0; i < numAxes; i++) {
    const angle = axisAngle(i);
    const r = (Math.min(scores[i] || 0, 4) / 4) * maxR;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 3, 0, Math.PI * 2);
    ctx.fillStyle = palette === 'orange' ? '#E8712A' : '#1B2A4A';
    ctx.fill();
  }

  // Draw labels
  if (showLabels) {
    ctx.fillStyle = '#333';
    ctx.font = `${labelFontSize}px Inter, sans-serif`;
    ctx.textBaseline = 'middle';

    for (let i = 0; i < numAxes; i++) {
      const angle = axisAngle(i);
      const labelR = maxR + 18;
      const x = cx + Math.cos(angle) * labelR;
      const y = cy + Math.sin(angle) * labelR;

      const lines = RADIAL_LABELS[i].split('\n');
      ctx.textAlign = 'center';

      // Adjust alignment based on position
      if (Math.cos(angle) > 0.3) ctx.textAlign = 'left';
      else if (Math.cos(angle) < -0.3) ctx.textAlign = 'right';

      lines.forEach((line, li) => {
        ctx.fillText(line, x, y + (li - (lines.length - 1) / 2) * (labelFontSize + 2));
      });
    }
  }

  // Draw ring number labels (1-4) on the top axis
  ctx.fillStyle = '#999';
  ctx.font = '9px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  for (let ring = 1; ring <= 4; ring++) {
    const r = (ring / 4) * maxR;
    ctx.fillText(ring.toString(), cx, cy - r - 3);
  }
}
