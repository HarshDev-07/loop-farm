/**
 * renderer.js — Draws game state on canvas.
 * createRenderer(canvas) → { draw(state, visual), resize() }
 */
import {
  drawSoil, drawSeedling, drawRadish, drawRock,
  drawFarmer, drawFence, drawCoin, drawDroplet,
} from './sprites.js';

const TILE_GAP = 2;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let tileSize = 64;
  let gridW = 6;
  let gridH = 4;
  let offsetX = 0;
  let offsetY = 0;

  // visual: { farmerX, farmerY, farmerFacing, tilePops, farmerShake, droplets, trail }
  function draw(state, visual = {}) {
    gridW = state.width;
    gridH = state.height;

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;

    // Keep canvas resolution in sync
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width  = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Compute tile size to fit grid in canvas
    const availW = cw - 40; // margins for fence
    const availH = ch - 40;
    tileSize = Math.max(16, Math.min(
      Math.floor(availW / gridW),
      Math.floor(availH / gridH),
      96
    ));

    // Center the grid
    const totalW = gridW * tileSize;
    const totalH = gridH * tileSize;
    offsetX = Math.floor((cw - totalW) / 2);
    offsetY = Math.floor((ch - totalH) / 2);

    // Clear with meadow background
    ctx.fillStyle = '#98d160';
    ctx.fillRect(0, 0, cw, ch);

    // Fence border
    drawFence(ctx, offsetX, offsetY, gridW, gridH, tileSize);

    // Farmer trail
    if (visual.trail && visual.trail.length > 0) {
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      visual.trail.forEach((pos, i) => {
        const tx = offsetX + pos.x * tileSize + tileSize / 2;
        const ty = offsetY + pos.y * tileSize + tileSize / 2;
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      });
      ctx.stroke();
      ctx.restore();
    }

    // Tiles
    for (let row = 0; row < gridH; row++) {
      for (let col = 0; col < gridW; col++) {
        const px = offsetX + col * tileSize;
        const py = offsetY + row * tileSize;
        const tile = state.tiles[row][col];
        const alt = (row + col) % 2 === 1;
        const watered = tile === 'R'; // watered soil under ripe crop
        drawSoil(ctx, px, py, tileSize, watered, alt);
      }
    }

    // Mismatch hatching (wrong tiles)
    if (visual.mismatches && visual.mismatches.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#d8365d';
      ctx.lineWidth = 1.5;
      for (const { x, y } of visual.mismatches) {
        const px = offsetX + x * tileSize + 2;
        const py = offsetY + y * tileSize + 2;
        const tw = tileSize - 4;
        const th = tileSize - 4;
        // Diagonal hatch
        ctx.beginPath();
        for (let d = -th; d < tw + th; d += 6) {
          ctx.moveTo(px + d, py);
          ctx.lineTo(px + d + th, py + th);
        }
        ctx.stroke();
        // Outline
        ctx.strokeRect(px, py, tw, th);
      }
      ctx.restore();
    }

    // Crop sprites (layer above tiles)
    for (let row = 0; row < gridH; row++) {
      for (let col = 0; col < gridW; col++) {
        const tile = state.tiles[row][col];
        if (tile === '.' || tile === '#') continue;

        const px = offsetX + col * tileSize;
        const py = offsetY + row * tileSize;
        const cx = px + tileSize / 2;
        const cy = py + tileSize / 2;

        // Pop scale animation
        const pop = visual.tilePops?.[`${col},${row}`];
        if (pop && pop.scale !== 1) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(pop.scale, pop.scale);
          ctx.translate(-cx, -cy);
          if (tile === 's') drawSeedling(ctx, cx, cy, tileSize);
          if (tile === 'R') drawRadish(ctx, cx, cy, tileSize);
          ctx.restore();
        } else {
          if (tile === 's') drawSeedling(ctx, cx, cy, tileSize);
          if (tile === 'R') drawRadish(ctx, cx, cy, tileSize);
        }
      }
    }

    // Rocks (draw over crops)
    for (let row = 0; row < gridH; row++) {
      for (let col = 0; col < gridW; col++) {
        if (state.tiles[row][col] !== '#') continue;
        const cx = offsetX + col * tileSize + tileSize / 2;
        const cy = offsetY + row * tileSize + tileSize / 2;
        drawRock(ctx, cx, cy, tileSize);
      }
    }

    // Water droplets
    if (visual.droplets) {
      for (const d of visual.droplets) {
        ctx.save();
        ctx.globalAlpha = d.alpha ?? 1;
        const dx = offsetX + d.x * tileSize + tileSize / 2 + d.ox;
        const dy = offsetY + d.y * tileSize + tileSize / 2 + d.oy;
        drawDroplet(ctx, dx, dy, tileSize * 0.18);
        ctx.restore();
      }
    }

    // Farmer (with shake offset)
    const fx = visual.farmerX ?? state.farmer.x;
    const fy = visual.farmerY ?? state.farmer.y;
    const shakeX = visual.farmerShakeX ?? 0;
    const facing = visual.farmerFacing !== undefined ? visual.farmerFacing : true;

    const farmerCx = offsetX + fx * tileSize + tileSize / 2 + shakeX;
    const farmerCy = offsetY + fy * tileSize + tileSize / 2;
    drawFarmer(ctx, farmerCx, farmerCy, tileSize, facing);

    // Speech bubble
    if (visual.bubble) {
      drawBubble(ctx, farmerCx, farmerCy - tileSize * 0.6, visual.bubble);
    }

    // Flying crop (harvest arc)
    if (visual.flyingCrop) {
      const { x, y, alpha, scale } = visual.flyingCrop;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      drawRadish(ctx, 0, 0, tileSize * 0.6);
      ctx.restore();
    }

    // Flying coin (arc)
    if (visual.flyingCoin) {
      const { x, y, alpha } = visual.flyingCoin;
      ctx.save();
      ctx.globalAlpha = alpha;
      drawCoin(ctx, x, y, 8);
      ctx.restore();
    }
  }

  function drawBubble(ctx, cx, cy, text) {
    const pad = 6;
    ctx.font = `bold 11px 'Atkinson Hyperlegible', sans-serif`;
    const tw = ctx.measureText(text).width;
    const bw = tw + pad * 2;
    const bh = 20;
    const bx = cx - bw / 2;
    const by = cy - bh;

    ctx.fillStyle = '#f5f7ef';
    ctx.strokeStyle = '#1b2433';
    ctx.lineWidth = 1;
    // Bubble rect
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(bx, by, bw, bh, 4);
    } else {
      ctx.rect(bx, by, bw, bh);
    }
    ctx.fill();
    ctx.stroke();
    // Tail
    ctx.beginPath();
    ctx.moveTo(cx - 4, by + bh);
    ctx.lineTo(cx, by + bh + 5);
    ctx.lineTo(cx + 4, by + bh);
    ctx.fill();
    // Text
    ctx.fillStyle = '#1b2433';
    ctx.fillText(text, bx + pad, by + bh - 5);
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Convert canvas pixel coords → tile coords */
  function pixelToTile(px, py) {
    const col = Math.floor((px - offsetX) / tileSize);
    const row = Math.floor((py - offsetY) / tileSize);
    return { x: col, y: row };
  }

  /** Convert tile coords → canvas pixel center */
  function tileCenter(col, row) {
    return {
      x: offsetX + col * tileSize + tileSize / 2,
      y: offsetY + row * tileSize + tileSize / 2,
    };
  }

  return { draw, resize, pixelToTile, tileCenter, getTileSize: () => tileSize };
}
