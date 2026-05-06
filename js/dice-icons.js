/* ============================================================
   Dice Throne — SVG dice-face icons + material themes per hero
   ------------------------------------------------------------
   Each hero has:
     icons: 6 SVG inner-content strings (faces low → high)
     material: gradient/colour set used to render the die surface
   All icons use a 24x24 viewBox. Fills default to currentColor
   so the die's --die-face-fg variable controls the line/silhouette.
   ============================================================ */

const HERO_DICE_ICONS = {

  // ---------- BARBARIAN ----------
  // Battered iron weapons & flesh: flex → strike → cleave → brace → smash → slay
  barbarian: [
    // 1. Flex — bicep arc
    `<path d="M5 19 L 5 14 C 5 9 8 6 12 6 C 16 6 19 9 19 14 L 19 19 Z"/>
     <path d="M9 13 C 10.5 11.5 13.5 11.5 15 13" stroke="rgba(0,0,0,0.45)" stroke-width="1" fill="none" stroke-linecap="round"/>`,
    // 2. Strike — single sword
    `<path d="M11 3 L 13 3 L 13 14 L 16 14 L 16 16 L 13 16 L 13 19 L 12 21 L 11 19 L 11 16 L 8 16 L 8 14 L 11 14 Z"/>`,
    // 3. Cleave — one-handed axe
    `<rect x="11" y="3" width="2" height="18" rx="0.6"/>
     <path d="M13 5 L 20 7 L 21 11 L 20 15 L 13 17 Z"/>`,
    // 4. Brace — kite shield with a chevron
    `<path d="M12 3 L 20 5 L 20 12 C 20 16.5 17 19.5 12 21 C 7 19.5 4 16.5 4 12 L 4 5 Z"/>
     <path d="M8 9 L 12 13 L 16 9 M 8 14 L 16 14" stroke="rgba(0,0,0,0.45)" stroke-width="1" fill="none" stroke-linecap="round"/>`,
    // 5. Smash — warhammer
    `<rect x="11" y="9" width="2" height="13" rx="0.6"/>
     <rect x="4" y="3" width="16" height="9" rx="1.4"/>
     <rect x="6" y="5" width="12" height="5" rx="0.8" fill="rgba(0,0,0,0.3)"/>`,
    // 6. Slay — skull
    `<path d="M12 3 C 7 3 4 6.5 4 11 C 4 13.5 5 15.5 7 17 L 7 20 L 10 20 L 10 18 L 14 18 L 14 20 L 17 20 L 17 17 C 19 15.5 20 13.5 20 11 C 20 6.5 17 3 12 3 Z"/>
     <ellipse cx="9" cy="11" rx="1.6" ry="1.8" fill="rgba(0,0,0,0.65)"/>
     <ellipse cx="15" cy="11" rx="1.6" ry="1.8" fill="rgba(0,0,0,0.65)"/>
     <rect x="11" y="13.5" width="2" height="3" rx="0.4" fill="rgba(0,0,0,0.65)"/>`,
  ],

  // ---------- MOON ELF ----------
  // Moonstone & celestial: leaf → bow → star → moon → frost → sun
  'moon-elf': [
    // 1. Leaf
    `<path d="M5 19 C 5 10 11 4 19 4 C 19 12 13 19 5 19 Z"/>
     <path d="M6 18 L 17 6" stroke="rgba(0,0,0,0.4)" stroke-width="0.8" fill="none" stroke-linecap="round"/>`,
    // 2. Bow with arrow
    `<path d="M5 4 C 12 6 12 18 5 20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
     <line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" stroke-width="0.8"/>
     <line x1="5" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
     <polygon points="20,12 17,10.5 17,13.5"/>`,
    // 3. Star — 8-point
    `<polygon points="12,2 13.5,9.5 21,11 13.5,12.5 12,20 10.5,12.5 3,11 10.5,9.5"/>
     <polygon points="12,5 13,11 18,12 13,13 12,19 11,13 6,12 11,11" fill="rgba(255,255,255,0.5)"/>`,
    // 4. Moon — crescent
    `<path d="M16 3 A 9 9 0 1 0 16 21 A 6.6 6.6 0 1 1 16 3 Z"/>`,
    // 5. Frost — snowflake
    `<g stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none">
       <line x1="12" y1="3" x2="12" y2="21"/>
       <line x1="3" y1="12" x2="21" y2="12"/>
       <line x1="6" y1="6" x2="18" y2="18"/>
       <line x1="18" y1="6" x2="6" y2="18"/>
       <line x1="12" y1="5" x2="10" y2="7"/><line x1="12" y1="5" x2="14" y2="7"/>
       <line x1="12" y1="19" x2="10" y2="17"/><line x1="12" y1="19" x2="14" y2="17"/>
       <line x1="5" y1="12" x2="7" y2="10"/><line x1="5" y1="12" x2="7" y2="14"/>
       <line x1="19" y1="12" x2="17" y2="10"/><line x1="19" y1="12" x2="17" y2="14"/>
     </g>`,
    // 6. Sun
    `<circle cx="12" cy="12" r="4.6"/>
     <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
       <line x1="12" y1="1.5" x2="12" y2="4.5"/>
       <line x1="12" y1="19.5" x2="12" y2="22.5"/>
       <line x1="1.5" y1="12" x2="4.5" y2="12"/>
       <line x1="19.5" y1="12" x2="22.5" y2="12"/>
       <line x1="4.4" y1="4.4" x2="6.5" y2="6.5"/>
       <line x1="17.5" y1="17.5" x2="19.6" y2="19.6"/>
       <line x1="19.6" y1="4.4" x2="17.5" y2="6.5"/>
       <line x1="4.4" y1="19.6" x2="6.5" y2="17.5"/>
     </g>`,
  ],

  // ---------- PYROMANCER ----------
  // Embers escalating to inferno: spark → flame → burst → comet → volcano → dragon
  pyromancer: [
    // 1. Spark
    `<circle cx="12" cy="12" r="2.4"/>
     <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
       <line x1="12" y1="3" x2="12" y2="6.5"/>
       <line x1="12" y1="17.5" x2="12" y2="21"/>
       <line x1="3" y1="12" x2="6.5" y2="12"/>
       <line x1="17.5" y1="12" x2="21" y2="12"/>
       <line x1="5" y1="5" x2="7.5" y2="7.5"/>
       <line x1="16.5" y1="16.5" x2="19" y2="19"/>
       <line x1="19" y1="5" x2="16.5" y2="7.5"/>
       <line x1="5" y1="19" x2="7.5" y2="16.5"/>
     </g>`,
    // 2. Flame — single tear
    `<path d="M12 3 C 8 8 7 11 8 14.5 C 9 18.5 11 20.5 12 21 C 13 20.5 15 18.5 16 14.5 C 17 11 16 8 12 3 Z"/>
     <path d="M12 9 C 11 12 11 14 12 16 C 13 14 13 12 12 9 Z" fill="rgba(255,255,255,0.55)"/>`,
    // 3. Burst — explosion
    `<polygon points="12,2 14,9 21,7 16.5,12 21,17 14,15 12,22 10,15 3,17 7.5,12 3,7 10,9"/>`,
    // 4. Comet — flame with tail
    `<path d="M3.5 20.5 L 14 12 C 16 10 19 8 21 6.5 C 20 9 18 12 16 14 L 8 20.5 Z"/>
     <circle cx="5" cy="19" r="2.2"/>`,
    // 5. Volcano with smoke
    `<path d="M3 21 L 9 6 L 12 10 L 15 6 L 21 21 Z"/>
     <circle cx="11" cy="3.5" r="1.4" opacity="0.55"/>
     <circle cx="14.5" cy="2" r="1" opacity="0.4"/>`,
    // 6. Dragon — stylized head
    `<path d="M2.5 12 C 5 9 8.5 7 12 7 C 16 7 19.5 8 21.5 12 C 19.5 14 17.5 14 16 13 C 15 14 13.5 14 12 14 C 10.5 14 9 13 8 13 C 6.5 14 4.5 14 2.5 12 Z"/>
     <circle cx="17" cy="11" r="0.9" fill="rgba(0,0,0,0.6)"/>
     <path d="M3 12 L 6.5 14 L 5 16.5" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>
     <path d="M19 7 L 18 4 L 16 6" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
  ],

  // ---------- SHADOW THIEF ----------
  // Smoky obsidian: mist → eye → dagger → shadow → poison → death
  'shadow-thief': [
    // 1. Mist — three wavy lines
    `<g stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none">
       <path d="M3 7 Q 7 4 12 7 Q 17 10 21 7"/>
       <path d="M3 12 Q 7 9 12 12 Q 17 15 21 12"/>
       <path d="M3 17 Q 7 14 12 17 Q 17 20 21 17"/>
     </g>`,
    // 2. Eye
    `<path d="M2 12 C 5 7 8 5 12 5 C 16 5 19 7 22 12 C 19 17 16 19 12 19 C 8 19 5 17 2 12 Z"/>
     <circle cx="12" cy="12" r="3.6" fill="rgba(0,0,0,0.65)"/>
     <circle cx="13.2" cy="11" r="1" fill="rgba(255,255,255,0.7)"/>`,
    // 3. Dagger
    `<path d="M11 3 L 13 3 L 13 13 L 15 14.5 L 14 16 L 13 15 L 13 19 L 12 21 L 11 19 L 11 15 L 10 16 L 9 14.5 L 11 13 Z"/>`,
    // 4. Shadow — cloaked figure
    `<path d="M12 3 C 8 3 6 6 6 9.5 C 6 12 7.5 14 9 14 L 9 21 L 15 21 L 15 14 C 16.5 14 18 12 18 9.5 C 18 6 16 3 12 3 Z"/>
     <ellipse cx="12" cy="9" rx="2" ry="2.5" fill="rgba(0,0,0,0.6)"/>`,
    // 5. Poison — vial
    `<path d="M9.5 3 L 14.5 3 L 14.5 7 L 17 12 C 18 14.5 17 18 14 19.5 C 11.5 20.5 8.5 20 6.5 18 C 5 16 6 13.5 7.5 11 L 9.5 7 Z"/>
     <circle cx="11" cy="14" r="0.8" fill="rgba(0,0,0,0.6)"/>
     <circle cx="13" cy="15.5" r="0.7" fill="rgba(0,0,0,0.6)"/>`,
    // 6. Death — hooded skull
    `<path d="M12 2 C 6 2 3 6 3 12 C 3 17 6 22 6 22 L 18 22 C 18 22 21 17 21 12 C 21 6 18 2 12 2 Z"/>
     <ellipse cx="9.2" cy="12" rx="1.6" ry="1.7" fill="rgba(0,0,0,0.7)"/>
     <ellipse cx="14.8" cy="12" rx="1.6" ry="1.7" fill="rgba(0,0,0,0.7)"/>
     <rect x="11" y="14.5" width="2" height="3" rx="0.4" fill="rgba(0,0,0,0.7)"/>`,
  ],

  // ---------- MONK ----------
  // Jade & chi: calm → fist → kick → spiral → ki → dharma
  monk: [
    // 1. Calm — yin/yang
    `<circle cx="12" cy="12" r="9"/>
     <path d="M12 3 A 4.5 4.5 0 0 1 12 12 A 4.5 4.5 0 0 0 12 21 A 9 9 0 0 1 12 3 Z" fill="rgba(255,255,255,0.85)"/>
     <circle cx="12" cy="7.5" r="1.2" fill="rgba(255,255,255,0.85)"/>
     <circle cx="12" cy="16.5" r="1.2"/>`,
    // 2. Fist
    `<rect x="6" y="9" width="12" height="9" rx="2"/>
     <rect x="6" y="6" width="3" height="6" rx="1"/>
     <rect x="9" y="5" width="3" height="7" rx="1"/>
     <rect x="12" y="5" width="3" height="7" rx="1"/>
     <rect x="15" y="6" width="3" height="6" rx="1"/>`,
    // 3. Kick
    `<path d="M3 18 L 8 14 L 13 16 L 17 12 L 21 13 L 21 18 Z"/>
     <path d="M16 11 L 21 12 L 19 9 Z"/>
     <line x1="3" y1="20" x2="21" y2="20" stroke="currentColor" stroke-width="0.8" opacity="0.5"/>`,
    // 4. Spiral
    `<path d="M12 4 A 8 8 0 1 1 4 12 A 6 6 0 1 1 12 6 A 4 4 0 1 1 8 12 A 2 2 0 1 1 12 11" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>
     <circle cx="12" cy="11" r="0.8"/>`,
    // 5. Ki — lightning
    `<path d="M14 3 L 6 14 L 11 14 L 9 21 L 18 9 L 13 9 Z"/>`,
    // 6. Dharma wheel
    `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none"/>
     <circle cx="12" cy="12" r="1.8"/>
     <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
       <line x1="12" y1="3.5" x2="12" y2="20.5"/>
       <line x1="3.5" y1="12" x2="20.5" y2="12"/>
       <line x1="6" y1="6" x2="18" y2="18"/>
       <line x1="18" y1="6" x2="6" y2="18"/>
     </g>`,
  ],

  // ---------- PALADIN ----------
  // Gold-leaf & holy: crest → aegis → sword → star → dawn → cross
  paladin: [
    // 1. Crest
    `<path d="M12 3 L 19 5 L 19 11 C 19 15.5 16 19 12 21 C 8 19 5 15.5 5 11 L 5 5 Z"/>
     <path d="M9 8 L 12 12 L 15 8 M 9 14 L 15 14" stroke="rgba(0,0,0,0.4)" stroke-width="1" fill="none" stroke-linecap="round"/>`,
    // 2. Aegis — tower shield
    `<rect x="7" y="3" width="10" height="18" rx="2"/>
     <line x1="9" y1="6" x2="15" y2="6" stroke="rgba(0,0,0,0.4)" stroke-width="1"/>
     <line x1="9" y1="12" x2="15" y2="12" stroke="rgba(0,0,0,0.4)" stroke-width="1"/>
     <line x1="9" y1="18" x2="15" y2="18" stroke="rgba(0,0,0,0.4)" stroke-width="1"/>`,
    // 3. Sword — cross-hilt
    `<rect x="11" y="3" width="2" height="18" rx="0.6"/>
     <rect x="6" y="6" width="12" height="2" rx="1"/>
     <circle cx="12" cy="20" r="1.6"/>`,
    // 4. Star — 4-point
    `<polygon points="12,2 13,11 22,12 13,13 12,22 11,13 2,12 11,11"/>
     <circle cx="12" cy="12" r="1.4" fill="rgba(255,255,255,0.85)"/>`,
    // 5. Dawn — rising sun
    `<line x1="2.5" y1="18" x2="21.5" y2="18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
     <path d="M5 18 A 7 7 0 0 1 19 18 Z"/>
     <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
       <line x1="12" y1="3.5" x2="12" y2="6"/>
       <line x1="5" y1="9" x2="6.8" y2="11"/>
       <line x1="19" y1="9" x2="17.2" y2="11"/>
     </g>`,
    // 6. Cross with halo
    `<rect x="11" y="3" width="2" height="18" rx="0.4"/>
     <rect x="6" y="9" width="12" height="2" rx="0.4"/>
     <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="0.8" fill="none" opacity="0.4"/>`,
  ],
};

/* ============================================================
   Material themes — per-hero die surface + glow.
   Each theme:
     bg        : die background (gradient)
     fg        : icon colour
     edge      : inner border tint
     shine     : highlight stripe colour
     glow      : drop-shadow tint when active
   ============================================================ */
const HERO_DICE_MATERIAL = {
  // Battered iron with rust-blood accents
  'barbarian': {
    bg:    'radial-gradient(circle at 30% 22%, #d8d3cc 0%, #6e6358 55%, #312820 100%)',
    fg:    '#2a1208',
    edge:  '#4a3024',
    shine: '#f5e8d8',
    glow:  'rgba(192,57,43,0.55)',
  },
  // Moonstone — silver-blue
  'moon-elf': {
    bg:    'radial-gradient(circle at 30% 22%, #ffffff 0%, #cfdde8 55%, #6f8aa3 100%)',
    fg:    '#1e3a52',
    edge:  '#7e94a8',
    shine: '#eaf5ff',
    glow:  'rgba(76,201,240,0.55)',
  },
  // Obsidian + magma — black with molten orange
  'pyromancer': {
    bg:    'radial-gradient(circle at 30% 22%, #6a2a08 0%, #2a0e02 55%, #100502 100%)',
    fg:    '#ffae2b',
    edge:  '#7a3408',
    shine: '#ffcc70',
    glow:  'rgba(255,140,40,0.7)',
  },
  // Smoky obsidian — purple-black
  'shadow-thief': {
    bg:    'radial-gradient(circle at 30% 22%, #5a3a72 0%, #21102e 55%, #0a0414 100%)',
    fg:    '#e6d4ff',
    edge:  '#3a2548',
    shine: '#aa88d6',
    glow:  'rgba(139,92,246,0.65)',
  },
  // Carved jade
  'monk': {
    bg:    'radial-gradient(circle at 30% 22%, #c8efd0 0%, #4a8a68 55%, #1a3a28 100%)',
    fg:    '#0e2818',
    edge:  '#1a4530',
    shine: '#daffe6',
    glow:  'rgba(74,222,128,0.55)',
  },
  // Hammered gold leaf
  'paladin': {
    bg:    'radial-gradient(circle at 30% 22%, #fff5c0 0%, #e0a020 65%, #8a5a08 100%)',
    fg:    '#3f2904',
    edge:  '#a06a00',
    shine: '#fff8d0',
    glow:  'rgba(253,224,71,0.7)',
  },
};

// Returns inline SVG markup for a hero face (1..6).
function diceFaceSVG(heroId, value) {
  const set = HERO_DICE_ICONS[heroId];
  if (!set || value < 1 || value > 6) {
    return `<svg viewBox="0 0 24 24"><text x="12" y="16" text-anchor="middle" font-size="14" font-weight="900" fill="currentColor">${value || '?'}</text></svg>`;
  }
  return `<svg viewBox="0 0 24 24" fill="currentColor">${set[value - 1]}</svg>`;
}

// Apply hero material variables to a die element.
function applyDieMaterial(el, hero) {
  if (!el || !hero) return;
  const m = HERO_DICE_MATERIAL[hero.id];
  if (!m) return;
  el.style.setProperty('--die-face-bg', m.bg);
  el.style.setProperty('--die-face-fg', m.fg);
  el.style.setProperty('--die-face-edge', m.edge);
  el.style.setProperty('--die-face-shine', m.shine);
  el.style.setProperty('--die-face-glow', m.glow);
}

window.HERO_DICE_ICONS = HERO_DICE_ICONS;
window.HERO_DICE_MATERIAL = HERO_DICE_MATERIAL;
window.diceFaceSVG = diceFaceSVG;
window.applyDieMaterial = applyDieMaterial;
