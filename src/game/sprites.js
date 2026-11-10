/**
 * sprites.js — Vector sprites drawn with Path2D and canvas 2D API.
 * All sizes derived from tileSize. No image files, no emoji.
 */

/** Soft ellipse shadow under objects */
export function drawShadow(ctx, cx, cy, rx, ry) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Tilled soil tile */
export function drawSoil(ctx, x, y, size, watered = false, alt = false) {
  const radius = 6;
  const gap = 2;
  const tx = x + gap / 2;
  const ty = y + gap / 2;
  const tw = size - gap;
  const th = size - gap;

  // Background
  ctx.fillStyle = watered ? '#4a3123' : (alt ? '#6f4a32' : '#7a5238');
  roundRect(ctx, tx, ty, tw, th, radius);
  ctx.fill();

  // Furrow lines
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = watered ? '#2d1e14' : '#5a3d26';
  ctx.lineWidth = 1;
  const lx = tx + 4;
  const lw = tw - 8;
  for (let i = 0; i < 3; i++) {
    const ly = ty + 4 + i * Math.floor((th - 8) / 2);
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + lw, ly);
    ctx.stroke();
  }
  ctx.restore();
}

/** Seedling ('s') */
export function drawSeedling(ctx, cx, cy, size) {
  const s = size * 0.42;
  drawShadow(ctx, cx, cy + s * 0.3, s * 0.55, s * 0.18);

  // Mound (soil bump)
  ctx.fillStyle = '#5c3b22';
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.25, s * 0.45, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Left leaf
  ctx.fillStyle = '#3e9d4f';
  ctx.save();
  ctx.translate(cx - s * 0.18, cy);
  ctx.rotate(-0.4);
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.14, s * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Right leaf
  ctx.save();
  ctx.translate(cx + s * 0.18, cy);
  ctx.rotate(0.4);
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.14, s * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Ripe radish crop ('R') */
export function drawRadish(ctx, cx, cy, size) {
  const s = size * 0.52;
  drawShadow(ctx, cx, cy + s * 0.5, s * 0.65, s * 0.2);

  // Leafy top
  ctx.fillStyle = '#3e9d4f';
  for (let i = -1; i <= 1; i++) {
    ctx.save();
    ctx.translate(cx + i * s * 0.22, cy - s * 0.3);
    ctx.rotate(i * 0.3);
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.13, s * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Radish body
  ctx.fillStyle = '#d8365d';
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.1, s * 0.42, s * 0.46, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlight arc
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#ff88aa';
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.1, cy - s * 0.05, s * 0.14, s * 0.18, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Tail root
  ctx.strokeStyle = '#d8365d';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.56);
  ctx.lineTo(cx, cy + s * 0.8);
  ctx.stroke();
}

/** Rock ('#') */
export function drawRock(ctx, cx, cy, size) {
  const s = size * 0.46;
  drawShadow(ctx, cx, cy + s * 0.5, s * 0.75, s * 0.22);

  // Main body — irregular polygon
  ctx.fillStyle = '#8b929c';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy + s * 0.2);
  ctx.lineTo(cx - s * 0.4, cy - s * 0.35);
  ctx.lineTo(cx - s * 0.05, cy - s * 0.52);
  ctx.lineTo(cx + s * 0.4, cy - s * 0.38);
  ctx.lineTo(cx + s * 0.52, cy + s * 0.1);
  ctx.lineTo(cx + s * 0.3, cy + s * 0.5);
  ctx.lineTo(cx - s * 0.3, cy + s * 0.5);
  ctx.closePath();
  ctx.fill();

  // Darker face
  ctx.fillStyle = '#6b7078';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.3, cy + s * 0.15);
  ctx.lineTo(cx - s * 0.22, cy - s * 0.2);
  ctx.lineTo(cx + s * 0.15, cy - s * 0.28);
  ctx.lineTo(cx + s * 0.28, cy + s * 0.1);
  ctx.lineTo(cx + s * 0.1, cy + s * 0.38);
  ctx.lineTo(cx - s * 0.18, cy + s * 0.38);
  ctx.closePath();
  ctx.fill();

  // Light highlight
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.1, cy - s * 0.15, s * 0.15, s * 0.1, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Farmer sprite — faces direction */
export function drawFarmer(ctx, cx, cy, size, facingRight = true) {
  const s = size * 0.5;
  drawShadow(ctx, cx, cy + s * 0.65, s * 0.55, s * 0.18);

  ctx.save();
  if (!facingRight) {
    ctx.scale(-1, 1);
    cx = -cx;
  }

  // Overalls body
  ctx.fillStyle = '#1b2433'; // --ink
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.2, s * 0.38, s * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sky patch (overalls front)
  ctx.fillStyle = '#bfe6f2'; // --sky
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.2, s * 0.22, s * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#f0c38a'; // skin
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.28, s * 0.28, 0, Math.PI * 2);
  ctx.fill();

  // Hat brim
  ctx.fillStyle = '#c8a228'; // darker sunflower
  ctx.beginPath();
  ctx.ellipse(cx, cy - s * 0.5, s * 0.42, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hat crown
  ctx.fillStyle = '#f4c430'; // --sunflower
  ctx.beginPath();
  roundRect(ctx, cx - s * 0.26, cy - s * 0.86, s * 0.52, s * 0.38, 4);
  ctx.fill();

  // Hat band
  ctx.fillStyle = '#c8a228';
  ctx.fillRect(cx - s * 0.26, cy - s * 0.52, s * 0.52, s * 0.06);

  // Simple eyes
  ctx.fillStyle = '#1b2433';
  ctx.beginPath();
  ctx.arc(cx + (facingRight ? s * 0.1 : -s * 0.1), cy - s * 0.28, s * 0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** Fence border around the grid */
export function drawFence(ctx, gridX, gridY, gridW, gridH, tileSize) {
  const postW = 6;
  const postH = 14;
  const railH = 3;

  ctx.fillStyle = '#6fb04a'; // --meadow-deep
  ctx.strokeStyle = '#7a5238'; // --furrow
  ctx.lineWidth = 1;

  const left   = gridX - 10;
  const right  = gridX + gridW * tileSize + 10;
  const top    = gridY - 10;
  const bottom = gridY + gridH * tileSize + 10;

  // Posts on top and bottom
  for (let col = 0; col <= gridW; col++) {
    const px = gridX + col * tileSize - postW / 2;
    // Top rail posts
    ctx.fillStyle = '#5c8c38';
    ctx.fillRect(px, top, postW, postH);
    // Bottom rail posts
    ctx.fillRect(px, bottom - postH, postW, postH);
  }

  // Posts on sides
  for (let row = 0; row <= gridH; row++) {
    const py = gridY + row * tileSize - postW / 2;
    ctx.fillRect(left, py, postH, postW);
    ctx.fillRect(right - postH, py, postH, postW);
  }

  // Rails — top
  ctx.fillStyle = '#7a5238';
  ctx.fillRect(left, top + 3, right - left, railH);
  ctx.fillRect(left, top + 8, right - left, railH);
  // Rails — bottom
  ctx.fillRect(left, bottom - 6, right - left, railH);
  ctx.fillRect(left, bottom - 11, right - left, railH);
  // Rails — left
  ctx.fillRect(left + 3, top, railH, bottom - top);
  ctx.fillRect(left + 8, top, railH, bottom - top);
  // Rails — right
  ctx.fillRect(right - 6, top, railH, bottom - top);
  ctx.fillRect(right - 11, top, railH, bottom - top);
}

/** Coin sprite for the arc animation */
export function drawCoin(ctx, cx, cy, r = 8) {
  ctx.fillStyle = '#f4c430';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b08d1a';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/** Water droplet (small) */
export function drawDroplet(ctx, cx, cy, size) {
  ctx.fillStyle = '#bfe6f2';
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.1, size * 0.3, 0, Math.PI * 2);
  ctx.fill();
  // teardrop tip
  ctx.beginPath();
  ctx.moveTo(cx, cy - size * 0.3);
  ctx.bezierCurveTo(cx + size * 0.3, cy, cx + size * 0.3, cy + size * 0.1, cx, cy + size * 0.4);
  ctx.bezierCurveTo(cx - size * 0.3, cy + size * 0.1, cx - size * 0.3, cy, cx, cy - size * 0.3);
  ctx.fill();
}

// --- Utility ---
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
