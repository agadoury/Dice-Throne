/* ============================================================
   Dice Throne — Cards
   ------------------------------------------------------------
   Each player has a deck built from shared action cards + their
   hero's upgrade and signature cards. Cards have one of three
   types:
     action  : immediate effect when played (one-shot, discarded)
     upgrade : permanently boost a hero ability (sits on hero board)
     boost   : applies a charge / status that empowers the player's
               next ability use (one-shot, discarded)
   ============================================================ */

/* ---------- Shared cards (every hero gets these in their deck) ---------- */
const SHARED_CARDS = [
  { id: 'quick-draw', name: 'Quick Draw', type: 'action', cost: 0,
    icon: '✦',
    desc: 'Draw 2 cards.',
    apply: (self, foe, ctx) => { ctx.drawExtra = 2; } },

  { id: 'surge', name: 'Surge', type: 'action', cost: 0,
    icon: '◆',
    desc: 'Gain ◆2 (free).',
    apply: (self) => { self.cp = Math.min(self.cpMax, self.cp + 2); } },

  { id: 'battle-cry', name: 'Battle Cry', type: 'boost', cost: 1,
    icon: '⚡',
    desc: 'Your next attack deals +2 damage.',
    apply: (self) => addStatus(self, 'charge', 2, 1) },

  { id: 'bandage', name: 'Bandage', type: 'action', cost: 1,
    icon: '✚',
    desc: 'Heal 4 HP.',
    apply: (self) => { self.hp = Math.min(self.hpMax, self.hp + 4); } },

  { id: 'shield-up', name: 'Shield Up', type: 'action', cost: 2,
    icon: '🛡',
    desc: 'Gain Shield 4 (blocks 4 damage).',
    apply: (self) => addStatus(self, 'shield', 4, 99) },

  { id: 'disrupt', name: 'Disrupt', type: 'action', cost: 2,
    icon: '✗',
    desc: 'Remove all status effects from foe.',
    apply: (self, foe) => { foe.statuses = []; } },

  { id: 'sap', name: 'Sap', type: 'action', cost: 2,
    icon: '⊖',
    desc: 'Foe loses ◆3.',
    apply: (self, foe) => { foe.cp = Math.max(0, foe.cp - 3); } },

  { id: 'lucky-roll', name: 'Lucky Roll', type: 'boost', cost: 1,
    icon: '🎲',
    desc: 'Gain Charge 1 — your next hit gets +1.',
    apply: (self) => addStatus(self, 'charge', 1, 1) },
];

/* ---------- Hero-specific cards ---------- */
const HERO_CARDS = {

  barbarian: [
    // Upgrade — pumps the basic Cleave into Mighty Cleave permanently
    { id: 'b-up-cleave', name: 'Mighty Cleave', type: 'upgrade', cost: 2,
      icon: '⬆', upgrades: 'Cleave',
      desc: 'Upgrade Cleave: +2 damage, permanent.' },
    // Signature damage card
    { id: 'b-rampage', name: 'Rampage', type: 'action', cost: 4,
      icon: '💢',
      desc: 'Deal 5 damage (undefendable).',
      apply: (self, foe, ctx) => { ctx.directDamage = 5; ctx.undefendable = true; } },
    // Bleed bomb
    { id: 'b-bloodthirst', name: 'Bloodthirst', type: 'action', cost: 2,
      icon: '🩸',
      desc: 'Foe takes Bleed 2 (3 turns).',
      apply: (self, foe) => addStatus(foe, 'bleed', 2, 3) },
  ],

  'moon-elf': [
    { id: 'me-up-volley', name: 'Sharp Volley', type: 'upgrade', cost: 2,
      icon: '⬆', upgrades: 'Volley',
      desc: 'Upgrade Volley: +2 damage, permanent.' },
    { id: 'me-snipe', name: 'Snipe', type: 'action', cost: 3,
      icon: '🏹',
      desc: 'Deal 4 damage (undefendable).',
      apply: (self, foe, ctx) => { ctx.directDamage = 4; ctx.undefendable = true; } },
    { id: 'me-evasion', name: 'Evasion', type: 'action', cost: 2,
      icon: '💨',
      desc: 'Gain Evasive — fully dodge the next attack.',
      apply: (self) => addStatus(self, 'evasive', 1, 99) },
  ],

  pyromancer: [
    { id: 'p-up-fireball', name: 'Bigger Fireball', type: 'upgrade', cost: 2,
      icon: '⬆', upgrades: 'Fireball',
      desc: 'Upgrade Fireball: +2 damage, permanent.' },
    { id: 'p-firestorm', name: 'Firestorm', type: 'action', cost: 3,
      icon: '🔥',
      desc: 'Foe takes Burn 3 (3 turns).',
      apply: (self, foe) => addStatus(foe, 'burn', 3, 3) },
    { id: 'p-immolate', name: 'Immolate', type: 'action', cost: 4,
      icon: '☄',
      desc: 'Detonate burns: deal 2× burn amount, undefendable.',
      apply: (self, foe, ctx) => {
        const b = foe.statuses.find(s => s.kind === 'burn');
        if (b) {
          ctx.directDamage = b.amount * 2;
          ctx.undefendable = true;
          foe.statuses = foe.statuses.filter(s => s.kind !== 'burn');
        }
      } },
  ],

  'shadow-thief': [
    { id: 'st-up-backstab', name: 'Cruel Backstab', type: 'upgrade', cost: 2,
      icon: '⬆', upgrades: 'Backstab',
      desc: 'Upgrade Backstab: +2 damage, permanent.' },
    { id: 'st-toxic', name: 'Toxic Blade', type: 'action', cost: 2,
      icon: '☠',
      desc: 'Foe takes Poison 3 (3 turns).',
      apply: (self, foe) => addStatus(foe, 'poison', 3, 3) },
    { id: 'st-vanish', name: 'Smoke Bomb', type: 'action', cost: 2,
      icon: '🌫',
      desc: 'Gain Evasive — fully dodge the next attack.',
      apply: (self) => addStatus(self, 'evasive', 1, 99) },
  ],

  monk: [
    { id: 'm-up-spinkick', name: 'Crescent Kick', type: 'upgrade', cost: 2,
      icon: '⬆', upgrades: 'Spinning Kick',
      desc: 'Upgrade Spinning Kick: +2 damage, permanent.' },
    { id: 'm-meditate', name: 'Meditate', type: 'action', cost: 2,
      icon: '☯',
      desc: 'Heal 6 HP.',
      apply: (self) => { self.hp = Math.min(self.hpMax, self.hp + 6); } },
    { id: 'm-pressure', name: 'Pressure Point', type: 'action', cost: 3,
      icon: '👊',
      desc: 'Stun foe — they skip their next offense roll.',
      apply: (self, foe) => addStatus(foe, 'stun', 1, 1) },
  ],

  paladin: [
    { id: 'pa-up-smite', name: 'Holy Smite', type: 'upgrade', cost: 2,
      icon: '⬆', upgrades: 'Smite',
      desc: 'Upgrade Smite: +2 damage, permanent.' },
    { id: 'pa-divine-shield', name: 'Divine Shield', type: 'action', cost: 2,
      icon: '🛡',
      desc: 'Gain Shield 6 — blocks up to 6 damage.',
      apply: (self) => addStatus(self, 'shield', 6, 99) },
    { id: 'pa-divine-strike', name: 'Divine Strike', type: 'action', cost: 4,
      icon: '⚔',
      desc: 'Deal 6 damage (undefendable).',
      apply: (self, foe, ctx) => { ctx.directDamage = 6; ctx.undefendable = true; } },
  ],
};

/* ---------- Deck construction ---------- */

function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build a deck of ~14-16 cards from shared + hero-specific cards.
// Each shared card is included once; hero cards are included once each
// plus the upgrade card duplicated to give it a higher draw rate.
function buildDeck(heroId) {
  const heroCards = HERO_CARDS[heroId] || [];
  const upgrades = heroCards.filter(c => c.type === 'upgrade');
  const cards = [
    ...SHARED_CARDS,
    ...heroCards,
    // duplicate upgrade cards once so they reliably surface
    ...upgrades,
    // pad with a couple extra shared cards so the deck is meaty
    SHARED_CARDS[0], SHARED_CARDS[1], SHARED_CARDS[3], SHARED_CARDS[7],
  ];
  return shuffleArr(cards);
}

// Lookup a card by id (used after JSON-style state restoration if needed).
function findCard(cardId) {
  for (const c of SHARED_CARDS) if (c.id === cardId) return c;
  for (const heroId of Object.keys(HERO_CARDS)) {
    for (const c of HERO_CARDS[heroId]) if (c.id === cardId) return c;
  }
  return null;
}

window.SHARED_CARDS = SHARED_CARDS;
window.HERO_CARDS = HERO_CARDS;
window.buildDeck = buildDeck;
window.findCard = findCard;
window.shuffleArr = shuffleArr;
