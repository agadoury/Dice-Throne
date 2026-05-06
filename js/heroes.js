/* ============================================================
   Dice Throne — Heroes
   ------------------------------------------------------------
   Each hero has 5 hit points multiplier (default 50), an icon,
   color theme, and a list of abilities. Abilities trigger from
   dice combinations. The combo engine in dice.js maps a roll
   into a set of triggers; abilities pick the first matching
   trigger and the player chooses one of the lit-up cards.
   ============================================================ */

const COMBO = {
  ANY: 'any',
  PAIR: 'pair',
  TWO_PAIR: 'two-pair',
  THREE: 'three',
  STRAIGHT: 'straight',
  FULL_HOUSE: 'full-house',
  FOUR: 'four',
  FIVE: 'five',
  SUM_HIGH: 'sum-high',  // total >= 22
  EVEN_ALL: 'even-all',  // every die even
  ODD_ALL: 'odd-all',    // every die odd
};

const COMBO_LABEL = {
  [COMBO.ANY]: 'Any roll',
  [COMBO.PAIR]: 'Pair',
  [COMBO.TWO_PAIR]: 'Two pair',
  [COMBO.THREE]: '3 of a kind',
  [COMBO.STRAIGHT]: 'Straight',
  [COMBO.FULL_HOUSE]: 'Full house',
  [COMBO.FOUR]: '4 of a kind',
  [COMBO.FIVE]: '5 of a kind',
  [COMBO.SUM_HIGH]: 'Sum 22+',
  [COMBO.EVEN_ALL]: 'All even',
  [COMBO.ODD_ALL]: 'All odd',
};

/* Ability effect definitions. Each ability has:
   - name, combo, desc
   - dmg(roll) -> base damage   (function or number, optional)
   - undefendable (bool)
   - heal (number, optional)
   - status: { target:'self'|'foe', kind, amount, turns }
   - extra effects via apply(player, foe, roll, ctx) callback
*/

const HEROES = [
  {
    id: 'barbarian',
    name: 'Barbarian',
    glyph: '🪓',
    tagline: 'Wrath made flesh.',
    color: '#c0392b',
    style: 'Aggro',
    difficulty: 'Easy',
    hp: 50,
    abilities: [
      { name: 'Battle Cry', combo: COMBO.ANY, desc: 'Charge up. Next attack +2 dmg.',
        apply: (p) => addStatus(p, 'charge', 1, 1) },
      { name: 'Cleave', combo: COMBO.PAIR, dmg: 3, desc: 'A heavy two-handed swing.' },
      { name: 'Rending Blow', combo: COMBO.TWO_PAIR, dmg: 4, desc: 'Tear flesh; foe bleeds 1/turn (2t).',
        apply: (p, f) => addStatus(f, 'poison', 1, 2) },
      { name: 'Whirlwind', combo: COMBO.THREE, dmg: 5, undefendable: true,
        desc: 'Spinning attack. Undefendable.' },
      { name: 'Thunderstrike', combo: COMBO.STRAIGHT, dmg: 6,
        desc: 'A blow like rolling thunder.' },
      { name: 'Crushing Blow', combo: COMBO.FULL_HOUSE, dmg: 7,
        desc: 'Bone-shattering impact.' },
      { name: 'Berserker Rage', combo: COMBO.FOUR, dmg: 8,
        desc: 'Bloodlust empowers next turn (+2 dmg).',
        apply: (p) => addStatus(p, 'charge', 2, 1) },
      { name: 'Final Cleave', combo: COMBO.FIVE, dmg: 14, undefendable: true,
        desc: 'A legendary execution.' },
    ],
  },
  {
    id: 'moon-elf',
    name: 'Moon Elf',
    glyph: '🏹',
    tagline: 'Silent. Swift. Lethal.',
    color: '#4cc9f0',
    style: 'Ranged',
    difficulty: 'Medium',
    hp: 48,
    abilities: [
      { name: 'Moonlit Step', combo: COMBO.ANY, desc: 'Gain Dodge: 50% to evade next hit.',
        apply: (p) => addStatus(p, 'dodge', 1, 1) },
      { name: 'Quick Shot', combo: COMBO.PAIR, dmg: 3, desc: 'A snap arrow.' },
      { name: 'Twin Arrows', combo: COMBO.TWO_PAIR, dmg: 4,
        desc: 'Two arrows fired at once.' },
      { name: 'Volley', combo: COMBO.THREE, dmg: 5, desc: 'Hail of arrows.' },
      { name: 'Moonbeam', combo: COMBO.STRAIGHT, dmg: 6, undefendable: true,
        desc: 'A beam of pure moonlight.' },
      { name: "Hunter's Mark", combo: COMBO.FULL_HOUSE, dmg: 4,
        desc: 'Mark foe: +3 dmg taken next hit.',
        apply: (p, f) => addStatus(f, 'mark', 3, 1) },
      { name: 'Eagle Eye', combo: COMBO.FOUR, dmg: 9, undefendable: true,
        desc: 'A perfect, undefendable shot.' },
      { name: 'Stardust Volley', combo: COMBO.FIVE, dmg: 13, undefendable: true,
        desc: 'A storm of starlit arrows.' },
      { name: 'Sun Arrow', combo: COMBO.ODD_ALL, dmg: 6,
        desc: 'Charged with daylight.' },
    ],
  },
  {
    id: 'pyromancer',
    name: 'Pyromancer',
    glyph: '🔥',
    tagline: 'Embers of a fallen star.',
    color: '#ff6b3d',
    style: 'DoT',
    difficulty: 'Medium',
    hp: 46,
    abilities: [
      { name: 'Spark', combo: COMBO.ANY, dmg: 1, desc: 'A flick of fire. Apply 1 burn.',
        apply: (p, f) => addStatus(f, 'burn', 1, 2) },
      { name: 'Ember', combo: COMBO.PAIR, dmg: 2, desc: 'Apply 1 burn (2t).',
        apply: (p, f) => addStatus(f, 'burn', 1, 2) },
      { name: 'Flame Lash', combo: COMBO.TWO_PAIR, dmg: 4,
        desc: 'A whip of fire. +1 burn.',
        apply: (p, f) => addStatus(f, 'burn', 1, 2) },
      { name: 'Fireball', combo: COMBO.THREE, dmg: 6, desc: 'A roaring blast.' },
      { name: 'Heat Wave', combo: COMBO.STRAIGHT, dmg: 5,
        desc: 'Wave of heat. Burn 2 (2t).',
        apply: (p, f) => addStatus(f, 'burn', 2, 2) },
      { name: 'Combustion', combo: COMBO.FULL_HOUSE, dmg: 6,
        desc: 'Detonate all burns instantly.',
        apply: (p, f, _r, ctx) => {
          const b = (f.statuses.find(s => s.kind === 'burn'));
          if (b) {
            const dmg = b.amount * 2;
            ctx.bonusDamage = (ctx.bonusDamage || 0) + dmg;
            f.statuses = f.statuses.filter(s => s.kind !== 'burn');
          }
        } },
      { name: 'Inferno', combo: COMBO.FOUR, dmg: 8,
        desc: 'Searing flame. Burn 2 (3t).',
        apply: (p, f) => addStatus(f, 'burn', 2, 3) },
      { name: 'Phoenix Rebirth', combo: COMBO.FIVE, dmg: 12,
        desc: 'Massive blast; restore 5 HP.',
        apply: (p) => { p.hp = Math.min(p.hpMax, p.hp + 5); } },
      { name: 'Lava Surge', combo: COMBO.SUM_HIGH, dmg: 4,
        desc: 'Earth bleeds fire (+burn 1).',
        apply: (p, f) => addStatus(f, 'burn', 1, 2) },
    ],
  },
  {
    id: 'shadow-thief',
    name: 'Shadow Thief',
    glyph: '🗡',
    tagline: 'Strike from the dark.',
    color: '#8b5cf6',
    style: 'Combo',
    difficulty: 'Hard',
    hp: 44,
    abilities: [
      { name: 'Shadowstep', combo: COMBO.ANY, desc: 'Dodge + 1 charge.',
        apply: (p) => { addStatus(p, 'dodge', 1, 1); addStatus(p, 'charge', 1, 1); } },
      { name: 'Stab', combo: COMBO.PAIR, dmg: 3, desc: 'A precise jab.' },
      { name: 'Poison Blade', combo: COMBO.TWO_PAIR, dmg: 3,
        desc: 'Apply poison 2 (3t).',
        apply: (p, f) => addStatus(f, 'poison', 2, 3) },
      { name: 'Backstab', combo: COMBO.THREE, dmg: 7, undefendable: true,
        desc: 'Strike from behind. Undefendable.' },
      { name: 'Smoke & Mirrors', combo: COMBO.STRAIGHT, dmg: 4,
        desc: 'Hit and gain Dodge (2t).',
        apply: (p) => addStatus(p, 'dodge', 1, 2) },
      { name: 'Poisoner', combo: COMBO.FULL_HOUSE, dmg: 5,
        desc: 'Stack poison 3 (3t).',
        apply: (p, f) => addStatus(f, 'poison', 3, 3) },
      { name: 'Vanish Strike', combo: COMBO.FOUR, dmg: 8,
        desc: 'Strike + Guard 3.',
        apply: (p) => addStatus(p, 'guard', 3, 1) },
      { name: 'Assassinate', combo: COMBO.FIVE, dmg: 13, undefendable: true,
        desc: 'A killing blow.' },
      { name: 'Twin Daggers', combo: COMBO.EVEN_ALL, dmg: 5,
        desc: 'Two perfect strikes.' },
    ],
  },
  {
    id: 'monk',
    name: 'Monk',
    glyph: '🧘',
    tagline: 'Calm body, raging fist.',
    color: '#fbbf24',
    style: 'Balanced',
    difficulty: 'Medium',
    hp: 50,
    abilities: [
      { name: 'Inner Focus', combo: COMBO.ANY, desc: 'Heal 2 + Guard 1.',
        apply: (p) => { p.hp = Math.min(p.hpMax, p.hp + 2); addStatus(p, 'guard', 1, 1); } },
      { name: 'Jab', combo: COMBO.PAIR, dmg: 3, desc: 'A swift strike.' },
      { name: 'Combo Strike', combo: COMBO.TWO_PAIR, dmg: 5,
        desc: 'Chain two attacks.' },
      { name: 'Spinning Kick', combo: COMBO.THREE, dmg: 5,
        desc: 'Knock foe off balance. +Charge.',
        apply: (p) => addStatus(p, 'charge', 1, 1) },
      { name: 'Flowing Water', combo: COMBO.STRAIGHT, dmg: 3,
        desc: 'Strike + heal 4.',
        apply: (p) => { p.hp = Math.min(p.hpMax, p.hp + 4); } },
      { name: 'Inner Peace', combo: COMBO.FULL_HOUSE, dmg: 0,
        desc: 'Heal 8 + Guard 3.',
        apply: (p) => { p.hp = Math.min(p.hpMax, p.hp + 8); addStatus(p, 'guard', 3, 1); } },
      { name: 'Dragon Punch', combo: COMBO.FOUR, dmg: 9, undefendable: true,
        desc: 'A blow that cleaves stone.' },
      { name: 'Thousand Fists', combo: COMBO.FIVE, dmg: 12,
        desc: 'A flurry beyond sight.' },
      { name: 'Open Palm', combo: COMBO.SUM_HIGH, dmg: 4,
        desc: 'A focused strike.' },
    ],
  },
  {
    id: 'paladin',
    name: 'Paladin',
    glyph: '⚔',
    tagline: 'Righteous and unbroken.',
    color: '#fde047',
    style: 'Tank',
    difficulty: 'Easy',
    hp: 54,
    abilities: [
      { name: 'Lay on Hands', combo: COMBO.ANY, desc: 'Heal 3 HP.',
        apply: (p) => { p.hp = Math.min(p.hpMax, p.hp + 3); } },
      { name: 'Smite', combo: COMBO.PAIR, dmg: 3, desc: 'Holy strike.' },
      { name: 'Shield Bash', combo: COMBO.TWO_PAIR, dmg: 3,
        desc: 'Strike + Guard 2.',
        apply: (p) => addStatus(p, 'guard', 2, 1) },
      { name: 'Consecration', combo: COMBO.THREE, dmg: 4,
        desc: 'Hallowed ground. Heal 3.',
        apply: (p) => { p.hp = Math.min(p.hpMax, p.hp + 3); } },
      { name: 'Hammer of Justice', combo: COMBO.STRAIGHT, dmg: 6,
        desc: 'A blessed blow.' },
      { name: 'Aegis', combo: COMBO.FULL_HOUSE, dmg: 4,
        desc: 'Strike + Guard 4.',
        apply: (p) => addStatus(p, 'guard', 4, 1) },
      { name: 'Holy Wrath', combo: COMBO.FOUR, dmg: 9, undefendable: true,
        desc: 'Divine retribution.' },
      { name: 'Judgement', combo: COMBO.FIVE, dmg: 13,
        desc: 'The verdict is pain.' },
    ],
  },
];

/* Mutate-helper: add or stack a status on a player. */
function addStatus(player, kind, amount, turns) {
  const existing = player.statuses.find(s => s.kind === kind);
  if (existing) {
    existing.amount += amount;
    existing.turns = Math.max(existing.turns, turns);
  } else {
    player.statuses.push({ kind, amount, turns });
  }
}

window.HEROES = HEROES;
window.COMBO = COMBO;
window.COMBO_LABEL = COMBO_LABEL;
window.addStatus = addStatus;
