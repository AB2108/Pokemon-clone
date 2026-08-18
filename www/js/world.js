/* =========================================================================
   FISCHMON — Overworld (mehrere Karten, Warps, Bewegung, Begegnungen)
   ========================================================================= */

const MOVE_FRAMES = 8;
const HOME = { x: 5, y: 6 };            // Startposition auf der Karte 'world'
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function curMapObj(game) { return MAPS[game.map] || MAPS.world; }
function curGrid(game) { return curMapObj(game).grid; }
function mapW(game) { return curGrid(game)[0].length; }
function mapH(game) { return curGrid(game).length; }

function tileAt(game, x, y) {
  const g = curGrid(game);
  if (y < 0 || y >= g.length || x < 0 || x >= g[0].length) return '#';
  return g[y][x];
}

function isBlocked(game, x, y) {
  const ch = tileAt(game, x, y);
  if (BLOCKED.has(ch)) return true;
  for (const n of curMapObj(game).npcs) if (n.x === x && n.y === y) return true;
  return false;
}

function npcAt(game, x, y) {
  for (const n of curMapObj(game).npcs) if (n.x === x && n.y === y) return n;
  return null;
}

function warpAt(game, x, y) {
  const ws = curMapObj(game).warps || [];
  for (const w of ws) if (w.x === x && w.y === y) return w;
  return null;
}

/* ---- Bewegung ---- */
function startStep(game, dir) {
  const p = game.player;
  if (p.moving) return;
  p.dir = dir;
  const [dx, dy] = DIRV[dir];
  const nx = p.x + dx, ny = p.y + dy;
  if (isBlocked(game, nx, ny)) { p.step = (p.step + 1) % 2; if (window.Sound) Sound.sfx('bump'); return; }
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
      // Warp?
      const w = warpAt(game, p.x, p.y);
      if (w) { doWarp(game, w); return; }
      // Begegnung?
      const zone = ENCOUNTER_TILE[tileAt(game, p.x, p.y)];
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

function doWarp(game, w) {
  game.map = w.to;
  game.player.x = w.tx; game.player.y = w.ty; game.player.dir = w.dir || 'down';
  game.player.moving = false; game.player.offx = 0; game.player.offy = 0; game.player.frame = 0;
  game.held = null;
  game.mapNameUntil = Date.now() + 1800;
  if (window.Sound) Sound.sfx('select');
  saveGame(game);
}

/* ---- Heilen ---- */
function healParty(game) { for (const f of game.party) f.hp = f.maxHp; }

/* ---- Interaktion (A-Taste / Tippen) ---- */
function interactOverworld(game) {
  const p = game.player;
  if (p.moving) return;
  const [dx, dy] = DIRV[p.dir];
  const fx = p.x + dx, fy = p.y + dy;
  const npc = npcAt(game, fx, fy);
  if (npc) {
    if (npc.heal) healParty(game);
    let lines = npc.lines.slice();
    if (npc.nets && !(game.flags && game.flags.centerNets)) {
      game.flags = game.flags || {};
      game.flags.centerNets = true;
      game.bag.net = (game.bag.net || 0) + 5;
      lines = lines.concat(['Nimm 5 NETZE fürs Fangen!']);
    }
    openDialog(game, npc.name, lines);
    if (npc.heal || npc.nets) saveGame(game);
    return;
  }
  const ch = tileAt(game, fx, fy);
  if (ch === 'h' || ch === 'b') {
    healParty(game);
    openDialog(game, 'Ruhe', ['Deine Fische ruhen sich aus.', 'Alle sind wieder topfit!']);
    saveGame(game);
    return;
  }
  if (ch === 'H') { openDialog(game, '', ['Die Tür ist verschlossen.']); return; }
  if (ch === 'K' || ch === 'O' || ch === 'E') { openDialog(game, '', ['Nichts Interessantes.']); return; }
}

/* ---- Wilde Begegnung ---- */
function startWildBattle(game, zoneKey) {
  const zone = ENCOUNTERS[zoneKey];
  const total = zone.table.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total, pick = zone.table[0].id;
  for (const e of zone.table) { r -= e.w; if (r <= 0) { pick = e.id; break; } }
  const lvl = zone.levels[0] + Math.floor(Math.random() * (zone.levels[1] - zone.levels[0] + 1));
  const enemy = createFish(pick, lvl);
  game.dex.add(pick);

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
    game.map = 'world';
    game.player.x = HOME.x; game.player.y = HOME.y;
    game.player.moving = false; game.player.offx = 0; game.player.offy = 0;
    healParty(game);
    game.mode = 'overworld';
    openDialog(game, 'Fisch-Center', ['Du wurdest ins CENTER', 'gebracht...', 'Alle Fische geheilt.']);
  } else {
    game.mode = 'overworld';
  }
  saveGame(game);
}

/* ---- Dialog ---- */
function openDialog(game, name, lines) {
  game.dialog = { name, lines: lines.slice(), page: 0 };
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
  if (npc.name === 'Schild') return;    // Schilder sind bereits als Kachel gezeichnet
  pset(ctx, sx + 5, sy + 2, 6, 4, 1);   // Kopf
  pset(ctx, sx + 6, sy + 3, 1, 1, 0);
  pset(ctx, sx + 9, sy + 3, 1, 1, 0);
  pset(ctx, sx + 4, sy + 6, 8, 6, 2);   // Körper
  pset(ctx, sx + 5, sy + 12, 2, 3, 0);
  pset(ctx, sx + 9, sy + 12, 2, 3, 0);
}

function drawSignPost(ctx, sx, sy) {
  pset(ctx, sx + 2, sy + 3, 12, 7, 1);
  pset(ctx, sx + 4, sy + 5, 8, 1, 3);
  pset(ctx, sx + 4, sy + 7, 6, 1, 3);
  pset(ctx, sx + 7, sy + 10, 2, 4, 0);
}

function renderOverworld(ctx, game) {
  const p = game.player;
  const MW = mapW(game) * TILE, MH = mapH(game) * TILE;
  const ppx = p.x * TILE + (p.offx || 0);
  const ppy = p.y * TILE + (p.offy || 0);
  let camX = Math.round(ppx - 80 + 8);
  let camY = Math.round(ppy - 72 + 8);
  camX = Math.max(0, Math.min(Math.max(0, MW - 160), camX));
  camY = Math.max(0, Math.min(Math.max(0, MH - 144), camY));
  // Kleine Karten zentrieren
  if (MW < 160) camX = -Math.floor((160 - MW) / 2);
  if (MH < 144) camY = -Math.floor((144 - MH) / 2);

  const frame = Math.floor(Date.now() / 400) % 2;
  const startTx = Math.floor(camX / TILE), startTy = Math.floor(camY / TILE);

  for (let ty = startTy; ty <= startTy + 10; ty++) {
    for (let tx = startTx; tx <= startTx + 11; tx++) {
      drawTile(ctx, tileAt(game, tx, ty), tx * TILE - camX, ty * TILE - camY, frame);
    }
  }
  for (const n of curMapObj(game).npcs) {
    const sx = n.x * TILE - camX, sy = n.y * TILE - camY;
    if (sx > -TILE && sx < 160 && sy > -TILE && sy < 144) {
      if (n.name === 'Schild') drawSignPost(ctx, sx, sy);
      else drawNPC(ctx, sx, sy, n);
    }
  }
  drawPlayer(ctx, Math.round(ppx - camX), Math.round(ppy - camY), p.dir, p.moving ? p.frame > 4 : false);

  // Ortsname kurz einblenden bei Kartenwechsel
  if (game.mapNameUntil && Date.now() < game.mapNameUntil) {
    const nm = curMapObj(game).name;
    drawWindow(ctx, 2, 2, 8 + nm.length * 6, 14);
    drawText(ctx, nm, 6, 5, 0);
  }
}
