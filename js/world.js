/* =========================================================================
   FISCHMON — Overworld (Karte, Bewegung, Begegnungen)
   ========================================================================= */

const MAP_W = MAP[0].length;
const MAP_H = MAP.length;
const MOVE_FRAMES = 8;
const HOME = { x: 5, y: 6 };
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function tileAt(x, y) {
  if (y < 0 || y >= MAP_H || x < 0 || x >= MAP_W) return '#';
  return MAP[y][x];
}

function isBlocked(x, y) {
  const ch = tileAt(x, y);
  if (BLOCKED.has(ch)) return true;
  // NPCs blockieren ihre Kachel
  for (const n of NPCS) if (n.x === x && n.y === y) return true;
  return false;
}

function npcAt(x, y) {
  for (const n of NPCS) if (n.x === x && n.y === y) return n;
  return null;
}

/* ---- Bewegung ---- */
function startStep(game, dir) {
  const p = game.player;
  if (p.moving) return;
  p.dir = dir;
  const [dx, dy] = DIRV[dir];
  const nx = p.x + dx, ny = p.y + dy;
  if (isBlocked(nx, ny)) { p.step = (p.step + 1) % 2; return; } // gegen Wand: nur umdrehen
  p.moving = true;
  p.frame = 0;
  p.tx = nx; p.ty = ny;
}

function updateOverworld(game, dt) {
  const p = game.player;
  if (p.moving) {
    p.frame++;
    if (p.frame >= MOVE_FRAMES) {
      p.x = p.tx; p.y = p.ty;
      p.moving = false;
      p.step = (p.step + 1) % 2;
      p.offx = 0; p.offy = 0;
      // Begegnung prüfen
      const zone = ENCOUNTER_TILE[tileAt(p.x, p.y)];
      if (zone && Math.random() < 0.14) { startWildBattle(game, zone); return; }
    } else {
      const [dx, dy] = DIRV[p.dir];
      const t = p.frame / MOVE_FRAMES;
      p.offx = dx * t * TILE;
      p.offy = dy * t * TILE;
    }
  } else if (game.held && game.mode === 'overworld') {
    startStep(game, game.held);
  }
}

/* ---- Interaktion (A-Taste) ---- */
function interactOverworld(game) {
  const p = game.player;
  if (p.moving) return;
  const [dx, dy] = DIRV[p.dir];
  const fx = p.x + dx, fy = p.y + dy;
  const npc = npcAt(fx, fy);
  if (npc) { openDialog(game, npc.name, npc.lines); return; }
  const ch = tileAt(fx, fy);
  if (ch === 'h') {
    for (const f of game.party) { f.hp = f.maxHp; }
    openDialog(game, 'Zuhause', ['Du machst es dir gemuetlich.', 'Alle Fische sind wieder', 'topfit!']);
    saveGame(game);
    return;
  }
  if (ch === 'H') { openDialog(game, '', ['Die Tuer ist verschlossen.']); return; }
  if (ch === 'L') { openDialog(game, 'Labor', ['Prof. Kiemanns Labor.', 'Es riecht nach Aquarium.']); return; }
}

/* ---- Wilde Begegnung starten ---- */
function startWildBattle(game, zoneKey) {
  const zone = ENCOUNTERS[zoneKey];
  const total = zone.table.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total, pick = zone.table[0].id;
  for (const e of zone.table) { r -= e.w; if (r <= 0) { pick = e.id; break; } }
  const lvl = zone.levels[0] + Math.floor(Math.random() * (zone.levels[1] - zone.levels[0] + 1));
  const enemy = createFish(pick, lvl);
  game.dex.add(pick);

  // erstes kampffähiges Teammitglied nach vorn
  let idx = game.party.findIndex(f => f.hp > 0);
  if (idx < 0) idx = 0;

  game.battle = makeBattle({
    party: game.party, activeIndex: idx, enemy: enemy,
    bag: game.bag, dex: game.dex, caught: game.caught,
    onEnd: (outcome) => endWildBattle(game, outcome)
  });
  game.mode = 'battle';
}

function endWildBattle(game, outcome) {
  game.battle = null;
  if (outcome === 'lose') {
    game.player.x = HOME.x; game.player.y = HOME.y;
    game.player.moving = false; game.player.offx = 0; game.player.offy = 0;
    for (const f of game.party) f.hp = f.maxHp;
    game.mode = 'overworld';
    openDialog(game, 'Zuhause', ['Du bist erschoepft nach', 'Hause getrieben...', 'Alle Fische geheilt.']);
  } else {
    game.mode = 'overworld';
  }
  saveGame(game);
}

/* ---- Dialog ---- */
function openDialog(game, name, lines) {
  const wrapped = [];
  for (const l of lines) wrapped.push(l);
  game.dialog = { name, lines: wrapped, page: 0 };
  game.prevMode = game.mode;
  game.mode = 'dialog';
}

function advanceDialog(game) {
  const d = game.dialog;
  d.page += 2;
  if (d.page >= d.lines.length) {
    game.dialog = null;
    game.mode = game.prevMode || 'overworld';
  }
}

/* ---- Rendern ---- */
function drawNPC(ctx, sx, sy, npc) {
  if (npc.name === 'Schild') return; // Schild ist bereits die Kachel
  pset(ctx, sx + 5, sy + 2, 6, 4, 1);   // Kopf
  pset(ctx, sx + 6, sy + 3, 1, 1, 0);
  pset(ctx, sx + 9, sy + 3, 1, 1, 0);
  pset(ctx, sx + 4, sy + 6, 8, 6, 2);   // Körper
  pset(ctx, sx + 5, sy + 12, 2, 3, 0);
  pset(ctx, sx + 9, sy + 12, 2, 3, 0);
}

function renderOverworld(ctx, game) {
  const p = game.player;
  const ppx = p.x * TILE + (p.offx || 0);
  const ppy = p.y * TILE + (p.offy || 0);
  let camX = Math.round(ppx - 80 + 8);
  let camY = Math.round(ppy - 72 + 8);
  camX = Math.max(0, Math.min(MAP_W * TILE - 160, camX));
  camY = Math.max(0, Math.min(MAP_H * TILE - 144, camY));

  const frame = Math.floor(Date.now() / 400) % 2;
  const startTx = Math.floor(camX / TILE), startTy = Math.floor(camY / TILE);

  for (let ty = startTy; ty <= startTy + 10; ty++) {
    for (let tx = startTx; tx <= startTx + 11; tx++) {
      const ch = tileAt(tx, ty);
      drawTile(ctx, ch, tx * TILE - camX, ty * TILE - camY, frame);
    }
  }
  // NPCs
  for (const n of NPCS) {
    const sx = n.x * TILE - camX, sy = n.y * TILE - camY;
    if (sx > -TILE && sx < 160 && sy > -TILE && sy < 144) drawNPC(ctx, sx, sy, n);
  }
  // Spieler
  drawPlayer(ctx, Math.round(ppx - camX), Math.round(ppy - camY), p.dir, p.moving ? p.frame > 4 : false);
}
