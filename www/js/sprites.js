/* =========================================================================
   FISCHMON — Grafik (prozedurale Pixel-Art im Game-Boy-Stil)
   ========================================================================= */

// Klassische DMG-Palette (dunkel -> hell)
const PAL = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'];
const TILE = 16;

function pset(ctx, x, y, w, h, c) {
  ctx.fillStyle = PAL[c];
  ctx.fillRect(x | 0, y | 0, w, h);
}

function fillEllipse(ctx, cx, cy, rx, ry, c) {
  ctx.fillStyle = PAL[c];
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------- Kacheln ---------- */
function drawTile(ctx, ch, x, y, frame) {
  // Grundfläche
  const grassBg = 3;
  switch (ch) {
    case '#': // Fels
      pset(ctx, x, y, TILE, TILE, 1);
      pset(ctx, x + 2, y + 2, 5, 4, 0);
      pset(ctx, x + 9, y + 3, 4, 5, 0);
      pset(ctx, x + 4, y + 9, 6, 4, 0);
      pset(ctx, x + 11, y + 10, 3, 4, 0);
      break;
    case 'T': // Baum
      pset(ctx, x, y, TILE, TILE, 3);
      fillEllipse(ctx, x + 8, y + 6, 7, 6, 1);
      fillEllipse(ctx, x + 8, y + 6, 5, 4, 2);
      pset(ctx, x + 7, y + 11, 2, 4, 0);
      break;
    case 'W': { // Tiefwasser (animiert)
      pset(ctx, x, y, TILE, TILE, 1);
      const off = frame ? 4 : 0;
      pset(ctx, x + ((2 + off) % TILE), y + 4, 5, 1, 2);
      pset(ctx, x + ((9 + off) % TILE), y + 9, 5, 1, 2);
      pset(ctx, x + ((5 + off) % TILE), y + 13, 4, 1, 2);
      break;
    }
    case 's': case '~': case 'r': case 'c': { // Untiefe / Begegnungswasser
      const base = ch === 'c' ? 1 : 2;
      pset(ctx, x, y, TILE, TILE, base);
      const dot = ch === 'c' ? 0 : 1;
      const off = frame ? 3 : 0;
      // Wellenkringel
      pset(ctx, x + 2, y + ((3 + off) % TILE), 4, 1, dot);
      pset(ctx, x + 9, y + ((6 + off) % TILE), 4, 1, dot);
      pset(ctx, x + 4, y + ((11 + off) % TILE), 4, 1, dot);
      if (ch === 'r') { pset(ctx, x + 6, y + 8, 2, 3, 0); pset(ctx, x + 11, y + 4, 2, 3, 0); } // Korallen
      break;
    }
    case ',': // Gras
      pset(ctx, x, y, TILE, TILE, grassBg);
      pset(ctx, x + 3, y + 10, 1, 3, 1);
      pset(ctx, x + 4, y + 11, 1, 2, 1);
      pset(ctx, x + 10, y + 8, 1, 4, 1);
      pset(ctx, x + 11, y + 9, 1, 3, 1);
      break;
    case '.': // Weg / Sand
      pset(ctx, x, y, TILE, TILE, 2);
      pset(ctx, x + 5, y + 6, 1, 1, 1);
      pset(ctx, x + 11, y + 12, 1, 1, 1);
      break;
    case 'H': // Haus
      pset(ctx, x, y, TILE, TILE, 3);
      pset(ctx, x + 1, y + 5, 14, 10, 1);
      pset(ctx, x, y + 4, TILE, 3, 0);      // Dach
      pset(ctx, x + 5, y + 8, 3, 3, 3);     // Fenster
      pset(ctx, x + 10, y + 8, 3, 3, 3);
      break;
    case 'L': // Labor
      pset(ctx, x, y, TILE, TILE, 3);
      pset(ctx, x + 1, y + 3, 14, 12, 0);
      pset(ctx, x + 3, y + 6, 3, 3, 2);
      pset(ctx, x + 10, y + 6, 3, 3, 2);
      pset(ctx, x + 6, y + 1, 4, 3, 1);
      break;
    case 'D': // Tür
      pset(ctx, x, y, TILE, TILE, 2);
      pset(ctx, x + 4, y + 4, 8, 12, 0);
      pset(ctx, x + 9, y + 10, 1, 2, 2);
      break;
    case 'h': // Heilstelle (Zuhause)
      pset(ctx, x, y, TILE, TILE, 3);
      pset(ctx, x + 1, y + 5, 14, 10, 1);
      pset(ctx, x, y + 4, TILE, 3, 0);
      pset(ctx, x + 6, y + 8, 4, 1, 3);     // Kreuz
      pset(ctx, x + 7, y + 6, 2, 5, 3);
      break;
    case '=': // Steg / Brücke
      pset(ctx, x, y, TILE, TILE, 1);
      pset(ctx, x, y + 2, TILE, 3, 2);
      pset(ctx, x, y + 8, TILE, 3, 2);
      pset(ctx, x, y + 13, TILE, 2, 2);
      break;
    case 'B': // Schild
      pset(ctx, x, y, TILE, TILE, 3);
      pset(ctx, x + 2, y + 3, 12, 7, 1);
      pset(ctx, x + 4, y + 5, 8, 1, 3);
      pset(ctx, x + 4, y + 7, 6, 1, 3);
      pset(ctx, x + 7, y + 10, 2, 4, 0);
      break;
    case 'M': // Fußmatte / Ausgang
      pset(ctx, x, y, TILE, TILE, 2);
      pset(ctx, x + 2, y + 5, 12, 8, 1);
      pset(ctx, x + 3, y + 6, 10, 6, 3);
      pset(ctx, x + 6, y + 7, 4, 1, 1);
      break;
    case 'G': // Tor / Treppe nach außen
      pset(ctx, x, y, TILE, TILE, 3);
      pset(ctx, x + 2, y + 1, 12, 14, 0);   // dunkler Durchgang
      pset(ctx, x + 3, y + 10, 10, 2, 1);   // Stufen
      pset(ctx, x + 4, y + 12, 8, 2, 2);
      pset(ctx, x + 5, y + 14, 6, 2, 3);
      break;
    case 'O': // Tisch / Möbel
      pset(ctx, x, y, TILE, TILE, 2);
      pset(ctx, x + 1, y + 3, 14, 8, 1);
      pset(ctx, x + 1, y + 3, 14, 2, 0);
      pset(ctx, x + 2, y + 11, 2, 4, 0);
      pset(ctx, x + 12, y + 11, 2, 4, 0);
      break;
    case 'E': // Regal / Gerät
      pset(ctx, x, y, TILE, TILE, 2);
      pset(ctx, x + 2, y + 1, 12, 14, 0);
      pset(ctx, x + 3, y + 3, 10, 2, 2);
      pset(ctx, x + 3, y + 7, 10, 2, 2);
      pset(ctx, x + 3, y + 11, 10, 2, 1);
      break;
    case 'b': // Bett / Heilliege
      pset(ctx, x, y, TILE, TILE, 2);
      pset(ctx, x + 2, y + 2, 12, 12, 0);
      pset(ctx, x + 3, y + 3, 4, 4, 3);     // Kissen
      pset(ctx, x + 3, y + 8, 10, 5, 1);    // Decke
      break;
    case 'K': // Tresen
      pset(ctx, x, y, TILE, TILE, 2);
      pset(ctx, x, y + 2, TILE, 9, 1);
      pset(ctx, x, y + 2, TILE, 2, 0);
      pset(ctx, x, y + 11, TILE, 1, 0);
      break;
    default:
      pset(ctx, x, y, TILE, TILE, grassBg);
  }
}

/* ---------- Spieler (kleiner Angler mit Hut) ---------- */
function drawPlayer(ctx, x, y, dir, step) {
  const bob = step ? 1 : 0;
  // Hut
  pset(ctx, x + 4, y + 1, 8, 2, 0);
  pset(ctx, x + 5, y + 0, 6, 1, 0);
  // Kopf
  pset(ctx, x + 5, y + 3, 6, 4, 2);
  // Augen je nach Richtung
  if (dir === 'down')  { pset(ctx, x + 6, y + 4, 1, 1, 0); pset(ctx, x + 9, y + 4, 1, 1, 0); }
  if (dir === 'up')    { /* Hinterkopf */ }
  if (dir === 'left')  { pset(ctx, x + 6, y + 4, 1, 1, 0); }
  if (dir === 'right') { pset(ctx, x + 9, y + 4, 1, 1, 0); }
  // Körper
  pset(ctx, x + 4, y + 7, 8, 5, 1);
  pset(ctx, x + 6, y + 8, 4, 2, 2);   // Weste
  // Beine (Laufanimation)
  pset(ctx, x + 5, y + 12, 2, 3 - bob, 0);
  pset(ctx, x + 9, y + 12 + bob, 2, 3 - bob, 0);
  // Angel
  pset(ctx, x + 12, y + 2, 1, 9, 0);
}

/* ---------- Fisch-Sprite (prozedural, nach Art) ----------
   facing: +1 = nach rechts (Spieler-Sicht), -1 = nach links (Gegner)
*/
function drawFishSprite(ctx, cx, cy, s, spec, facing) {
  facing = facing || 1;
  const sp = spec.sprite || {};
  const body = (sp.shade !== undefined) ? sp.shade : 2;
  const dark = 0;
  const light = Math.min(body + 1, 3);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(facing, 1);          // spiegeln für Blickrichtung
  ctx.translate(-cx, -cy);

  const shape = sp.shape || 'round';
  const px = (a, b, w, h, c) => pset(ctx, cx + a * s, cy + b * s, Math.ceil(w * s), Math.ceil(h * s), c);
  const el = (a, b, rx, ry, c) => fillEllipse(ctx, cx + a * s, cy + b * s, rx * s, ry * s, c);

  // Körperform
  if (shape === 'eel') {
    // langer, gebogener Körper
    px(-9, -1, 18, 3, dark);
    px(-9, -1, 18, 2, body);
    px(-9, 0, 4, 2, dark);          // Kopf
    el(6, 0, 3, 3, body);           // Schwanz-Ende
  } else if (shape === 'ball') {
    el(0, 0, 6, 6, dark);
    el(0, 0, 5.3, 5.3, body);
  } else if (shape === 'shrimp') {
    el(-1, 0, 5, 3, dark); el(-1, 0, 4.3, 2.4, body);
    px(4, -1, 3, 3, body);          // gekrümmter Schwanz
    px(5, -3, 2, 3, body);
  } else if (shape === 'crab') {
    const w = sp.big ? 7 : 6;
    el(0, 1, w, 4, dark); el(0, 1, w - 0.7, 3.3, body);
  } else {
    // Standard-Fischkörper mit Formvarianten
    let rx = 6, ry = 4;
    if (shape === 'long') { rx = 8; ry = 3; }
    else if (shape === 'flat') { rx = 5; ry = 5; }
    else if (shape === 'fat') { rx = 6; ry = 5; }
    el(0, 0, rx, ry, dark);
    el(0, 0, rx - 0.7, ry - 0.7, body);
  }

  // Schwanzflosse
  const tail = sp.tail || 'fan';
  const tx = shape === 'long' ? -8 : (shape === 'ball' ? -6 : -6);
  if (tail === 'fan') { px(tx - 3, -4, 3, 8, dark); px(tx - 2, -3, 2, 6, body); }
  else if (tail === 'fork') { px(tx - 3, -4, 3, 3, dark); px(tx - 3, 1, 3, 3, dark); px(tx - 1, -1, 2, 2, body); }
  else if (tail === 'point') { px(tx - 3, -1, 4, 2, dark); }
  else if (tail === 'small') { px(tx - 2, -2, 2, 4, dark); }

  // Rückenflosse
  const fin = sp.fin || 'none';
  if (fin === 'top') { px(-2, -6, 5, 2, dark); px(-1, -5, 3, 1, body); }
  else if (fin === 'tall') { px(-1, -8, 4, 4, dark); px(0, -7, 2, 3, body); }
  else if (fin === 'shark') { px(0, -8, 3, 5, dark); px(1, -7, 1, 3, body); }
  else if (fin === 'spikes') { for (let i = -4; i <= 4; i += 2) px(i, -7, 1, 4, dark); }

  // Auge
  const eyeX = (shape === 'eel') ? -7 : (shape === 'long' ? 5 : 3);
  el(eyeX, -1, 1.4, 1.4, light);
  px(eyeX + 0.3, -1.2, 1, 1, dark);
  // dunkle Augen für Tiefsee (sp.eye===2 -> leuchtend)
  if (sp.eye === 2) { el(eyeX, -1, 1.6, 1.6, 3); px(eyeX + 0.2, -1.4, 1, 1, dark); }

  // Maul
  const mouthX = (shape === 'long') ? 7 : (shape === 'eel' ? -8.5 : 5.5);
  if (sp.mouth === 'teeth') {
    px(mouthX - 1, 0.5, 3, 1, 3);
    px(mouthX - 1, 1.2, 1, 1, dark); px(mouthX + 1, 1.2, 1, 1, dark);
  } else {
    px(mouthX, 1, 1.5, 1, dark);
  }

  // Muster / Anhängsel
  if (sp.stripes) { px(-2, -3, 1.5, 6, dark); px(1, -3, 1.5, 6, dark); }
  if (sp.spots)   { px(-2, -1, 1, 1, dark); px(1, 1, 1, 1, dark); px(3, -2, 1, 1, dark); }
  if (sp.lure)    { px(4, -7, 1, 4, dark); el(4.5, -8, 1.3, 1.3, 3); }        // Anglerfisch-Lockdorn
  if (sp.bill)    { px(6, -0.5, 5, 1.2, dark); }                              // Schwertfisch-Schwert
  if (sp.whiskers){ px(6, 1, 4, 0.8, dark); px(6, 2, 3, 0.8, dark); }         // Wels-Barteln
  if (sp.warts)   { px(-1, -2, 1, 1, dark); px(2, 1, 1, 1, dark); px(-3, 1, 1, 1, dark); }
  if (sp.spikes && shape === 'ball') { for (let a = 0; a < 8; a++) { const ang = a * Math.PI / 4; px(Math.cos(ang) * 6, Math.sin(ang) * 6 - 0.5, 1.5, 1.5, dark); } }
  if (sp.ray)     { el(0, 0, 7, 5, body); px(-7, -0.5, 3, 1.2, dark); }        // Rochen-Flügel/Schwanz
  if (sp.legs)    { for (let i = -3; i <= 2; i += 1.5) px(i, 2.5, 0.8, 2, dark); }
  if (sp.claws)   { px(5, -3, 3, 2, dark); px(5, 1.5, 3, 2, dark); px(-7, -1, 2, 2, dark); }
  if (sp.big)     { px(6.5, -4, 3, 2.5, dark); px(6.5, 1.5, 3, 2.5, dark); }

  ctx.restore();
}
