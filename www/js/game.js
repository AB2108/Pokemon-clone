/* =========================================================================
   FISCHMON — Hauptspiel (Zustände, Eingabe, Schleife)
   ========================================================================= */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const game = {
  mode: 'title',
  player: { x: HOME.x, y: HOME.y, dir: 'down', moving: false, frame: 0, step: 0, offx: 0, offy: 0, tx: 0, ty: 0 },
  party: [],
  bag: { net: 10, goodnet: 3, supernet: 1 },
  dex: new Set(),
  caught: new Set(),
  starterChosen: false,
  battle: null,
  dialog: null,
  held: null,
  starterSel: 0,
  menuSel: 0,
  dexScroll: 0,
  partySel: 0,
  _hasSave: hasSave(),
  toast: null
};

/* ---------- Neues Spiel / Laden ---------- */
function newGameState() {
  game.player = { x: HOME.x, y: HOME.y, dir: 'down', moving: false, frame: 0, step: 0, offx: 0, offy: 0, tx: 0, ty: 0 };
  game.party = [];
  game.bag = { net: 10, goodnet: 3, supernet: 1 };
  game.dex = new Set();
  game.caught = new Set();
  game.starterChosen = false;
}

function loadIntoGame() {
  const d = loadGame();
  if (!d) { newGameState(); game.mode = 'starter'; return; }
  game.player = Object.assign({ moving: false, frame: 0, step: 0, offx: 0, offy: 0 }, d.player);
  game.party = d.party || [];
  game.bag = d.bag || { net: 10 };
  game.dex = d.dex; game.caught = d.caught;
  game.starterChosen = d.starterChosen;
  game.mode = 'overworld';
}

function chooseStarter(spId) {
  const fish = createFish(spId, 5);
  game.party = [fish];
  game.dex.add(spId); game.caught.add(spId);
  game.starterChosen = true;
  game.player.x = HOME.x; game.player.y = HOME.y; game.player.dir = 'down';
  saveGame(game);
  game.mode = 'overworld';
  openDialog(game, 'Prof. Kiemann',
    ['Ausgezeichnete Wahl!', 'Lauf in die blauen Untiefen,', 'um wilde Fische zu treffen.', 'Wirf ein NETZ zum Fangen!']);
}

/* ---------- Eingabe ---------- */
function keyDown(key) {
  if (DIRV[key]) game.held = key;
  discrete(key);
}
function keyUp(key) {
  if (game.held === key) game.held = null;
}

function discrete(key) {
  switch (game.mode) {
    case 'title':    return inputTitle(key);
    case 'starter':  return inputStarter(key);
    case 'overworld':return inputOverworld(key);
    case 'battle':   return game.battle && game.battle.handleInput(key);
    case 'dialog':   if (key === 'a' || key === 'b') advanceDialog(game); return;
    case 'pause':    return inputPause(key);
    case 'dex':      return inputDex(key);
    case 'partyview':return inputPartyView(key);
  }
}

function inputTitle(key) {
  if (game._hasSave) {
    if (key === 'a') { loadIntoGame(); }
    else if (key === 'start' || key === 'b') { newGameState(); game.mode = 'starter'; }
  } else {
    if (key === 'a' || key === 'start') { newGameState(); game.mode = 'starter'; }
  }
}

function inputStarter(key) {
  if (key === 'left') game.starterSel = (game.starterSel + 2) % 3;
  else if (key === 'right') game.starterSel = (game.starterSel + 1) % 3;
  else if (key === 'a') chooseStarter(STARTERS[game.starterSel]);
}

function inputOverworld(key) {
  if (key === 'a') interactOverworld(game);
  else if (key === 'start') { game.mode = 'pause'; game.menuSel = 0; }
}

function inputPause(key) {
  const items = ['FISCHDEX', 'TEAM', 'SPEICHERN', 'SCHLIESSEN'];
  if (key === 'up') game.menuSel = (game.menuSel + items.length - 1) % items.length;
  else if (key === 'down') game.menuSel = (game.menuSel + 1) % items.length;
  else if (key === 'b' || key === 'start') { game.mode = 'overworld'; }
  else if (key === 'a') {
    if (game.menuSel === 0) { game.mode = 'dex'; game.dexScroll = 0; }
    else if (game.menuSel === 1) { game.mode = 'partyview'; game.partySel = 0; }
    else if (game.menuSel === 2) { saveGame(game); game._hasSave = true; toast('Spiel gespeichert!'); }
    else if (game.menuSel === 3) { game.mode = 'overworld'; }
  }
}

function inputDex(key) {
  const ids = Object.keys(SPECIES);
  if (key === 'up') game.dexScroll = Math.max(0, game.dexScroll - 1);
  else if (key === 'down') game.dexScroll = Math.min(Math.max(0, ids.length - 9), game.dexScroll + 1);
  else if (key === 'b') { game.mode = 'pause'; }
}

function inputPartyView(key) {
  if (game.party.length === 0) { if (key === 'b') game.mode = 'pause'; return; }
  if (key === 'up') game.partySel = (game.partySel + game.party.length - 1) % game.party.length;
  else if (key === 'down') game.partySel = (game.partySel + 1) % game.party.length;
  else if (key === 'b') { game.mode = 'pause'; }
}

function toast(msg) { game.toast = { text: msg, until: Date.now() + 1400 }; }

/* ---------- Rendern der Nicht-Kampf-Modi ---------- */
function bigText(text, cx, y, size, color) {
  ctx.fillStyle = PAL[color === undefined ? 0 : color];
  ctx.font = 'bold ' + size + 'px "Courier New", monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(text, cx, y);
  ctx.textAlign = 'left';
}

function renderTitle() {
  pset(ctx, 0, 0, 160, 144, 3);
  pset(ctx, 0, 96, 160, 48, 2);
  // Wellen
  const f = Math.floor(Date.now() / 400) % 2;
  for (let x = 0; x < 160; x += 16) { pset(ctx, x + (f ? 4 : 0), 92, 8, 2, 1); }
  drawFishSprite(ctx, 80, 60, 4, SPECIES.swordfish, -1);
  bigText('FISCHMON', 80, 18, 20, 0);
  drawTextCenter(ctx, 'Fang sie alle!', 80, 42, 1);
  const blink = Math.floor(Date.now() / 500) % 2;
  if (blink) {
    if (game._hasSave) {
      drawTextCenter(ctx, 'A: Weiter', 80, 112, 0);
      drawTextCenter(ctx, 'MENUE: Neues Spiel', 80, 124, 0);
    } else {
      drawTextCenter(ctx, 'A / MENUE: Start', 80, 118, 0);
    }
  }
}

function renderStarter() {
  pset(ctx, 0, 0, 160, 144, 3);
  bigText('Waehle deinen Fisch', 80, 8, 10, 0);
  const xs = [34, 80, 126];
  for (let i = 0; i < 3; i++) {
    const sp = SPECIES[STARTERS[i]];
    if (i === game.starterSel) { drawWindow(ctx, xs[i] - 22, 26, 44, 44); }
    drawFishSprite(ctx, xs[i], 48, 2.4, sp, -1);
  }
  const sel = SPECIES[STARTERS[game.starterSel]];
  drawWindow(ctx, 6, 78, 148, 60);
  bigText(sel.name, 80, 84, 11, 0);
  drawTextCenter(ctx, 'Typ: ' + sel.types.join('/'), 80, 100, 0);
  drawTextCenter(ctx, '< L / R waehlen  >', 80, 114, 1);
  drawTextCenter(ctx, 'A: Diesen Fisch nehmen', 80, 126, 0);
}

function renderPause() {
  renderOverworld(ctx, game);
  const items = ['FISCHDEX', 'TEAM', 'SPEICHERN', 'SCHLIESSEN'];
  drawMenu(ctx, items, game.menuSel, 92, 6, 62);
}

function renderDex() {
  pset(ctx, 0, 0, 160, 144, 3);
  drawWindow(ctx, 2, 2, 156, 140);
  bigText('FISCHDEX', 80, 8, 11, 0);
  const caughtN = game.caught.size, seenN = game.dex.size;
  drawTextCenter(ctx, 'Gefangen ' + caughtN + '  Gesehen ' + seenN, 80, 22, 1);
  const ids = Object.keys(SPECIES);
  for (let row = 0; row < 9; row++) {
    const i = game.dexScroll + row;
    if (i >= ids.length) break;
    const id = ids[i];
    const y = 34 + row * 11;
    const num = ('00' + (i + 1)).slice(-3);
    let mark = '  ', name = '----------';
    if (game.caught.has(id)) { mark = 'X '; name = SPECIES[id].name; }
    else if (game.dex.has(id)) { mark = '. '; name = SPECIES[id].name; }
    drawText(ctx, num + ' ' + mark + name, 12, y, 0);
  }
  drawTextCenter(ctx, 'Hoch/Runter  B: Zurueck', 80, 132, 1);
}

function renderPartyView() {
  pset(ctx, 0, 0, 160, 144, 3);
  drawWindow(ctx, 2, 2, 156, 140);
  bigText('TEAM', 80, 6, 11, 0);
  if (game.party.length === 0) { drawTextCenter(ctx, 'Noch keine Fische.', 80, 60, 0); return; }
  for (let i = 0; i < game.party.length; i++) {
    const f = game.party[i];
    const y = 22 + i * 12;
    if (i === game.partySel) drawText(ctx, '>', 8, y, 0);
    drawText(ctx, f.name + ' L' + f.level, 16, y, 0);
    drawText(ctx, f.hp + '/' + f.maxHp, 96, y, 0);
    drawHPBar(ctx, 96, y + 8, 52, f.hp / f.maxHp);
  }
  const sel = game.party[game.partySel];
  drawWindow(ctx, 6, 92, 148, 46);
  drawFishSprite(ctx, 24, 116, 2.0, SPECIES[sel.sp], 1);
  drawText(ctx, 'Typ ' + SPECIES[sel.sp].types.join('/'), 44, 98, 0);
  const mv = sel.moves.map(id => MOVES[id].name);
  drawText(ctx, mv[0] || '', 44, 110, 0);
  drawText(ctx, mv[1] || '', 44, 120, 0);
  drawText(ctx, mv[2] || '', 100, 110, 0);
  drawText(ctx, mv[3] || '', 100, 120, 0);
  drawTextCenter(ctx, 'B: Zurueck', 80, 130, 1);
}

function renderDialog() {
  renderOverworld(ctx, game);
  const d = game.dialog;
  drawWindow(ctx, 2, 100, 156, 42);
  if (d.name) drawText(ctx, d.name, 8, 103, 1);
  const l1 = d.lines[d.page], l2 = d.lines[d.page + 1];
  if (l1) drawText(ctx, l1, 8, 116, 0);
  if (l2) drawText(ctx, l2, 8, 128, 0);
  const t = Math.floor(Date.now() / 350) % 2;
  if (t) pset(ctx, 148, 134, 4, 4, 0);
}

/* ---------- Hauptschleife ---------- */
let last = 0;
let lastTick = 0;
let usingInterval = false;

function frame(ts) {
  const now = ts || (performance.now ? performance.now() : Date.now());
  const dt = last ? now - last : 16;
  last = now;
  lastTick = now;

  if (game.mode === 'overworld') updateOverworld(game, dt);

  switch (game.mode) {
    case 'title': renderTitle(); break;
    case 'starter': renderStarter(); break;
    case 'overworld': renderOverworld(ctx, game); break;
    case 'dialog': renderDialog(); break;
    case 'pause': renderPause(); break;
    case 'dex': renderDex(); break;
    case 'partyview': renderPartyView(); break;
    case 'battle': game.battle ? game.battle.render(ctx) : (game.mode = 'overworld'); break;
  }

  if (game.toast && Date.now() < game.toast.until) {
    drawWindow(ctx, 20, 60, 120, 22);
    drawTextCenter(ctx, game.toast.text, 80, 67, 0);
  } else if (game.toast) game.toast = null;
}

function loop(ts) {
  frame(ts);
  if (!usingInterval) requestAnimationFrame(loop);
}

// Sofort einmal zeichnen, damit der Bildschirm nie leer bleibt.
frame();

// Watchdog: Falls requestAnimationFrame gedrosselt wird (manche In-App-Browser
// starten es erst nach einer Berührung), auf einen Timer umschalten.
function startLoop() {
  last = 0;
  requestAnimationFrame(loop);
  setTimeout(() => {
    if (!usingInterval && performance.now() - lastTick > 300) {
      usingInterval = true;
      setInterval(() => frame(), 1000 / 30);
    }
  }, 500);
}
// Nach Sichtbarkeit/Resize sicherheitshalber neu anstoßen.
document.addEventListener('visibilitychange', () => { if (!document.hidden && !usingInterval) { last = 0; requestAnimationFrame(loop); } });
window.addEventListener('pageshow', () => { if (!usingInterval) { last = 0; requestAnimationFrame(loop); } });

/* ---------- Eingabe-Bindung ---------- */
function bindButton(el) {
  const key = el.dataset.key;
  if (key === 'none') return;
  const down = (e) => { e.preventDefault(); keyDown(key); };
  const up = (e) => { e.preventDefault(); keyUp(key); };
  el.addEventListener('touchstart', down, { passive: false });
  el.addEventListener('touchend', up, { passive: false });
  el.addEventListener('touchcancel', up, { passive: false });
  el.addEventListener('mousedown', down);
  el.addEventListener('mouseup', up);
  el.addEventListener('mouseleave', up);
}
document.querySelectorAll('.btn').forEach(bindButton);

const KEYMAP = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
  z: 'a', Z: 'a', Enter: 'a', x: 'b', X: 'b',
  Shift: 'start', Escape: 'start'
};
window.addEventListener('keydown', (e) => {
  const k = KEYMAP[e.key];
  if (!k) return;
  e.preventDefault();
  if (!e.repeat) keyDown(k);
});
window.addEventListener('keyup', (e) => {
  const k = KEYMAP[e.key];
  if (!k) return;
  keyUp(k);
});

window.game = game;
startLoop();
