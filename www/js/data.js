/* =========================================================================
   FISCHMON — Spieldaten
   Ein Gen-1 Pokémon-Klon, bei dem alle Kreaturen Fischarten sind.
   ========================================================================= */

/* ---- Typen & Effektivität ---- */
const TYPES = ['Fluss', 'Meer', 'Tiefsee', 'Elektro', 'Gift', 'Panzer', 'Räuber', 'Basis'];

// 2x-Schaden gegen diese Verteidiger-Typen
const STRONG = {
  Fluss:   ['Tiefsee'],
  Meer:    ['Fluss'],
  Tiefsee: ['Meer'],
  Elektro: ['Meer', 'Fluss', 'Tiefsee'],
  Gift:    ['Fluss', 'Meer'],
  Panzer:  ['Elektro', 'Gift'],
  Räuber:  ['Tiefsee', 'Fluss'],
  Basis:   []
};
// 0.5x-Schaden gegen diese Verteidiger-Typen
const WEAK = {
  Fluss:   ['Meer', 'Gift'],
  Meer:    ['Tiefsee', 'Elektro'],
  Tiefsee: ['Fluss', 'Räuber'],
  Elektro: ['Panzer'],
  Gift:    ['Panzer', 'Gift'],
  Panzer:  ['Räuber', 'Meer'],
  Räuber:  ['Panzer', 'Elektro'],
  Basis:   []
};

function typeMultiplier(moveType, defenderTypes) {
  let m = 1;
  for (const dt of defenderTypes) {
    if ((STRONG[moveType] || []).includes(dt)) m *= 2;
    else if ((WEAK[moveType] || []).includes(dt)) m *= 0.5;
  }
  return m;
}

/* ---- Attacken ----
   cat: 'phys' = Schaden, 'status' = Effekt
   effect: 'atkUp' | 'defUp' | 'foeDefDown' | 'foeSpdDown'
*/
const MOVES = {
  bump:       { name: 'Rempler',      type: 'Basis',   power: 40, acc: 100, pp: 35, cat: 'phys' },
  bite:       { name: 'Biss',         type: 'Räuber',  power: 60, acc: 100, pp: 25, cat: 'phys' },
  chomp:      { name: 'Schnapp',      type: 'Räuber',  power: 90, acc: 95,  pp: 15, cat: 'phys' },
  finslap:    { name: 'Flossenhieb',  type: 'Fluss',   power: 45, acc: 100, pp: 30, cat: 'phys' },
  whirlpool:  { name: 'Strudel',      type: 'Fluss',   power: 75, acc: 95,  pp: 15, cat: 'phys' },
  wavecrash:  { name: 'Wellenbruch',  type: 'Meer',    power: 75, acc: 95,  pp: 15, cat: 'phys' },
  brine:      { name: 'Lake',         type: 'Meer',    power: 45, acc: 100, pp: 25, cat: 'phys' },
  darkdive:   { name: 'Dunkeltauch',  type: 'Tiefsee', power: 60, acc: 100, pp: 20, cat: 'phys' },
  crushdepth: { name: 'Tiefendruck',  type: 'Tiefsee', power: 95, acc: 90,  pp: 10, cat: 'phys' },
  shock:      { name: 'Schock',       type: 'Elektro', power: 45, acc: 100, pp: 30, cat: 'phys' },
  zap:        { name: 'Stromstoß',    type: 'Elektro', power: 85, acc: 95,  pp: 12, cat: 'phys' },
  sting:      { name: 'Stachel',      type: 'Gift',    power: 40, acc: 100, pp: 30, cat: 'phys' },
  toxicspine: { name: 'Giftstachel',  type: 'Gift',    power: 70, acc: 95,  pp: 15, cat: 'phys' },
  pinch:      { name: 'Zwicker',      type: 'Panzer',  power: 45, acc: 100, pp: 30, cat: 'phys' },
  shellbash:  { name: 'Panzerstoß',   type: 'Panzer',  power: 80, acc: 90,  pp: 12, cat: 'phys' },
  harden:     { name: 'Härtner',      type: 'Panzer',  power: 0,  acc: 100, pp: 30, cat: 'status', effect: 'defUp',    self: true },
  sharpen:    { name: 'Anspitzen',    type: 'Basis',   power: 0,  acc: 100, pp: 30, cat: 'status', effect: 'atkUp',    self: true },
  screech:    { name: 'Kreischen',    type: 'Basis',   power: 0,  acc: 90,  pp: 20, cat: 'status', effect: 'foeDefDown' },
  muddy:      { name: 'Schlammnebel', type: 'Fluss',   power: 0,  acc: 100, pp: 15, cat: 'status', effect: 'foeSpdDown' }
};

/* ---- Fischarten (Fischdex) ----
   base: {hp, atk, def, spd}
   catch: 0-255 (höher = leichter fangbar)
   xp: Basis-EP-Ausbeute
   learn: {level: moveId}
   evo: {to: speciesId, lvl}
   sprite: Zeichenparameter (siehe sprites.js)
*/
const SPECIES = {
  /* ----- Starter-Linien ----- */
  guppy: {
    name: 'Guppy', types: ['Fluss'], base: { hp: 44, atk: 48, def: 40, spd: 55 },
    catch: 45, xp: 64, learn: { 1: 'finslap', 3: 'bump', 7: 'muddy', 13: 'whirlpool', 20: 'bite' },
    evo: { to: 'piranha', lvl: 16 },
    sprite: { shape: 'round', shade: 2, tail: 'fan', fin: 'top', eye: 1, mouth: 'small' }
  },
  piranha: {
    name: 'Piranja', types: ['Fluss', 'Räuber'], base: { hp: 62, atk: 78, def: 55, spd: 62 },
    catch: 30, xp: 142, learn: { 1: 'finslap', 16: 'bite', 22: 'whirlpool', 30: 'chomp' },
    evo: { to: 'arapaima', lvl: 34 },
    sprite: { shape: 'fat', shade: 1, tail: 'fork', fin: 'top', eye: 1, mouth: 'teeth' }
  },
  arapaima: {
    name: 'Arapaima', types: ['Fluss', 'Räuber'], base: { hp: 95, atk: 102, def: 80, spd: 58 },
    catch: 15, xp: 240, learn: { 1: 'bite', 34: 'chomp', 40: 'crushdepth', 46: 'whirlpool' },
    sprite: { shape: 'long', shade: 1, tail: 'fan', fin: 'top', eye: 1, mouth: 'teeth' }
  },

  clownfish: {
    name: 'Clownfisch', types: ['Meer'], base: { hp: 45, atk: 46, def: 50, spd: 50 },
    catch: 45, xp: 64, learn: { 1: 'brine', 3: 'bump', 8: 'sting', 14: 'wavecrash', 20: 'harden' },
    evo: { to: 'angelfish', lvl: 16 },
    sprite: { shape: 'round', shade: 2, tail: 'fan', fin: 'top', eye: 1, stripes: true, mouth: 'small' }
  },
  angelfish: {
    name: 'Engelfisch', types: ['Meer'], base: { hp: 60, atk: 63, def: 68, spd: 60 },
    catch: 30, xp: 142, learn: { 1: 'brine', 16: 'wavecrash', 24: 'harden', 30: 'toxicspine' },
    evo: { to: 'swordfish', lvl: 34 },
    sprite: { shape: 'flat', shade: 2, tail: 'point', fin: 'tall', eye: 1, stripes: true, mouth: 'small' }
  },
  swordfish: {
    name: 'Schwertfisch', types: ['Meer', 'Räuber'], base: { hp: 78, atk: 100, def: 72, spd: 95 },
    catch: 15, xp: 240, learn: { 1: 'wavecrash', 34: 'bite', 40: 'wavecrash', 46: 'chomp' },
    sprite: { shape: 'long', shade: 1, tail: 'fork', fin: 'top', eye: 1, bill: true, mouth: 'small' }
  },

  lantern: {
    name: 'Laternenfisch', types: ['Tiefsee'], base: { hp: 48, atk: 50, def: 44, spd: 46 },
    catch: 45, xp: 64, learn: { 1: 'darkdive', 3: 'bump', 9: 'shock', 15: 'harden', 22: 'crushdepth' },
    evo: { to: 'anglerfish', lvl: 16 },
    sprite: { shape: 'round', shade: 1, tail: 'fan', fin: 'top', eye: 2, lure: true, mouth: 'teeth' }
  },
  anglerfish: {
    name: 'Anglerfisch', types: ['Tiefsee'], base: { hp: 68, atk: 72, def: 58, spd: 48 },
    catch: 30, xp: 142, learn: { 1: 'darkdive', 16: 'bite', 24: 'crushdepth', 32: 'zap' },
    evo: { to: 'gulper', lvl: 34 },
    sprite: { shape: 'fat', shade: 1, tail: 'fan', fin: 'top', eye: 2, lure: true, mouth: 'teeth' }
  },
  gulper: {
    name: 'Schluckaal', types: ['Tiefsee', 'Räuber'], base: { hp: 88, atk: 98, def: 66, spd: 70 },
    catch: 15, xp: 240, learn: { 1: 'crushdepth', 34: 'chomp', 42: 'darkdive', 48: 'zap' },
    sprite: { shape: 'eel', shade: 0, tail: 'point', fin: 'none', eye: 1, mouth: 'teeth' }
  },

  /* ----- Wild: Fluss / Teich ----- */
  minnow: {
    name: 'Elritze', types: ['Fluss'], base: { hp: 35, atk: 35, def: 35, spd: 50 },
    catch: 200, xp: 40, learn: { 1: 'bump', 6: 'finslap', 12: 'muddy' },
    evo: { to: 'carp', lvl: 18 },
    sprite: { shape: 'round', shade: 2, tail: 'fan', fin: 'none', eye: 1, mouth: 'small' }
  },
  carp: {
    name: 'Karpfen', types: ['Fluss'], base: { hp: 60, atk: 45, def: 60, spd: 40 },
    catch: 120, xp: 90, learn: { 1: 'finslap', 18: 'whirlpool', 24: 'harden' },
    sprite: { shape: 'fat', shade: 2, tail: 'fan', fin: 'top', eye: 1, mouth: 'small' }
  },
  catfish: {
    name: 'Wels', types: ['Fluss'], base: { hp: 70, atk: 58, def: 55, spd: 35 },
    catch: 90, xp: 110, learn: { 1: 'finslap', 3: 'bump', 20: 'whirlpool', 26: 'bite' },
    sprite: { shape: 'long', shade: 1, tail: 'fan', fin: 'none', eye: 1, whiskers: true, mouth: 'small' }
  },
  trout: {
    name: 'Forelle', types: ['Fluss'], base: { hp: 52, atk: 60, def: 48, spd: 62 },
    catch: 100, xp: 95, learn: { 1: 'finslap', 16: 'whirlpool', 22: 'bite' },
    sprite: { shape: 'long', shade: 2, tail: 'fork', fin: 'top', eye: 1, spots: true, mouth: 'small' }
  },
  pike: {
    name: 'Hecht', types: ['Fluss', 'Räuber'], base: { hp: 58, atk: 78, def: 50, spd: 68 },
    catch: 70, xp: 130, learn: { 1: 'bite', 18: 'whirlpool', 26: 'chomp' },
    sprite: { shape: 'long', shade: 1, tail: 'fork', fin: 'top', eye: 1, mouth: 'teeth' }
  },
  eel: {
    name: 'Zitteraal', types: ['Fluss', 'Elektro'], base: { hp: 55, atk: 62, def: 45, spd: 60 },
    catch: 70, xp: 135, learn: { 1: 'shock', 3: 'bump', 18: 'zap', 26: 'whirlpool' },
    sprite: { shape: 'eel', shade: 2, tail: 'point', fin: 'none', eye: 1, mouth: 'small' }
  },

  /* ----- Wild: Meer / Strand ----- */
  sardine: {
    name: 'Sardine', types: ['Meer'], base: { hp: 34, atk: 38, def: 34, spd: 55 },
    catch: 200, xp: 42, learn: { 1: 'bump', 7: 'brine', 13: 'wavecrash' },
    evo: { to: 'mackerel', lvl: 18 },
    sprite: { shape: 'round', shade: 3, tail: 'fork', fin: 'none', eye: 1, mouth: 'small' }
  },
  mackerel: {
    name: 'Makrele', types: ['Meer'], base: { hp: 52, atk: 58, def: 46, spd: 66 },
    catch: 120, xp: 96, learn: { 1: 'brine', 18: 'wavecrash', 24: 'bite' },
    sprite: { shape: 'long', shade: 2, tail: 'fork', fin: 'top', eye: 1, stripes: true, mouth: 'small' }
  },
  tuna: {
    name: 'Thunfisch', types: ['Meer'], base: { hp: 72, atk: 76, def: 58, spd: 72 },
    catch: 70, xp: 145, learn: { 1: 'wavecrash', 20: 'bite', 28: 'chomp' },
    sprite: { shape: 'fat', shade: 1, tail: 'fork', fin: 'top', eye: 1, mouth: 'small' }
  },
  mahi: {
    name: 'Goldmakrele', types: ['Meer'], base: { hp: 58, atk: 68, def: 50, spd: 74 },
    catch: 90, xp: 120, learn: { 1: 'brine', 18: 'wavecrash', 26: 'bite' },
    sprite: { shape: 'flat', shade: 3, tail: 'fork', fin: 'tall', eye: 1, mouth: 'small' }
  },
  barracuda: {
    name: 'Barrakuda', types: ['Meer', 'Räuber'], base: { hp: 64, atk: 88, def: 52, spd: 82 },
    catch: 55, xp: 165, learn: { 1: 'bite', 22: 'wavecrash', 30: 'chomp' },
    sprite: { shape: 'long', shade: 1, tail: 'fork', fin: 'top', eye: 1, mouth: 'teeth' }
  },
  shark: {
    name: 'Hai', types: ['Meer', 'Räuber'], base: { hp: 82, atk: 96, def: 70, spd: 76 },
    catch: 25, xp: 200, learn: { 1: 'bite', 3: 'wavecrash', 28: 'chomp', 36: 'crushdepth' },
    sprite: { shape: 'long', shade: 1, tail: 'fork', fin: 'shark', eye: 1, mouth: 'teeth' }
  },
  ray: {
    name: 'Torpedorochen', types: ['Meer', 'Elektro'], base: { hp: 60, atk: 58, def: 66, spd: 50 },
    catch: 60, xp: 150, learn: { 1: 'shock', 3: 'brine', 20: 'zap', 28: 'wavecrash' },
    sprite: { shape: 'flat', shade: 2, tail: 'point', fin: 'none', eye: 1, ray: true, mouth: 'small' }
  },

  /* ----- Wild: Tiefsee / Höhle ----- */
  viper: {
    name: 'Viperfisch', types: ['Tiefsee'], base: { hp: 46, atk: 72, def: 40, spd: 58 },
    catch: 90, xp: 120, learn: { 1: 'darkdive', 18: 'bite', 26: 'crushdepth' },
    sprite: { shape: 'long', shade: 0, tail: 'point', fin: 'top', eye: 2, mouth: 'teeth' }
  },
  hatchet: {
    name: 'Beilfisch', types: ['Tiefsee'], base: { hp: 44, atk: 48, def: 52, spd: 60 },
    catch: 120, xp: 100, learn: { 1: 'darkdive', 16: 'shock', 24: 'harden' },
    sprite: { shape: 'flat', shade: 3, tail: 'fork', fin: 'tall', eye: 2, mouth: 'small' }
  },
  frogfish: {
    name: 'Anglerkröte', types: ['Tiefsee', 'Gift'], base: { hp: 66, atk: 64, def: 68, spd: 30 },
    catch: 80, xp: 130, learn: { 1: 'sting', 18: 'darkdive', 26: 'toxicspine' },
    sprite: { shape: 'fat', shade: 1, tail: 'fan', fin: 'top', eye: 1, warts: true, mouth: 'small' }
  },

  /* ----- Wild: Gift / Riff ----- */
  puffer: {
    name: 'Kugelfisch', types: ['Gift'], base: { hp: 60, atk: 52, def: 62, spd: 42 },
    catch: 90, xp: 118, learn: { 1: 'sting', 3: 'harden', 18: 'toxicspine', 26: 'shellbash' },
    sprite: { shape: 'ball', shade: 2, tail: 'small', fin: 'none', eye: 1, spikes: true, mouth: 'small' }
  },
  lionfish: {
    name: 'Rotfeuerfisch', types: ['Gift'], base: { hp: 55, atk: 70, def: 55, spd: 58 },
    catch: 75, xp: 140, learn: { 1: 'sting', 18: 'toxicspine', 26: 'wavecrash' },
    sprite: { shape: 'round', shade: 1, tail: 'fan', fin: 'spikes', eye: 1, stripes: true, mouth: 'small' }
  },
  stonefish: {
    name: 'Steinfisch', types: ['Gift', 'Panzer'], base: { hp: 74, atk: 66, def: 84, spd: 26 },
    catch: 60, xp: 160, learn: { 1: 'sting', 3: 'harden', 22: 'toxicspine', 30: 'shellbash' },
    sprite: { shape: 'fat', shade: 0, tail: 'small', fin: 'spikes', eye: 1, warts: true, mouth: 'small' }
  },

  /* ----- Wild: Panzer / Krustentiere ----- */
  shrimp: {
    name: 'Garnele', types: ['Panzer'], base: { hp: 38, atk: 42, def: 48, spd: 52 },
    catch: 190, xp: 46, learn: { 1: 'pinch', 8: 'harden', 14: 'shellbash' },
    evo: { to: 'crab', lvl: 20 },
    sprite: { shape: 'shrimp', shade: 2, tail: 'point', fin: 'none', eye: 1, legs: true, mouth: 'small' }
  },
  crab: {
    name: 'Krabbe', types: ['Panzer'], base: { hp: 58, atk: 66, def: 78, spd: 40 },
    catch: 100, xp: 115, learn: { 1: 'pinch', 20: 'harden', 28: 'shellbash' },
    evo: { to: 'lobster', lvl: 32 },
    sprite: { shape: 'crab', shade: 1, tail: 'none', fin: 'none', eye: 1, claws: true, mouth: 'small' }
  },
  lobster: {
    name: 'Hummer', types: ['Panzer', 'Räuber'], base: { hp: 74, atk: 92, def: 88, spd: 46 },
    catch: 45, xp: 185, learn: { 1: 'shellbash', 32: 'pinch', 40: 'chomp', 46: 'harden' },
    sprite: { shape: 'crab', shade: 0, tail: 'fan', fin: 'none', eye: 1, claws: true, big: true, mouth: 'small' }
  }
};

/* ---- Starter-Auswahl ---- */
const STARTERS = ['guppy', 'clownfish', 'lantern'];

/* ---- Begegnungstabellen pro Wasserzone ---- */
const ENCOUNTERS = {
  pond: {   // Süßwasser / Teich  (Kachel 's')
    levels: [3, 7],
    table: [
      { id: 'minnow', w: 30 }, { id: 'carp', w: 22 }, { id: 'trout', w: 16 },
      { id: 'catfish', w: 12 }, { id: 'pike', w: 10 }, { id: 'eel', w: 6 },
      { id: 'guppy', w: 4 }
    ]
  },
  sea: {    // Meer / Strand  (Kachel '~')
    levels: [8, 14],
    table: [
      { id: 'sardine', w: 28 }, { id: 'mackerel', w: 20 }, { id: 'mahi', w: 15 },
      { id: 'tuna', w: 12 }, { id: 'barracuda', w: 10 }, { id: 'ray', w: 7 },
      { id: 'puffer', w: 5 }, { id: 'shark', w: 3 }
    ]
  },
  reef: {   // Riff  (Kachel 'r')
    levels: [10, 16],
    table: [
      { id: 'clownfish', w: 22 }, { id: 'lionfish', w: 20 }, { id: 'puffer', w: 18 },
      { id: 'stonefish', w: 12 }, { id: 'shrimp', w: 14 }, { id: 'crab', w: 10 },
      { id: 'lobster', w: 4 }
    ]
  },
  deep: {   // Höhle / Tiefsee  (Kachel 'c')
    levels: [14, 22],
    table: [
      { id: 'lantern', w: 22 }, { id: 'viper', w: 20 }, { id: 'hatchet', w: 18 },
      { id: 'frogfish', w: 14 }, { id: 'anglerfish', w: 10 }, { id: 'eel', w: 8 },
      { id: 'gulper', w: 8 }
    ]
  }
};

/* ---- Netze (Fanggegenstände, ersatz für Pokébälle) ---- */
const NETS = {
  net:      { name: 'Netz',       bonus: 1,   color: 1 },
  goodnet:  { name: 'Gutes Netz', bonus: 1.5, color: 2 },
  supernet: { name: 'Super-Netz', bonus: 2.5, color: 3 }
};

/* =========================================================================
   WELTKARTE
   Legende:
     #  Fels/Wand (blockiert)     T  Baum (blockiert)      W  Tiefwasser (blockiert)
     .  Weg/Sand                  ,  Gras (Deko)            s  Teich-Untiefe (Begegnung: pond)
     ~  Meer-Untiefe (sea)        r  Riff-Untiefe (reef)    c  Höhlenwasser (deep)
     H  Haus (blockiert)          L  Labor (blockiert)      D  Tür (Deko)
     =  Steg/Brücke               B  Schild (blockiert)     h  Heilstelle (Zuhause)
     P  Spielerstart
   NPCs & Warps werden separat definiert.
   ========================================================================= */
const MAP = [
  "############################",
  "#TT,,,,TT##......##TT,,,,TT##",
  "#T,,,,,,T#..LLLL..#T,,,,,,T##",
  "#,,hHHh,,...LLLL...,,HHHH,,,#",
  "#,,HDDH,,...LDDL...,,HDDH,,,#",
  "#,,,,,,,,...,,,,...,,,,,,,,,#",
  "#,,,,P,,,...,,,,...,,,B,,,,,#",
  "#,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
  "#T,,,,,,,,,,====,,,,,,,,,,,T#",
  "#TT,,,,,ssss====ssss,,,,,,TT#",
  "#T,,,,sssssssWWssssssss,,,,T#",
  "#,,,ssssWWWsWWWWsWWWssss,,,,#",
  "#,,sssWWWWWWWWWWWWWWWWsss,,,#",
  "#,,ssWWWWWWWWWWWWWWWWWWss,,,#",
  "#,,,ssssWWWWWWWWWWWWssss,,,,#",
  "#T,,,,ssssssWWWWssssss,,,,T##",
  "#TT,,,,,,ssssssssss,,,,,,TT##",
  "#,,,,,,,,,,,,==,,,,,,,,,,,,,#",
  "#,,,B,,,TT,,,==,,,TT,,,,,,,,#",
  "#,,,,,,,TT,,,==,,,TT,,,,B,,,#",
  "#,,,,,,,,,,,,==,,,,,,,,,,,,,#",
  "#..........###CC###.........#",
  "#..........#CCccCC#.........#",
  "#~~~~......#CccccC#......rrrr#",
  "#~~~~~~....#CCccCC#....rrrrrr#",
  "#~~~~~~~...#CC==CC#...rrrrrrr#",
  "#~~~~~~~~..........~..rrrrrrr#",
  "############################"
];

/* NPCs: {x, y, name, lines:[...], face} */
const NPCS = [
  { x: 13, y: 3, name: 'Prof. Kiemann',
    lines: ['Willkommen in der Welt der FISCHMON!', 'Ich bin Prof. Kiemann.',
            'Wähle deinen ersten Fisch und', 'fang sie alle mit dem Netz!'] , starter: true },
  { x: 21, y: 6, name: 'Schild',
    lines: ['ROUTE 1', 'Vorsicht: In den Untiefen', 'lauern wilde Fische.'] },
  { x: 4, y: 18, name: 'Schild',
    lines: ['Zum STRAND im Südwesten.', 'Dort schwimmt Salzwasser-Getier.'] },
  { x: 23, y: 19, name: 'Schild',
    lines: ['RIFF im Südosten &', 'HÖHLE in der Mitte.'] },
  { x: 8, y: 7, name: 'Angler Uwe',
    lines: ['Ein guter Angler kennt jede', 'Kachel mit Untiefe.', 'Lauf hinein und warte ab!'] },
  { x: 19, y: 8, name: 'Angler Uwe',
    lines: ['Elektro-Fische treffen alle', 'Wasser-Fische hart.', 'Aber Panzer-Fische lachen nur.'] }
];

/* Kachel-Klassifikation */
const BLOCKED = new Set(['#', 'T', 'W', 'H', 'L', 'B']);
const ENCOUNTER_TILE = { 's': 'pond', '~': 'sea', 'r': 'reef', 'c': 'deep' };
