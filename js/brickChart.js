/**
 * Brick bar chart Canvas renderer.
 * Horizontal bars with discrete colored blocks for scores 1-4.
 */

const BRICK_COLORS = [
  '#B5DFE8', // score 1
  '#7EC8D8', // score 2
  '#3A7CA5', // score 3
  '#1B2A4A'  // score 4
];

function drawBrickChart(canvas, items, options = {}) {
  const {
    width = 350,
    rowHeight = 22,
    labelWidth = 160,
    brickWidth = 36,
    brickGap = 3,
    headerHeight = 24,
    fontSize = 9
  } = options;

  const dpr = window.devicePixelRatio || 1;
  const totalHeight = headerHeight + items.length * rowHeight + 5;

  canvas.width = width * dpr;
  canvas.height = totalHeight * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = totalHeight + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, totalHeight);

  const brickStartX = labelWidth + 10;
  const brickH = rowHeight - 6;

  // Column headers
  ctx.fillStyle = '#888';
  ctx.font = `600 ${fontSize}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let c = 1; c <= 4; c++) {
    const bx = brickStartX + (c - 1) * (brickWidth + brickGap) + brickWidth / 2;
    ctx.fillText(c.toString(), bx, headerHeight / 2);
  }

  // Rows
  items.forEach((item, idx) => {
    const y = headerHeight + idx * rowHeight;

    // Label
    ctx.fillStyle = '#333';
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // Truncate label if too long
    let label = item.label;
    while (ctx.measureText(label).width > labelWidth - 5 && label.length > 3) {
      label = label.slice(0, -4) + '...';
    }
    ctx.fillText(label, labelWidth, y + rowHeight / 2);

    // Bricks
    const score = Math.round(Math.min(Math.max(item.score || 0, 0), 4));
    for (let b = 0; b < score; b++) {
      const bx = brickStartX + b * (brickWidth + brickGap);
      ctx.fillStyle = BRICK_COLORS[b];
      ctx.beginPath();
      ctx.roundRect(bx, y + 3, brickWidth, brickH, 2);
      ctx.fill();
    }

    // Empty brick outlines for remaining
    for (let b = score; b < 4; b++) {
      const bx = brickStartX + b * (brickWidth + brickGap);
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, y + 3, brickWidth, brickH, 2);
      ctx.stroke();
    }
  });
}
