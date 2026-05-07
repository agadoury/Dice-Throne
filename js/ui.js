/* ============================================================
   Dice Throne — UI helpers
   ============================================================ */

const UI = (function () {

  function $(sel, root = document) { return root.querySelector(sel); }
  function $$(sel, root = document) { return [...root.querySelectorAll(sel)]; }

  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    $('#' + id).classList.add('active');
    GameAudio.resume();
  }

  function toast(msg, ms = 1800) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), ms);
  }

  /* ---- Dice rendering ---- */

  // Render a die face for a hero. Uses the hero's SVG icon set; falls back to
  // emoji glyphs / numeric values if the icon module isn't loaded.
  function renderDie(value, hero) {
    if (value <= 0) return '<span class="die-empty">·</span>';
    if (window.diceFaceSVG && hero?.id) {
      const name = hero?.diceFaceNames ? hero.diceFaceNames[value - 1] : '';
      return `<div class="die-face" data-value="${value}" title="${name}">${diceFaceSVG(hero.id, value)}</div>`;
    }
    const symbol = hero?.diceFaces ? hero.diceFaces[value - 1] : value;
    return `<div class="die-face" data-value="${value}">${symbol}</div>`;
  }

  function renderDiceTray(state, { canLock, onClick, hero }) {
    const tray = $('#dice-tray');
    tray.innerHTML = '';
    state.values.forEach((v, i) => {
      const el = document.createElement('div');
      el.className = 'die';
      if (window.applyDieMaterial) applyDieMaterial(el, hero);
      if (hero?.color) el.style.setProperty('--die-tint', hero.color);
      if (v === 0) el.classList.add('empty');
      if (state.locked[i]) el.classList.add('locked');
      el.innerHTML = renderDie(v, hero);
      el.dataset.idx = i;
      if (canLock && v > 0) {
        el.addEventListener('click', () => onClick && onClick(i));
      }
      tray.appendChild(el);
    });
  }

  function animateDiceRoll(state) {
    const tray = $('#dice-tray');
    const dice = tray.querySelectorAll('.die');
    dice.forEach((d, i) => {
      if (state.locked[i]) return;
      d.classList.remove('rolling');
      void d.offsetWidth;
      // Random per-die delay and final tilt for organic feel
      const delay = (Math.random() * 0.18).toFixed(2);
      const finalAngle = 720 + (Math.random() * 30 - 15);
      d.style.setProperty('--die-delay', delay + 's');
      d.style.setProperty('--die-final', finalAngle + 'deg');
      d.classList.add('rolling');
    });
  }

  function animateLockPulse(idx) {
    const die = $('#dice-tray').querySelector(`[data-idx="${idx}"]`);
    if (!die) return;
    die.classList.remove('just-locked');
    void die.offsetWidth;
    die.classList.add('just-locked');
    setTimeout(() => die.classList.remove('just-locked'), 420);
  }

  /* ---- Player bar updates ---- */

  // Track previous HP per player so we can animate damage chunks.
  const prevHp = { p1: null, p2: null };

  function updatePlayerBar(playerKey, player) {
    const prefix = '#' + playerKey;
    $(prefix + '-name').textContent = player.name;
    $(prefix + '-portrait').textContent = player.hero.glyph;
    const avatar = $('#bar-' + playerKey + ' .avatar');
    if (avatar) avatar.style.setProperty('--hero-color', player.hero.color);
    const displayHp = Math.max(0, player.hp);
    $(prefix + '-hp').textContent = displayHp;
    $(prefix + '-max').textContent = player.hpMax;

    const pct = Math.max(0, player.hp / player.hpMax * 100);
    const fill = $(prefix + '-hp-fill');
    const loss = $(prefix + '-hp-loss');
    const previous = prevHp[playerKey];
    const previousPct = previous == null ? pct : Math.max(0, previous / player.hpMax * 100);

    if (loss) {
      if (pct < previousPct) {
        // Damage: snap loss bar to old width, then drain to new width
        loss.style.transition = 'none';
        loss.style.width = previousPct + '%';
        void loss.offsetWidth;
        loss.style.transition = '';
        loss.style.width = pct + '%';
      } else if (pct > previousPct) {
        // Heal: ride loss bar with fill, with a gain pulse on fill
        loss.style.transition = 'none';
        loss.style.width = pct + '%';
        fill.classList.remove('gain');
        void fill.offsetWidth;
        fill.classList.add('gain');
      } else {
        loss.style.width = pct + '%';
      }
    }
    fill.style.width = pct + '%';
    fill.classList.toggle('low', pct < 30);
    fill.classList.toggle('mid', pct >= 30 && pct < 60);

    prevHp[playerKey] = player.hp;

    setGuardBadge(playerKey, player.statuses.some(s => s.kind === 'guard' && s.amount > 0));

    // CP chip
    const cpEl = $(prefix + '-cp');
    if (cpEl) cpEl.textContent = player.cp;
    const cpMaxEl = $(prefix + '-cpmax');
    if (cpMaxEl) cpMaxEl.textContent = player.cpMax;
    const cpChip = $(prefix + '-cp-chip');
    if (cpChip) cpChip.classList.toggle('maxed', player.cp >= player.cpMax);

    const status = $(prefix + '-status');
    status.innerHTML = '';
    player.statuses.forEach(s => {
      const pip = document.createElement('span');
      pip.className = 'status-pip ' + s.kind;
      const icon = STATUS_ICON[s.kind] || '?';
      const amt = s.amount > 1 ? `<span class="pip-amt">${s.amount}</span>` : '';
      pip.innerHTML =
        `<span class="pip-icon">${icon}</span>${amt}<span class="pip-turns">${s.turns}t</span>`;
      status.appendChild(pip);
    });
  }

  function resetHpTracking() { prevHp.p1 = null; prevHp.p2 = null; }

  const STATUS_ICON = {
    burn: '🔥',
    poison: '☠',
    guard: '🛡',
    charge: '⚡',
    dodge: '💨',
    mark: '🎯',
  };

  function setActiveTurn(playerKey) {
    $('#bar-p1').classList.toggle('active-turn', playerKey === 'p1');
    $('#bar-p2').classList.toggle('active-turn', playerKey === 'p2');
  }

  /* ---- Abilities list ---- */

  function renderAbilities(hero, triggers, onUse, isHumanTurn) {
    const root = $('#abilities');
    root.innerHTML = '';
    hero.abilities.forEach((a, idx) => {
      const btn = document.createElement('button');
      const can = triggers.has(a.combo) && isHumanTurn;
      btn.className = 'ability' + (can ? ' available' : '');
      btn.disabled = !can;
      const dmgBadge = a.dmg ? `<span class="dmg">${a.dmg}</span>` : '';
      const undefBadge = a.undefendable ? `<span class="undef">PIERCE</span>` : '';
      btn.innerHTML = `
        <div class="name"><span>${a.name}${undefBadge}</span>${dmgBadge}</div>
        <span class="combo">${COMBO_LABEL[a.combo]}</span>
        <div class="desc">${a.desc}</div>
      `;
      btn.addEventListener('click', () => { if (can) onUse(idx); });
      root.appendChild(btn);
    });
  }

  /* ---- Combat log ----
     Newest message gets the `is-newest` class for visual emphasis; older
     siblings are demoted to `older` / `oldest` for a soft fade. Lines stay
     pinned until pushed off the cap (no time-based fade-out). */

  const LOG_MAX = 7;

  function log(msg, kind = '') {
    const l = $('#combat-log');

    // Demote whatever was newest before
    const prevNewest = l.querySelector('.log-line.is-newest');
    if (prevNewest) prevNewest.classList.remove('is-newest');

    const line = document.createElement('div');
    line.className = 'log-line is-newest ' + kind;
    line.innerHTML = msg;
    l.prepend(line);

    // Apply age classes to siblings (skip the newest, which is index 0)
    const lines = [...l.children];
    for (let i = 1; i < lines.length; i++) {
      lines[i].classList.remove('older', 'oldest');
      if (i <= 2) lines[i].classList.add('older');
      else lines[i].classList.add('oldest');
    }

    while (l.children.length > LOG_MAX) l.removeChild(l.lastChild);
  }

  /* ---- Floating combat numbers ---- */

  function floatNumber(targetKey, text, kind = 'dmg') {
    const root = $('#floating-fx');
    const target = $('#' + targetKey + '-portrait');
    if (!target) return;
    const targetRect = target.getBoundingClientRect();
    const arenaRect = $('.arena').getBoundingClientRect();
    const x = targetRect.left + targetRect.width / 2 - arenaRect.left;
    // Anchor at the closer edge of the arena to the target so numbers float into the arena
    const isOpponent = targetKey === 'p2';
    const y = isOpponent ? 12 : arenaRect.height - 24;
    const el = document.createElement('div');
    el.className = 'float-num ' + kind;
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.setProperty('--drift', (Math.random() * 40 - 20).toFixed(0) + 'px');
    root.appendChild(el);
    setTimeout(() => el.remove(), 1700);
  }

  function flashHit(playerKey) {
    const bar = $('#bar-' + playerKey);
    bar.classList.remove('hit-flash');
    void bar.offsetWidth;
    bar.classList.add('hit-flash');
  }

  function animateAttack(attackerKey, defenderKey) {
    const a = $('#' + attackerKey + '-portrait');
    if (!a) return;
    const dir = attackerKey === 'p1' ? 'right' : 'left';
    a.classList.remove('attacking-right', 'attacking-left');
    void a.offsetWidth;
    a.classList.add('attacking-' + dir);
    setTimeout(() => a.classList.remove('attacking-' + dir), 600);
  }

  function animateRecoil(defenderKey) {
    const d = $('#' + defenderKey + '-portrait');
    if (!d) return;
    const dir = defenderKey === 'p1' ? 'left' : 'right';
    d.classList.remove('recoil-right', 'recoil-left');
    void d.offsetWidth;
    d.classList.add('recoil-' + dir);
    setTimeout(() => d.classList.remove('recoil-' + dir), 600);
  }

  function animateDodge(defenderKey) {
    const d = $('#' + defenderKey + '-portrait');
    if (!d) return;
    d.classList.remove('dodging');
    void d.offsetWidth;
    d.classList.add('dodging');
    setTimeout(() => d.classList.remove('dodging'), 550);
  }

  function animateHeal(targetKey) {
    const avatar = $('#bar-' + targetKey + ' .avatar');
    if (!avatar) return;
    avatar.classList.remove('healing');
    void avatar.offsetWidth;
    avatar.classList.add('healing');
    setTimeout(() => avatar.classList.remove('healing'), 750);
  }

  function shakeArena(heavy = false) {
    const arena = $('#arena');
    if (!arena) return;
    arena.classList.remove('shake-light', 'shake-heavy');
    void arena.offsetWidth;
    arena.classList.add(heavy ? 'shake-heavy' : 'shake-light');
    setTimeout(() => arena.classList.remove('shake-light', 'shake-heavy'), heavy ? 600 : 400);
  }

  function flashVignette(kind = 'crit') {
    const v = $('#vignette');
    if (!v) return;
    v.classList.remove('flash-crit', 'flash-heal');
    void v.offsetWidth;
    v.classList.add(kind === 'heal' ? 'flash-heal' : 'flash-crit');
    setTimeout(() => v.classList.remove('flash-crit', 'flash-heal'), 520);
  }

  // Visual effect mid-arena (slash/burst) when an ability lands.
  function impactEffect(kind = 'slash') {
    const root = $('#floating-fx');
    if (!root) return;
    const wrap = document.createElement('div');
    wrap.className = 'impact-fx';
    const fx = document.createElement('div');
    fx.className = kind === 'burst' ? 'impact-burst' : 'impact-slash';
    wrap.appendChild(fx);
    root.appendChild(wrap);
    setTimeout(() => wrap.remove(), 600);
  }

  // Position a popup near the defender, anchored toward the arena center.
  function positionNearPortrait(targetKey, popup, offsetY = 0) {
    const target = $('#' + targetKey + '-portrait');
    const arenaRect = $('.arena').getBoundingClientRect();
    if (!target) return;
    const tRect = target.getBoundingClientRect();
    const x = tRect.left + tRect.width / 2 - arenaRect.left;
    const isOpponent = targetKey === 'p2';
    // For opponent (top), pull popup down into the arena; for player (bottom), pull it up.
    const y = isOpponent ? 36 + offsetY : arenaRect.height - 64 - offsetY;
    popup.style.left = (x - 50) + 'px';
    popup.style.top = y + 'px';
    popup.style.width = '100px';
    popup.style.alignItems = 'center';
    popup.style.transform = 'translateX(0)';
  }

  // Build a small defense-die element with hero face and block/fail styling.
  function buildDefDie(value, hero, idx, total) {
    const die = document.createElement('div');
    die.className = 'def-die ' + (value >= 4 ? 'block' : 'fail');
    die.style.setProperty('--def-delay', (idx * 0.08).toFixed(2) + 's');
    die.style.setProperty('--def-pulse-delay', (0.55 + idx * 0.08).toFixed(2) + 's');
    if (window.applyDieMaterial) applyDieMaterial(die, hero);
    if (hero?.color) die.style.setProperty('--die-tint', hero.color);
    const name = hero?.diceFaceNames ? hero.diceFaceNames[value - 1] : '';
    if (window.diceFaceSVG && hero?.id) {
      die.innerHTML = `<span class="def-face" title="${name}">${diceFaceSVG(hero.id, value)}</span>`;
    } else {
      const sym = hero?.diceFaces ? hero.diceFaces[value - 1] : value;
      die.innerHTML = `<span class="def-face" title="${name}">${sym}</span>`;
    }
    return die;
  }

  // Show the auto-rolled defense dice with their values and which ones blocked.
  function showDefenseDice(targetKey, rolls, opts = {}) {
    const root = $('#floating-fx');
    if (!root) return;
    const hero = opts.hero;
    const popup = document.createElement('div');
    popup.className = 'defense-popup';
    positionNearPortrait(targetKey, popup);

    const row = document.createElement('div');
    row.className = 'def-row';
    rolls.forEach((v, i) => row.appendChild(buildDefDie(v, hero, i, rolls.length)));

    const label = document.createElement('div');
    const blocked = rolls.filter(v => v >= 4).length;
    label.className = 'def-label blocked';
    if (opts.customLabel) {
      label.textContent = opts.customLabel;
      if (opts.customLabel.startsWith('✗')) label.className = 'def-label failed';
    } else if (opts.guardBlocked) {
      label.textContent = `🛡 GUARD ${opts.guardBlocked}` + (blocked > 0 ? ` · DEF ${blocked}` : '');
    } else if (blocked > 0) {
      label.textContent = `🛡 BLOCKED ${blocked}`;
    } else {
      label.className = 'def-label failed';
      label.textContent = '✗ NO BLOCK';
    }

    popup.appendChild(row);
    popup.appendChild(label);
    root.appendChild(popup);
    setTimeout(() => popup.remove(), 1900);
  }

  // Pop up a guard-shield badge above the defender (used when guard absorbs).
  function showGuardAbsorb(targetKey, amount) {
    const root = $('#floating-fx');
    const target = $('#' + targetKey + '-portrait');
    if (!root || !target) return;
    const arenaRect = $('.arena').getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    const x = tRect.left + tRect.width / 2 - arenaRect.left;
    const isOpponent = targetKey === 'p2';
    const y = isOpponent ? 56 : arenaRect.height - 72;
    const el = document.createElement('div');
    el.className = 'guard-shield';
    el.textContent = `🛡 ABSORB ${amount}`;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    root.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  // Pop up a "PIERCE — UNDEFENDABLE" tag at the defender for piercing attacks.
  function showPierce(targetKey) {
    const root = $('#floating-fx');
    const target = $('#' + targetKey + '-portrait');
    if (!root || !target) return;
    const arenaRect = $('.arena').getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    const x = tRect.left + tRect.width / 2 - arenaRect.left;
    const isOpponent = targetKey === 'p2';
    const y = isOpponent ? 56 : arenaRect.height - 72;
    const el = document.createElement('div');
    el.className = 'pierce-mark';
    el.textContent = '✦ PIERCE';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    root.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  // Snapshot defender/attacker, run defense.apply, then restore so previews
  // don't mutate game state.
  function previewDefense(defense, rolls, dmg, defender, attacker) {
    const dHp = defender.hp;
    const aHp = attacker.hp;
    const dSt = defender.statuses.map(s => ({ ...s }));
    const aSt = attacker.statuses.map(s => ({ ...s }));
    let result;
    try { result = defense.apply(rolls, dmg, defender, attacker); }
    catch (e) { result = dmg; }
    defender.hp = dHp;
    attacker.hp = aHp;
    defender.statuses = dSt;
    attacker.statuses = aSt;
    return result;
  }

  // ===== Defense panel (player-controlled defense) =====
  function showOffenseZone() {
    $('#offense-zone').hidden = false;
    $('#defense-zone').hidden = true;
  }
  function showDefenseZone() {
    $('#offense-zone').hidden = true;
    $('#defense-zone').hidden = false;
  }

  // Render the defense choice panel and call onChoose with the selected option.
  // Render the interactive defense panel. Drives a full mini-turn where the
  // defender rolls 3 dice (up to 3 rolls), can lock keepers between rolls,
  // and picks a defensive ability when satisfied.
  //
  // opts:
  //   defender, attacker, ability, dmg : context
  //   state                              : defense dice state (newDefenseState())
  //   onRoll(), onLock(idx)              : interactive callbacks
  //   onChoose(defenseOption)            : commit a defense
  function renderDefensePanel({ defender, attacker, ability, dmg, state, onRoll, onLock, onChoose }) {
    showDefenseZone();
    $('#def-attacker').textContent = attacker.name;
    $('#def-ability-name').textContent = ability.name;
    $('#def-incoming').textContent = dmg;
    $('#def-pierce').hidden = !ability.undefendable;

    // ---- Dice row ----
    const diceRow = $('#def-dice-row');
    diceRow.innerHTML = '';
    state.values.forEach((v, i) => {
      const die = buildDefDieInteractive({
        value: v, hero: defender.hero, idx: i,
        locked: state.locked[i],
        canLock: v > 0 && state.rollsLeft > 0 && state.hasRolled,
        onLock,
      });
      diceRow.appendChild(die);
    });

    // ---- Roll controls ----
    $('#def-rolls-left').textContent = state.rollsLeft;
    const rollBtn = $('#btn-def-roll');
    rollBtn.disabled = state.rollsLeft <= 0;
    rollBtn.textContent = state.hasRolled ? 'Re-roll' : 'Roll Defense';
    rollBtn.onclick = () => onRoll && onRoll();
    const hint = $('#def-hint');
    if (!state.hasRolled) {
      hint.textContent = 'Roll your defense dice to see options';
    } else if (state.rollsLeft > 0) {
      hint.textContent = 'Tap dice to keep, then re-roll — or pick a defense';
    } else {
      hint.textContent = 'Choose your defense';
    }

    // ---- Defensive options ----
    const triggers = state.hasRolled ? detectDefenseCombos(state.values) : new Set();
    const opts = $('#def-options');
    opts.innerHTML = '';
    defender.hero.defenses.forEach(d => {
      const can = state.hasRolled && triggers.has(d.combo);
      const btn = document.createElement('button');
      const isStandard = d.combo === 'd-any';
      btn.className = 'defense-option' + (can ? ' available' : '') + (isStandard ? ' standard' : '');
      btn.disabled = !can;
      let badge = '';
      if (state.hasRolled) {
        const result = previewDefense(d, state.values, dmg, defender, attacker);
        const reducedTo = Math.max(0, result);
        const blocks = dmg - reducedTo;
        if (reducedTo === 0) badge = `<span class="reduce full">BLOCK ALL</span>`;
        else if (blocks > 0) badge = `<span class="reduce">-${blocks}</span>`;
        else badge = `<span class="reduce" style="background:linear-gradient(180deg,#c0392b,#7a0010)">TAKE ${dmg}</span>`;
      }
      btn.innerHTML = `
        <div class="name"><span>${d.name}</span>${badge}</div>
        <span class="combo">${(window.DEF_COMBO_LABEL && window.DEF_COMBO_LABEL[d.combo]) || ''}</span>
        <div class="desc">${d.desc}</div>
      `;
      btn.addEventListener('click', () => {
        if (!can) return;
        showOffenseZone();
        onChoose(d);
      });
      opts.appendChild(btn);
    });
  }

  // Build an interactive defense die that supports empty / locked / clickable states.
  function buildDefDieInteractive({ value, hero, idx, locked, canLock, onLock }) {
    const die = document.createElement('div');
    if (value === 0) {
      die.className = 'def-die empty';
      die.innerHTML = `<span class="def-face">?</span>`;
      return die;
    }
    die.className = 'def-die ' + (value >= 4 ? 'block' : 'fail');
    if (locked) die.classList.add('locked-keep');
    if (canLock) die.classList.add('clickable');
    die.style.setProperty('--def-delay', (idx * 0.06).toFixed(2) + 's');
    die.style.setProperty('--def-pulse-delay', (0.5 + idx * 0.06).toFixed(2) + 's');
    if (window.applyDieMaterial) applyDieMaterial(die, hero);
    if (hero?.color) die.style.setProperty('--die-tint', hero.color);
    const name = hero?.diceFaceNames ? hero.diceFaceNames[value - 1] : '';
    if (window.diceFaceSVG && hero?.id) {
      die.innerHTML = `<span class="def-face" title="${name}">${diceFaceSVG(hero.id, value)}</span>`;
    } else {
      const sym = hero?.diceFaces ? hero.diceFaces[value - 1] : value;
      die.innerHTML = `<span class="def-face" title="${name}">${sym}</span>`;
    }
    if (canLock && onLock) {
      die.addEventListener('click', () => onLock(idx));
    }
    return die;
  }

  // CP gain animation — pulses the chip and floats a marker above it.
  function showCpGain(targetKey, amount) {
    const root = $('#floating-fx');
    const chip = $('#' + targetKey + '-cp-chip');
    if (!root || !chip) return;
    chip.classList.remove('gain');
    void chip.offsetWidth;
    chip.classList.add('gain');
    setTimeout(() => chip.classList.remove('gain'), 750);

    const arenaRect = $('.arena').getBoundingClientRect();
    const cRect = chip.getBoundingClientRect();
    const x = cRect.left + cRect.width / 2 - arenaRect.left;
    const isOpponent = targetKey === 'p2';
    // Anchor to the side of the arena nearest the chip
    const y = isOpponent ? 8 : arenaRect.height - 30;
    const el = document.createElement('div');
    el.className = 'float-num cp';
    el.textContent = '+' + amount + ' ◆';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.setProperty('--drift', '0px');
    root.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  // Briefly flash the chip when CP is spent (used by future card-play logic).
  function showCpSpend(targetKey) {
    const chip = $('#' + targetKey + '-cp-chip');
    if (!chip) return;
    chip.classList.remove('spend');
    void chip.offsetWidth;
    chip.classList.add('spend');
    setTimeout(() => chip.classList.remove('spend'), 420);
  }

  // Toggle the persistent guard badge on the defender's avatar.
  function setGuardBadge(targetKey, on) {
    const avatar = $('#bar-' + targetKey + ' .avatar');
    if (!avatar) return;
    avatar.classList.toggle('guarded', !!on);
  }

  // Spell projectile flying from caster portrait to target portrait.
  function projectile(fromKey, toKey, glyph = '✦', color = '#ffcc4d') {
    const root = $('#floating-fx');
    const from = $('#' + fromKey + '-portrait');
    const to = $('#' + toKey + '-portrait');
    if (!root || !from || !to) return;
    const arenaRect = $('.arena').getBoundingClientRect();
    const fromRect = from.getBoundingClientRect();
    const toRect = to.getBoundingClientRect();
    const fx = fromRect.left + fromRect.width / 2 - arenaRect.left;
    const fy = fromRect.top + fromRect.height / 2 - arenaRect.top;
    const tx = toRect.left + toRect.width / 2 - arenaRect.left;
    const ty = toRect.top + toRect.height / 2 - arenaRect.top;

    const el = document.createElement('div');
    el.className = 'projectile';
    el.textContent = glyph;
    el.style.color = color;
    el.style.left = '0';
    el.style.top = '0';
    el.style.setProperty('--from-x', fx + 'px');
    el.style.setProperty('--from-y', fy + 'px');
    el.style.setProperty('--to-x', tx + 'px');
    el.style.setProperty('--to-y', ty + 'px');
    root.appendChild(el);
    setTimeout(() => el.remove(), 600);
  }

  /* ---- Banner ---- */

  function showBanner(text) {
    const b = $('#turn-banner');
    b.querySelector('span').textContent = text;
    b.classList.remove('show');
    void b.offsetWidth;
    b.classList.add('show');
  }

  /* ---- Confetti ---- */

  function spawnConfetti() {
    const c = $('#confetti');
    c.innerHTML = '';
    const colors = ['#ffcc4d', '#ff8a3d', '#4cc9f0', '#8b5cf6', '#4ade80', '#f87171'];
    for (let i = 0; i < 80; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = (Math.random() * 1.5) + 's';
      piece.style.animationDuration = (2 + Math.random() * 2) + 's';
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      c.appendChild(piece);
    }
  }

  return {
    $, $$, showScreen, toast,
    renderDie, renderDiceTray, animateDiceRoll, animateLockPulse,
    updatePlayerBar, setActiveTurn, resetHpTracking,
    renderAbilities, log, floatNumber, flashHit, showBanner, spawnConfetti,
    animateAttack, animateRecoil, animateDodge, animateHeal,
    shakeArena, flashVignette, impactEffect, projectile,
    showDefenseDice, showGuardAbsorb, showPierce, setGuardBadge,
    showOffenseZone, showDefenseZone, renderDefensePanel,
    showCpGain, showCpSpend,
  };
})();

window.UI = UI;
