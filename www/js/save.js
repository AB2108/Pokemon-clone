/* =========================================================================
   FISCHMON — Speichern / Laden (localStorage)
   ========================================================================= */
const SAVE_KEY = 'fischmon_save_v1';

function saveGame(state) {
  try {
    const data = {
      map: state.map || 'world',
      player: { x: state.player.x, y: state.player.y, dir: state.player.dir },
      party: state.party,
      dex: Array.from(state.dex),
      caught: Array.from(state.caught),
      bag: state.bag,
      flags: state.flags || {},
      starterChosen: state.starterChosen
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (e) { return false; }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    d.dex = new Set(d.dex || []);
    d.caught = new Set(d.caught || []);
    return d;
  } catch (e) { return null; }
}

function hasSave() { return !!localStorage.getItem(SAVE_KEY); }
function clearSave() { localStorage.removeItem(SAVE_KEY); }
