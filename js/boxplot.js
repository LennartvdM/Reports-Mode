/**
 * Boxplot Canvas renderer.
 * Two vertical box-and-whisker plots side by side.
 */

function drawBoxplot(canvas, data, options = {}) {
  const {
    width = 400,
    height = 320,
    orgName = ''
  } = options;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const { allOrgs, withTarget, orgValue, orgTarget } = data;

  // Calculate Y axis range
  const allVals = [
    allOrgs.min, allOrgs.max,
    withTarget.min, withTarget.max,
    orgValue, orgTarget
  ].filter(v => v != null && !isNaN(v));

  const dataMin = Math.floor(Math.min(...allVals));
  const dataMax = Math.ceil(Math.max(...allVals));
  const yMin = Math.max(0, dataMin - 2);
  const yMax = dataMax + 2;

  // Layout
  const plotLeft = 55;
  const plotRight = width - 30;
  const plotTop = 25;
  const plotBottom = height - 40;
  const plotH = plotBottom - plotTop;
  const plotW = plotRight - plotLeft;

  const boxWidth = 50;
  const box1X = plotLeft + plotW * 0.3 - boxWidth / 2;
  const box2X = plotLeft + plotW * 0.7 - boxWidth / 2;

  // Y scale
  const yScale = (val) => plotBottom - ((val - yMin) / (yMax - yMin)) * plotH;

  // Draw Y axis
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotLeft, plotTop);
  ctx.lineTo(plotLeft, plotBottom);
  ctx.stroke();

  // Y axis ticks and labels
  ctx.fillStyle = '#888';
  ctx.font = '9px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  const step = yMax - yMin > 20 ? 5 : yMax - yMin > 10 ? 2 : 1;
  for (let v = yMin; v <= yMax; v += step) {
    const y = yScale(v);
    ctx.fillText(v.toFixed(0) + '%', plotLeft - 6, y);
    ctx.strokeStyle = '#eee';
    ctx.beginPath();
    ctx.moveTo(plotLeft, y);
    ctx.lineTo(plotRight, y);
    ctx.stroke();
  }

  function drawBox(stats, x, color) {
    const bx = x;
    const q1y = yScale(stats.q1);
    const q3y = yScale(stats.q3);
    const medy = yScale(stats.median);
    const miny = yScale(stats.min);
    const maxy = yScale(stats.max);
    const midX = bx + boxWidth / 2;

    // Whiskers
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    // Min whisker
    ctx.beginPath();
    ctx.moveTo(midX, q1y);
    ctx.lineTo(midX, miny);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + 10, miny);
    ctx.lineTo(bx + boxWidth - 10, miny);
    ctx.stroke();

    // Max whisker
    ctx.beginPath();
    ctx.moveTo(midX, q3y);
    ctx.lineTo(midX, maxy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + 10, maxy);
    ctx.lineTo(bx + boxWidth - 10, maxy);
    ctx.stroke();

    // Box
    ctx.fillStyle = color + '30';
    ctx.fillRect(bx, q3y, boxWidth, q1y - q3y);
    ctx.strokeStyle = color;
    ctx.strokeRect(bx, q3y, boxWidth, q1y - q3y);

    // Median
    ctx.beginPath();
    ctx.moveTo(bx, medy);
    ctx.lineTo(bx + boxWidth, medy);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.lineWidth = 1.5;

    // Value labels
    ctx.fillStyle = '#666';
    ctx.font = '8px Inter, sans-serif';
    ctx.textAlign = 'left';
    const labelX = bx + boxWidth + 4;
    ctx.fillText(stats.max.toFixed(1) + '%', labelX, maxy);
    ctx.fillText(stats.q3.toFixed(1) + '%', labelX, q3y);
    ctx.fillText(stats.median.toFixed(1) + '%', labelX, medy);
    ctx.fillText(stats.q1.toFixed(1) + '%', labelX, q1y);
    ctx.fillText(stats.min.toFixed(1) + '%', labelX, miny);
  }

  // Draw both boxes
  drawBox(allOrgs, box1X, '#2B4C7E');
  drawBox(withTarget, box2X, '#E8712A');

  // Org markers
  if (orgValue != null) {
    const oy = yScale(orgValue);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#1B2A4A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(plotLeft + 5, oy);
    ctx.lineTo(plotRight - 5, oy);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#1B2A4A';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${orgValue.toFixed(1)}% ${orgName}`, plotRight - 5, oy - 6);
  }

  if (orgTarget != null) {
    const ty = yScale(orgTarget);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#E8712A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(plotLeft + 5, ty);
    ctx.lineTo(plotRight - 5, ty);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#E8712A';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${orgTarget.toFixed(1)}% streefcijfer ${orgName}`, plotRight - 5, ty - 6);
  }

  // Legend labels at bottom
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2B4C7E';
  ctx.fillText('Alle organisaties', box1X + boxWidth / 2, plotBottom + 18);
  ctx.fillStyle = '#E8712A';
  ctx.fillText('Met streefcijfer', box2X + boxWidth / 2, plotBottom + 18);
}
