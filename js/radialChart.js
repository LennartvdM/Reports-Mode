/**
 * Hexagonal spider/radar chart Canvas renderer.
 * Six axes at 60° intervals, four concentric hexagonal rings (scores 1-4).
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
  '#D6EEF3', // ring 1 (innermost) — lightest
  '#A8D8E4', // ring 2
  '#6BB8CC', // ring 3
  '#3A7CA5'  // ring 4 (outermost) — darkest blue
];

const ORANGE_RING_COLORS = [
  '#FADED0',
  '#F5BFA3',
  '#EE9A6C',
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
  const padding = showLabels ? 65 : 20;
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

  // Helper: draw hexagon at a given radius
  function hexPath(r) {
    ctx.beginPath();
    for (let i = 0; i < numAxes; i++) {
      const angle = axisAngle(i);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  // Draw concentric hexagonal ring fills (ring 4 = outermost drawn first)
  for (let ring = 4; ring >= 1; ring--) {
    const r = (ring / 4) * maxR;
    hexPath(r);
    ctx.fillStyle = ringColors[ring - 1];
    ctx.globalAlpha = 0.25;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Draw hexagonal grid lines
  for (let ring = 1; ring <= 4; ring++) {
    const r = (ring / 4) * maxR;
    hexPath(r);
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  // Draw axis (spoke) lines
  for (let i = 0; i < numAxes; i++) {
    const angle = axisAngle(i);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  // Draw tick dots on each axis at each ring level
  for (let i = 0; i < numAxes; i++) {
    const angle = axisAngle(i);
    for (let ring = 1; ring <= 4; ring++) {
      const r = (ring / 4) * maxR;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#aaa';
      ctx.fill();
    }
  }

  // Draw filled score shape
  const fillColor = palette === 'orange' ? 'rgba(232,113,42,0.35)' : 'rgba(43,76,126,0.35)';
  const strokeColor = palette === 'orange' ? '#c0551a' : '#1B2A4A';

  ctx.beginPath();
  for (let i = 0; i < numAxes; i++) {
    const angle = axisAngle(i);
    const score = Math.min(Math.max(scores[i] || 0, 0), 4);
    const r = (score / 4) * maxR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw score dots
  for (let i = 0; i < numAxes; i++) {
    const angle = axisAngle(i);
    const score = Math.min(Math.max(scores[i] || 0, 0), 4);
    const r = (score / 4) * maxR;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 4, 0, Math.PI * 2);
    ctx.fillStyle = palette === 'orange' ? '#E8712A' : '#1B2A4A';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw labels
  if (showLabels) {
    ctx.fillStyle = '#333';
    ctx.font = `600 ${labelFontSize}px Inter, sans-serif`;
    ctx.textBaseline = 'middle';

    for (let i = 0; i < numAxes; i++) {
      const angle = axisAngle(i);
      const labelR = maxR + 20;
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

  // Draw ring number labels (1-4) along the top-left spoke
  ctx.fillStyle = '#999';
  ctx.font = '9px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  for (let ring = 1; ring <= 4; ring++) {
    const r = (ring / 4) * maxR;
    ctx.fillText(ring.toString(), cx, cy - r - 4);
  }
}
