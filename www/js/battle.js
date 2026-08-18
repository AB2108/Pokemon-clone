/* =========================================================================
   FISCHMON — Kreaturen-Mathematik & Kampfsystem
   ========================================================================= */

/* ---------- Kreaturen-Helfer ---------- */
function xpForLevel(l) { return l * l * l; }

function statsFromBase(spId, level) {
  const b = SPECIES[spId].base;
  const f = (v) => Math.floor(v * 2 * level / 100);
  return {
    maxHp: f(b.hp) + level + 10,
    atk: f(b.atk) + 5,
    def: f(b.def) + 5,
    spd: f(b.spd) + 5
  };
}

function learnsetFor(spId, level) {
  const entries = Object.entries(SPECIES[spId].learn)
    .map(([lv, mv]) => [+lv, mv])
    .sort((a, b) => a[0] - b[0]);
  const ids = [];
  for (const [lv, mv] of entries) if (lv <= level && !ids.includes(mv)) ids.push(mv);
  return ids.slice(-4);
}

function createFish(spId, level) {
  const s = statsFromBase(spId, level);
  return {
    sp: spId, name: SPECIES[spId].name, level,
    xp: xpForLevel(level),
    maxHp: s.maxHp, hp: s.maxHp,
    atk: s.atk, def: s.def, spd: s.spd,
    moves: learnsetFor(spId, level)
  };
}

function recalcStats(fish) {
  const oldMax = fish.maxHp;
  const s = statsFromBase(fish.sp, fish.level);
  fish.maxHp = s.maxHp; fish.atk = s.atk; fish.def = s.def; fish.spd = s.spd;
  fish.hp = Math.min(fish.maxHp, fish.hp + (fish.maxHp - oldMax));
}

// EP vergeben, Level-Ups & neu gelernte Attacken zurückgeben
function gainXpToFish(fish, amount) {
  const res = { levels: [], learned: [] };
  fish.xp += amount;
  while (fish.level < 100 && fish.xp >= xpForLevel(fish.level + 1)) {
    fish.level++;
    recalcStats(fish);
    res.levels.push(fish.level);
    for (const [lv, mv] of Object.entries(SPECIES[fish.sp].learn)) {
      if (+lv === fish.level && !fish.moves.includes(mv)) {
        if (fish.moves.length < 4) fish.moves.push(mv);
        else fish.moves = fish.moves.slice(1).concat(mv);
        res.learned.push(mv);
      }
    }
  }
  return res;
}

function evolvedForm(fish) {
  const s = SPECIES[fish.sp];
  return (s.evo && fish.level >= s.evo.lvl) ? s.evo.to : null;
}

function applyEvolution(fish, toId) {
  const oldMax = fish.maxHp;
  const wasDefault = fish.name === SPECIES[fish.sp].name;
  fish.sp = toId;
  if (wasDefault) fish.name = SPECIES[toId].name;
  const s = statsFromBase(toId, fish.level);
  fish.maxHp = s.maxHp; fish.atk = s.atk; fish.def = s.def; fish.spd = s.spd;
  fish.hp = Math.min(fish.maxHp, fish.hp + (fish.maxHp - oldMax));
}

/* ---------- Kampf-Mathematik ---------- */
function stageMul(s) { s = Math.max(-6, Math.min(6, s)); return s >= 0 ? (2 + s) / 2 : 2 / (2 - s); }
function effStat(fish, key) { return Math.max(1, Math.floor(fish[key] * stageMul(fish.stages[key]))); }

function calcDamage(att, def, move) {
  if (move.power <= 0) return { dmg: 0, eff: 1 };
  const A = effStat(att, 'atk'), D = effStat(def, 'def');
  let base = Math.floor(((2 * att.level / 5 + 2) * move.power * A / D) / 50) + 2;
  const stab = SPECIES[att.sp].types.includes(move.type) ? 1.5 : 1;
  const eff = typeMultiplier(move.type, SPECIES[def.sp].types);
  const rand = 0.85 + Math.random() * 0.15;
  const dmg = Math.max(1, Math.floor(base * stab * eff * rand));
  return { dmg, eff };
}

/* ---------- Kampf-Zustand ---------- */
function makeBattle(opts) {
  const B = {
    party: opts.party,
    activeIndex: opts.activeIndex || 0,
    enemy: opts.enemy,
    bag: opts.bag,
    dex: opts.dex,
    caught: opts.caught,
    canRun: opts.canRun !== false,
    onEnd: opts.onEnd,
    phase: 'busy',
    q: [],
    curMsg: null,
    mi: 0,           // Menü-Index
    ended: false,
    outcome: null,
    needSwitch: false,
    netList: []
  };

  const active = () => B.party[B.activeIndex];
  B.enemy.stages = { atk: 0, def: 0, spd: 0 };
  active().stages = { atk: 0, def: 0, spd: 0 };

  const dispName = (f, foe) => f.name;

  function msgSteps(text) {
    const ls = wrapText(text, 26);
    const out = [];
    for (let i = 0; i < ls.length; i += 2) out.push({ t: 'm', lines: ls.slice(i, i + 2) });
    return out;
  }
  function pushMsg(text) { for (const s of msgSteps(text)) B.q.push(s); }
  function pushAct(fn) { B.q.push({ t: 'a', fn }); }

  function pump() {
    for (;;) {
      if (B.q.length === 0) {
        if (B.ended) { B.phase = 'over'; B.curMsg = B.finalMsg || [' ']; }
        else if (B.needSwitch) { B.phase = 'party'; B.mi = firstAlive(); }
        else { B.phase = 'menu'; B.mi = 0; B.curMsg = null; }
        return;
      }
      const s = B.q[0];
      if (s.t === 'a') { B.q.shift(); const r = s.fn(); if (r && r.length) B.q.unshift(...r); continue; }
      if (s.t === 'm') { B.phase = 'busy'; B.curMsg = s.lines; return; }
    }
  }

  function firstAlive() {
    for (let i = 0; i < B.party.length; i++) if (B.party[i].hp > 0) return i;
    return 0;
  }
  function aliveCount() { return B.party.filter(f => f.hp > 0).length; }

  /* --- eine Attacke ausführen (als Act, gibt Folge-Steps zurück) --- */
  function doMove(att, def, move) {
    return () => {
      if (att.hp <= 0) return [];
      const steps = [];
      const add = (txt) => { for (const s of msgSteps(txt)) steps.push(s); };
      add(`${att.name} setzt ${move.name} ein!`);

      if (Math.random() * 100 > move.acc) { add('Die Attacke geht daneben!'); return steps; }

      if (move.cat === 'status') {
        if (move.effect === 'atkUp') { att.stages.atk = Math.min(6, att.stages.atk + 1); add(`${att.name}: Angriff steigt!`); }
        else if (move.effect === 'defUp') { att.stages.def = Math.min(6, att.stages.def + 1); add(`${att.name}: Panzer haerter!`); }
        else if (move.effect === 'foeDefDown') { def.stages.def = Math.max(-6, def.stages.def - 1); add(`${def.name}: Verteidigung sinkt!`); }
        else if (move.effect === 'foeSpdDown') { def.stages.spd = Math.max(-6, def.stages.spd - 1); add(`${def.name}: Tempo sinkt!`); }
        return steps;
      }

      const r = calcDamage(att, def, move);
      def.hp = Math.max(0, def.hp - r.dmg);
      if (r.eff > 1) add('Sehr effektiv!');
      else if (r.eff > 0 && r.eff < 1) add('Nicht sehr effektiv...');
      if (def.hp <= 0) add(`${def.name} wurde besiegt!`);
      return steps;
    };
  }

  function pickEnemyMove() {
    const mvs = B.enemy.moves.map(id => MOVES[id]);
    const dmg = mvs.filter(m => m.power > 0);
    if (dmg.length === 0) return mvs[Math.floor(Math.random() * mvs.length)];
    // 70% bestmögliche, sonst zufällig
    if (Math.random() < 0.7) {
      let best = dmg[0], bs = -1;
      for (const m of dmg) {
        const sc = m.power * typeMultiplier(m.type, SPECIES[active().sp].types);
        if (sc > bs) { bs = sc; best = m; }
      }
      return best;
    }
    return dmg[Math.floor(Math.random() * dmg.length)];
  }

  /* --- Ausgang nach beiden Zügen prüfen --- */
  function endCheck() {
    return () => {
      if (B.enemy.hp <= 0) return winSteps();
      if (active().hp <= 0) return faintSteps();
      return [];
    };
  }

  function winSteps() {
    B.ended = true; B.outcome = 'win';
    const steps = [];
    const add = (t) => { for (const s of msgSteps(t)) steps.push(s); };
    const fish = active();
    const xp = Math.floor(SPECIES[B.enemy.sp].xp * B.enemy.level / 7) + 1;
    add(`Sieg! ${fish.name} erhaelt ${xp} EP.`);
    steps.push({ t: 'a', fn: () => {
      const res = gainXpToFish(fish, xp);
      const out = [];
      const a = (t) => { for (const s of msgSteps(t)) out.push(s); };
      for (const lv of res.levels) a(`${fish.name} steigt auf Lv.${lv}!`);
      for (const mv of res.learned) a(`${fish.name} lernt ${MOVES[mv].name}!`);
      const evo = evolvedForm(fish);
      if (evo) {
        const oldName = fish.name;
        a(`Hae? ${oldName} entwickelt sich...`);
        out.push({ t: 'a', fn: () => { applyEvolution(fish, evo); B.dex.add(fish.sp); B.caught.add(fish.sp); return []; } });
        a(`...zu ${SPECIES[evo].name}!`);
      }
      return out;
    } });
    steps.push({ t: 'a', fn: () => { B.finalMsg = ['Kampf gewonnen!']; return []; } });
    return steps;
  }

  function faintSteps() {
    const steps = [];
    const add = (t) => { for (const s of msgSteps(t)) steps.push(s); };
    add(`${active().name} wurde besiegt!`);
    steps.push({ t: 'a', fn: () => {
      if (aliveCount() > 0) { B.needSwitch = true; return []; }
      B.ended = true; B.outcome = 'lose';
      B.finalMsg = ['Alle Fische besiegt...'];
      return msgSteps('Du hast keine kampffaehigen Fische mehr! Schnell nach Hause!');
    } });
    return steps;
  }

  /* ---------- öffentliche Aktionen ---------- */
  function chooseMove(idx) {
    const you = active();
    const yourMove = MOVES[you.moves[idx]];
    const foeMove = pickEnemyMove();
    const youFirst = effStat(you, 'spd') >= effStat(B.enemy, 'spd')
      ? (effStat(you, 'spd') === effStat(B.enemy, 'spd') ? Math.random() < 0.5 : true) : false;
    B.q = [];
    if (youFirst) { pushAct(doMove(you, B.enemy, yourMove)); pushAct(doMove(B.enemy, you, foeMove)); }
    else { pushAct(doMove(B.enemy, you, foeMove)); pushAct(doMove(you, B.enemy, yourMove)); }
    B.q.push({ t: 'a', fn: endCheck() });
    B.phase = 'busy'; pump();
  }

  function enemyTurnThen() {
    // Gegner greift an (nach Fehlschlag Fang/Flucht/freiwilligem Wechsel)
    pushAct(doMove(B.enemy, active(), pickEnemyMove()));
    B.q.push({ t: 'a', fn: endCheck() });
  }

  function doSwitch(j, forced) {
    if (j === B.activeIndex && !forced) return;
    B.q = [];
    B.activeIndex = j;
    active().stages = { atk: 0, def: 0, spd: 0 };
    B.needSwitch = false;
    pushMsg(`Los, ${active().name}!`);
    if (!forced) enemyTurnThen();
    B.phase = 'busy'; pump();
  }

  function attemptCatch(netId) {
    const net = NETS[netId];
    B.bag[netId] = (B.bag[netId] || 0) - 1;
    B.q = [];
    pushMsg(`Du wirfst ${net.name}!`);
    const e = B.enemy;
    const hpF = (3 * e.maxHp - 2 * e.hp) / (3 * e.maxHp);
    const rate = SPECIES[e.sp].catch * net.bonus * hpF;
    const p = Math.min(0.95, rate / 255 * 1.4);
    if (Math.random() < p) {
      B.ended = true; B.outcome = 'caught';
      pushMsg(`Klasse! ${e.name} wurde gefangen!`);
      B.q.push({ t: 'a', fn: () => {
        B.dex.add(e.sp); B.caught.add(e.sp);
        const out = [];
        if (B.party.length < 6) {
          const nf = createFish(e.sp, e.level);
          nf.hp = e.hp; B.party.push(nf);
          for (const s of msgSteps(`${e.name} kommt ins Team.`)) out.push(s);
        } else {
          for (const s of msgSteps(`${e.name} wandert in die Box.`)) out.push(s);
        }
        B.finalMsg = [`${e.name} gefangen!`];
        return out;
      } });
    } else {
      pushMsg(`Oh nein! ${e.name} entkam dem Netz!`);
      enemyTurnThen();
    }
    B.phase = 'busy'; pump();
  }

  function attemptRun() {
    if (!B.canRun) { B.q = []; pushMsg('Flucht ist nicht moeglich!'); B.phase = 'busy'; pump(); return; }
    const you = active();
    const chance = Math.min(1, 0.5 + 0.5 * (effStat(you, 'spd') / Math.max(1, effStat(B.enemy, 'spd'))));
    B.q = [];
    if (Math.random() < chance) {
      B.ended = true; B.outcome = 'run'; B.finalMsg = ['Entkommen!'];
      pushMsg('Du bist entkommen!');
    } else {
      pushMsg('Flucht gescheitert!');
      enemyTurnThen();
    }
    B.phase = 'busy'; pump();
  }

  /* ---------- Eingabe ---------- */
  B.handleInput = function (key) {
    if (B.phase === 'busy') {
      if (key === 'a' || key === 'b') { B.q.shift(); pump(); }
      return;
    }
    if (B.phase === 'over') {
      if (key === 'a' || key === 'b') B.onEnd(B.outcome);
      return;
    }
    if (B.phase === 'menu') {
      const n = 4;
      if (key === 'up') B.mi = (B.mi + n - 1) % n;
      else if (key === 'down') B.mi = (B.mi + 1) % n;
      else if (key === 'a') {
        if (B.mi === 0) { B.phase = 'moves'; B.mi = 0; }
        else if (B.mi === 1) { openNets(); }
        else if (B.mi === 2) { B.phase = 'party'; B.mi = B.activeIndex; }
        else if (B.mi === 3) { attemptRun(); }
      }
      return;
    }
    if (B.phase === 'moves') {
      const mv = active().moves;
      if (key === 'up') B.mi = (B.mi + mv.length - 1) % mv.length;
      else if (key === 'down') B.mi = (B.mi + 1) % mv.length;
      else if (key === 'b') { B.phase = 'menu'; B.mi = 0; }
      else if (key === 'a') chooseMove(B.mi);
      return;
    }
    if (B.phase === 'nets') {
      const n = B.netList.length;
      if (n === 0) { if (key === 'b' || key === 'a') { B.phase = 'menu'; B.mi = 1; } return; }
      if (key === 'up') B.mi = (B.mi + n - 1) % n;
      else if (key === 'down') B.mi = (B.mi + 1) % n;
      else if (key === 'b') { B.phase = 'menu'; B.mi = 1; }
      else if (key === 'a') attemptCatch(B.netList[B.mi]);
      return;
    }
    if (B.phase === 'party') {
      const n = B.party.length;
      if (key === 'up') B.mi = (B.mi + n - 1) % n;
      else if (key === 'down') B.mi = (B.mi + 1) % n;
      else if (key === 'b') { if (!B.needSwitch) { B.phase = 'menu'; B.mi = 2; } }
      else if (key === 'a') {
        const f = B.party[B.mi];
        if (f.hp <= 0) return;
        if (B.mi === B.activeIndex && !B.needSwitch) return;
        doSwitch(B.mi, B.needSwitch);
      }
      return;
    }
  };

  function openNets() {
    B.netList = Object.keys(NETS).filter(id => (B.bag[id] || 0) > 0);
    B.phase = 'nets'; B.mi = 0;
  }

  /* ---------- Rendern ---------- */
  B.render = function (ctx) {
    pset(ctx, 0, 0, 160, 144, 3);
    // Deko-Plattformen
    fillEllipse(ctx, 116, 56, 26, 5, 1);
    fillEllipse(ctx, 40, 100, 30, 6, 1);
    // Fische
    if (B.enemy.hp > 0 || !B.ended) drawFishSprite(ctx, 116, 42, 2.6, SPECIES[B.enemy.sp], -1);
    if (active().hp > 0) drawFishSprite(ctx, 40, 86, 3.0, SPECIES[active().sp], 1);

    // Gegner-Statusfenster
    drawWindow(ctx, 4, 6, 86, 26);
    drawText(ctx, B.enemy.name, 9, 10, 0);
    drawText(ctx, ':L' + B.enemy.level, 66, 10, 0);
    drawHPBar(ctx, 9, 22, 72, B.enemy.hp / B.enemy.maxHp);

    // Spieler-Statusfenster
    const you = active();
    drawWindow(ctx, 70, 62, 86, 30);
    drawText(ctx, you.name, 75, 66, 0);
    drawText(ctx, ':L' + you.level, 132, 66, 0);
    drawHPBar(ctx, 75, 78, 72, you.hp / you.maxHp);
    drawText(ctx, you.hp + '/' + you.maxHp, 92, 82, 0);

    // Unterer Bereich
    if (B.phase === 'menu') {
      drawWindow(ctx, 2, 100, 92, 42);
      drawText(ctx, 'Was soll', 8, 108, 0);
      drawText(ctx, you.name + '?', 8, 120, 0);
      const items = ['KAMPF', 'NETZ', 'FISCH', 'FLUCHT'];
      drawMenu(ctx, items, B.mi, 96, 100, 62, { lh: 9 });
    } else if (B.phase === 'moves') {
      const items = active().moves.map(id => MOVES[id].name);
      drawWindow(ctx, 2, 100, 100, 42);
      const cur = MOVES[active().moves[B.mi]];
      drawText(ctx, 'TYP/' + cur.type, 8, 128, 0);
      for (let i = 0; i < items.length; i++) {
        if (i === B.mi) drawText(ctx, '>', 8, 104 + i * 8, 0);
        drawText(ctx, items[i], 16, 104 + i * 8, 0);
      }
      drawWindow(ctx, 104, 100, 54, 42);
      drawText(ctx, 'STK', 110, 108, 0);
      drawText(ctx, '' + cur.power, 110, 120, 0);
    } else if (B.phase === 'nets') {
      drawWindow(ctx, 2, 100, 156, 42);
      if (B.netList.length === 0) { drawText(ctx, 'Keine Netze mehr!', 10, 116, 0); }
      else {
        drawText(ctx, 'NETZ waehlen:', 10, 104, 0);
        for (let i = 0; i < B.netList.length; i++) {
          const id = B.netList[i];
          if (i === B.mi) drawText(ctx, '>', 10, 116 + i * 8, 0);
          drawText(ctx, NETS[id].name + '  x' + B.bag[id], 18, 116 + i * 8, 0);
        }
      }
    } else if (B.phase === 'party') {
      drawWindow(ctx, 2, 100, 156, 42);
      drawText(ctx, B.needSwitch ? 'Naechster Fisch!' : 'Team:', 8, 103, 0);
      for (let i = 0; i < B.party.length; i++) {
        const f = B.party[i];
        const y = 113 + i * 8;
        if (y > 138) break;
        if (i === B.mi) drawText(ctx, '>', 6, y, 0);
        const tag = i === B.activeIndex ? '*' : ' ';
        drawText(ctx, tag + f.name + ' L' + f.level + ' ' + f.hp + '/' + f.maxHp, 12, y, 0);
      }
    } else {
      // busy / over
      drawMessageBox(ctx, B.curMsg || [''], true);
    }
  };

  // Intro
  pushMsg(`Ein wildes ${B.enemy.name} taucht auf!`);
  pushMsg(`Los, ${active().name}!`);
  pump();
  return B;
}
