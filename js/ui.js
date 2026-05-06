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
      // Force reflow then re-add to restart animation
      void d.offsetWidth;
      d.classList.add('rolling');
    });
  }

  /* ---- Player bar updates ---- */

  function updatePlayerBar(playerKey, player) {
    const prefix = '#' + playerKey;
    $(prefix + '-name').textContent = player.name;
    $(prefix + '-portrait').textContent = player.hero.glyph;
    $(prefix + '-hp').textContent = Math.max(0, player.hp);
    $(prefix + '-max').textContent = player.hpMax;

    const pct = Math.max(0, player.hp / player.hpMax * 100);
    const fill = $(prefix + '-hp-fill');
    fill.style.width = pct + '%';
    fill.classList.toggle('low', pct < 30);
    fill.classList.toggle('mid', pct >= 30 && pct < 60);

    const status = $(prefix + '-status');
    status.innerHTML = '';
    player.statuses.forEach(s => {
      const pip = document.createElement('span');
      pip.className = 'status-pip ' + s.kind;
      const icon = STATUS_ICON[s.kind] || '?';
      pip.innerHTML = `${icon} ${s.amount > 1 ? '<b>×' + s.amount + '</b>' : ''}<small> ${s.turns}t</small>`;
      status.appendChild(pip);
    });
  }

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
      btn.innerHTML = `
        <div class="name">
          <span>${a.name}</span>
          ${a.dmg ? `<span class="dmg">${a.dmg}⚔</span>` : ''}
        </div>
        <div class="combo">${COMBO_LABEL[a.combo]}${a.undefendable ? ' • undefendable' : ''}</div>
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
    const y = targetRect.top + targetRect.height / 2 - arenaRect.top;
    const el = document.createElement('div');
    el.className = 'float-num ' + kind;
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    root.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  function flashHit(playerKey) {
    const bar = $('#bar-' + playerKey);
    bar.classList.remove('hit-flash');
    void bar.offsetWidth;
    bar.classList.add('hit-flash');
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
    renderDie, renderDiceTray, animateDiceRoll,
    updatePlayerBar, setActiveTurn,
    renderAbilities, log, floatNumber, flashHit, showBanner, spawnConfetti,
  };
})();

window.UI = UI;
