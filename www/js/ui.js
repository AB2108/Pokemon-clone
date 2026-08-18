/* =========================================================================
   FISCHMON — UI-Bausteine (Text, Fenster, Menüs)
   ========================================================================= */

function drawText(ctx, text, x, y, color) {
  ctx.fillStyle = PAL[color === undefined ? 0 : color];
  ctx.font = '8px "Courier New", monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

function drawTextCenter(ctx, text, cx, y, color) {
  ctx.fillStyle = PAL[color === undefined ? 0 : color];
  ctx.font = '8px "Courier New", monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText(text, cx, y);
  ctx.textAlign = 'left';
}

// Fenster im Pokémon-Stil: heller Grund, doppelter dunkler Rahmen
function drawWindow(ctx, x, y, w, h) {
  pset(ctx, x, y, w, h, 3);
  ctx.strokeStyle = PAL[0];
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
}

// Textbox am unteren Rand mit fortlaufend erscheinendem Text
function drawMessageBox(ctx, lines, cursorReady) {
  const bx = 2, by = 100, bw = 156, bh = 42;
  drawWindow(ctx, bx, by, bw, bh);
  for (let i = 0; i < lines.length && i < 3; i++) {
    drawText(ctx, lines[i], bx + 8, by + 7 + i * 11, 0);
  }
  if (cursorReady) {
    const t = Math.floor(Date.now() / 350) % 2;
    if (t) { pset(ctx, bx + bw - 12, by + bh - 12, 4, 4, 0); }
  }
}

// Wortweiser Zeilenumbruch für eine gegebene Zeichenbreite
function wrapText(text, maxChars) {
  const words = ('' + text).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) { if (cur) lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

// Auswahlmenü in einem Fenster; gibt nichts zurück, zeichnet nur
function drawMenu(ctx, items, index, x, y, w, opts) {
  opts = opts || {};
  const lh = opts.lh || 11;
  const h = items.length * lh + 8;
  drawWindow(ctx, x, y, w, h);
  for (let i = 0; i < items.length; i++) {
    const yy = y + 6 + i * lh;
    if (i === index) drawText(ctx, '>', x + 3, yy, 0);
    drawText(ctx, items[i], x + 11, yy, 0);
  }
}

// HP-Balken zeichnen
function drawHPBar(ctx, x, y, w, frac) {
  frac = Math.max(0, Math.min(1, frac));
  pset(ctx, x, y, w, 3, 0);
  pset(ctx, x + 1, y + 1, w - 2, 1, 3);
  const inner = Math.round((w - 2) * frac);
  pset(ctx, x + 1, y + 1, inner, 1, frac > 0.5 ? 1 : (frac > 0.2 ? 2 : 0));
}
