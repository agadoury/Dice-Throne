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

  // Pip layouts for each face value (1-6)
  const PIP_MAP = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  function renderDie(value) {
    if (value <= 0) return '<span style="color:#888;font-size:1.4rem">·</span>';
    const pips = PIP_MAP[value] || [];
    const cells = Array(9).fill('').map((_, i) =>
      `<div>${pips.includes(i) ? '<div class="die-pip"></div>' : ''}</div>`
    ).join('');
    return `<div class="die-pips">${cells}</div>`;
  }

  function renderDiceTray(state, { canLock, onClick }) {
    const tray = $('#dice-tray');
    tray.innerHTML = '';
    state.values.forEach((v, i) => {
      const el = document.createElement('div');
      el.className = 'die';
      if (v === 0) el.classList.add('empty');
      if (state.locked[i]) el.classList.add('locked');
      el.innerHTML = renderDie(v);
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

  /* ---- Combat log ---- */

  function log(msg, kind = '') {
    const l = $('#combat-log');
    const line = document.createElement('div');
    line.className = 'log-line ' + kind;
    line.innerHTML = msg;
    l.prepend(line);
    while (l.children.length > 6) l.removeChild(l.lastChild);
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
  };
})();

window.UI = UI;
