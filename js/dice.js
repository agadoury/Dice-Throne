/* ============================================================
   Dice Throne — Dice & Combo Engine
   ============================================================ */

const NUM_DICE = 5;
const MAX_ROLLS = 3;

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function newDiceState() {
  return {
    values: Array(NUM_DICE).fill(0),
    locked: Array(NUM_DICE).fill(false),
    rollsLeft: MAX_ROLLS,
    rolledThisTurn: false,
  };
}

function rollDice(state) {
  if (state.rollsLeft <= 0) return state;
  for (let i = 0; i < NUM_DICE; i++) {
    if (!state.locked[i]) {
      state.values[i] = rollDie();
    }
  }
  state.rollsLeft--;
  state.rolledThisTurn = true;
  return state;
}

/* Detect combo set — returns list of triggers present in the roll. */
function detectCombos(values) {
  const triggers = new Set([COMBO.ANY]);
  if (!values.every(v => v > 0)) return triggers;

  const counts = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const countList = Object.values(counts).sort((a, b) => b - a);

  if (countList[0] >= 2) triggers.add(COMBO.PAIR);
  if (countList[0] >= 3) triggers.add(COMBO.THREE);
  if (countList[0] >= 4) triggers.add(COMBO.FOUR);
  if (countList[0] >= 5) triggers.add(COMBO.FIVE);
  if (countList[0] === 3 && countList[1] === 2) triggers.add(COMBO.FULL_HOUSE);
  if (countList[0] >= 2 && countList[1] >= 2) triggers.add(COMBO.TWO_PAIR);

  // Straight: 5 consecutive distinct values
  const uniq = [...new Set(values)].sort((a, b) => a - b);
  if (uniq.length === 5) {
    const isStraight = uniq[4] - uniq[0] === 4;
    if (isStraight) triggers.add(COMBO.STRAIGHT);
  }

  const sum = values.reduce((a, b) => a + b, 0);
  if (sum >= 22) triggers.add(COMBO.SUM_HIGH);

  if (values.every(v => v % 2 === 0)) triggers.add(COMBO.EVEN_ALL);
  if (values.every(v => v % 2 === 1)) triggers.add(COMBO.ODD_ALL);

  return triggers;
}

/* Combo "rank" for AI scoring — bigger = stronger combo. */
const COMBO_RANK = {
  [COMBO.ANY]: 0,
  [COMBO.PAIR]: 1,
  [COMBO.TWO_PAIR]: 2,
  [COMBO.THREE]: 3,
  [COMBO.STRAIGHT]: 4,
  [COMBO.FULL_HOUSE]: 5,
  [COMBO.FOUR]: 6,
  [COMBO.FIVE]: 8,
  [COMBO.SUM_HIGH]: 2,
  [COMBO.EVEN_ALL]: 3,
  [COMBO.ODD_ALL]: 3,
};

/* ---- 3-die defensive combos ---- */
const DEF_COMBO = {
  ANY: 'd-any',
  PAIR: 'd-pair',
  THREE: 'd-three',
  STRAIGHT: 'd-straight',
  HIGH: 'd-high',     // sum >= 12
  ALL_HIGH: 'd-allhigh', // every die >= 4
};

const DEF_COMBO_LABEL = {
  [DEF_COMBO.ANY]: 'Any roll',
  [DEF_COMBO.PAIR]: 'Pair',
  [DEF_COMBO.THREE]: '3 of a kind',
  [DEF_COMBO.STRAIGHT]: 'Straight',
  [DEF_COMBO.HIGH]: 'Sum 12+',
  [DEF_COMBO.ALL_HIGH]: 'All 4+',
};

function detectDefenseCombos(values) {
  const triggers = new Set([DEF_COMBO.ANY]);
  if (!values.every(v => v > 0)) return triggers;
  const counts = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const top = Math.max(...Object.values(counts));
  if (top >= 2) triggers.add(DEF_COMBO.PAIR);
  if (top >= 3) triggers.add(DEF_COMBO.THREE);
  const uniq = [...new Set(values)].sort((a, b) => a - b);
  if (uniq.length === 3 && uniq[2] - uniq[0] === 2) triggers.add(DEF_COMBO.STRAIGHT);
  if (values.reduce((a, b) => a + b, 0) >= 12) triggers.add(DEF_COMBO.HIGH);
  if (values.every(v => v >= 4)) triggers.add(DEF_COMBO.ALL_HIGH);
  return triggers;
}

window.DEF_COMBO = DEF_COMBO;
window.DEF_COMBO_LABEL = DEF_COMBO_LABEL;
window.detectDefenseCombos = detectDefenseCombos;

window.NUM_DICE = NUM_DICE;
window.MAX_ROLLS = MAX_ROLLS;
window.rollDie = rollDie;
window.newDiceState = newDiceState;
window.rollDice = rollDice;
window.detectCombos = detectCombos;
window.COMBO_RANK = COMBO_RANK;
