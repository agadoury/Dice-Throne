/* ============================================================
   Dice Throne — Main game controller
   ============================================================ */

(function () {
  'use strict';

  const Game = {
    mode: 'ai', // 'ai' | 'local' | 'online' (online -> AI under the hood)
    selecting: 'p1',
    p1: null,
    p2: null,
    selectedHeroId: null,
    current: 'p1', // whose turn
    dice: null,
    triggers: new Set(),
    turnNumber: 1,
    stats: { abilitiesUsed: 0, totalDamage: 0, biggestHit: 0, turnsPlayed: 0 },
    over: false,
    aiBusy: false,
  };

  // ===== Player factory =====
  const CP_MAX = 15;
  function makePlayer(hero, name) {
    return {
      hero,
      name,
      hp: hero.hp,
      hpMax: hero.hp,
      cp: 0,
      cpMax: CP_MAX,
      statuses: [],
    };
  }

  // ===== Menu wiring =====
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    GameAudio.buttonClick();
    const action = btn.dataset.action;
    switch (action) {
      case 'play-ai': startSelect('ai'); break;
      case 'play-local': startSelect('local'); break;
      case 'online': startMatchmaking(); break;
      case 'how-to': UI.showScreen('screen-howto'); break;
      case 'back-to-menu': UI.showScreen('screen-menu'); resetGame(); break;
      case 'cancel-mm': cancelMatchmaking(); break;
      case 'rematch': rematch(); break;
      case 'quit-battle': confirmQuit(); break;
    }
  });

  // ===== Hero selection =====
  function startSelect(mode) {
    Game.mode = mode;
    Game.selecting = 'p1';
    Game.p1 = null;
    Game.p2 = null;
    UI.$('#select-title').textContent = 'Choose Your Champion';
    const stepLabel = mode === 'local' ? 'Player 1' :
                      mode === 'online' ? 'Ranked' : 'vs AI';
    UI.$('#select-step').textContent = stepLabel;
    renderHeroGrid();
    UI.showScreen('screen-select');
  }

  function renderHeroGrid() {
    const grid = UI.$('#hero-grid');
    grid.innerHTML = '';
    HEROES.forEach(h => {
      const card = document.createElement('button');
      card.className = 'hero-card';
      card.style.setProperty('--card-color', h.color + '55');
      const taken = (Game.selecting === 'p2' && Game.mode === 'local' && Game.p1?.hero.id === h.id);
      if (taken) card.classList.add('taken');
      if (Game.selectedHeroId === h.id) card.classList.add('selected');
      card.innerHTML = `
        <div class="glyph" style="color:${h.color}">${h.glyph}</div>
        <div class="label">${h.name}</div>
      `;
      card.addEventListener('click', () => selectHero(h.id));
      grid.appendChild(card);
    });
    showHeroDetail(null);
  }

  function selectHero(id) {
    GameAudio.buttonClick();
    Game.selectedHeroId = id;
    UI.$$('.hero-card').forEach(c => c.classList.remove('selected'));
    const cards = UI.$$('.hero-card');
    const idx = HEROES.findIndex(h => h.id === id);
    if (cards[idx]) cards[idx].classList.add('selected');
    showHeroDetail(HEROES[idx]);
  }

  function showHeroDetail(hero) {
    const portrait = UI.$('#hero-portrait');
    const nameEl = UI.$('#hero-name');
    const taglineEl = UI.$('#hero-tagline');
    const hpEl = UI.$('#hero-hp');
    const styleEl = UI.$('#hero-style');
    const diffEl = UI.$('#hero-diff');
    const abilitiesEl = UI.$('#hero-abilities');
    const dicePreview = UI.$('#hero-dice-preview');
    const confirm = UI.$('#btn-confirm-hero');
    if (!hero) {
      portrait.textContent = '?';
      portrait.style.borderColor = 'rgba(255,255,255,0.2)';
      portrait.style.boxShadow = 'none';
      nameEl.textContent = '—';
      taglineEl.textContent = 'Select a hero';
      hpEl.textContent = '—';
      styleEl.textContent = '—';
      diffEl.textContent = '—';
      abilitiesEl.innerHTML = '';
      if (dicePreview) dicePreview.innerHTML = '';
      confirm.disabled = true;
      return;
    }
    portrait.textContent = hero.glyph;
    portrait.style.borderColor = hero.color;
    portrait.style.boxShadow = `0 0 30px ${hero.color}66`;
    nameEl.textContent = hero.name;
    taglineEl.textContent = hero.tagline;
    hpEl.textContent = hero.hp;
    styleEl.textContent = hero.style;
    diffEl.textContent = hero.difficulty;
    if (dicePreview) {
      const useSvg = !!window.diceFaceSVG;
      const mat = (window.HERO_DICE_MATERIAL || {})[hero.id] || {};
      const matStyle = mat.bg ? `--die-face-bg:${mat.bg};--die-face-fg:${mat.fg};--die-face-edge:${mat.edge};--die-face-shine:${mat.shine};--die-face-glow:${mat.glow};` : '';
      dicePreview.innerHTML = '<div class="preview-label">Dice Faces — low → high</div>' +
        Array.from({ length: 6 }, (_, i) => {
          const name = (hero.diceFaceNames || [])[i] || '';
          const faceContent = useSvg
            ? diceFaceSVG(hero.id, i + 1)
            : `<span>${(hero.diceFaces || [])[i] || (i + 1)}</span>`;
          return `
            <div class="preview-die" style="${matStyle}" title="${name}">
              <span class="preview-face">${faceContent}</span>
            </div>`;
        }).join('');
    }
    abilitiesEl.innerHTML = '';
    hero.abilities.forEach(a => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="combo">${COMBO_LABEL[a.combo]}${a.undefendable ? ' • undefendable' : ''}</span>
        <b>${a.name}</b>${a.dmg ? ` — ${a.dmg} damage` : ''}. ${a.desc}
      `;
      abilitiesEl.appendChild(li);
    });
    confirm.disabled = false;
  }

  UI.$('#btn-confirm-hero').addEventListener('click', () => {
    if (!Game.selectedHeroId) return;
    GameAudio.buttonClick();
    const hero = HEROES.find(h => h.id === Game.selectedHeroId);
    if (Game.selecting === 'p1') {
      Game.p1 = makePlayer(hero, Game.mode === 'local' ? 'Player 1' : 'You');
      if (Game.mode === 'local') {
        Game.selecting = 'p2';
        Game.selectedHeroId = null;
        UI.$('#select-step').textContent = 'Player 2';
        UI.$('#select-title').textContent = 'Choose Your Champion';
        renderHeroGrid();
      } else {
        // AI opponent: pick a different hero
        const choices = HEROES.filter(h => h.id !== hero.id);
        const aiHero = choices[Math.floor(Math.random() * choices.length)];
        Game.p2 = makePlayer(aiHero, ['Argos','Mira','Kael','Sora','Riven','Nyx'][Math.floor(Math.random()*6)] + ' the ' + aiHero.name);
        if (Game.mode === 'online') startMatchmaking(true);
        else startBattle();
      }
    } else {
      Game.p2 = makePlayer(hero, 'Player 2');
      startBattle();
    }
  });

  // ===== Matchmaking (simulated) =====
  let mmTimer = null;
  function startMatchmaking(haveOpponent = false) {
    if (!haveOpponent) {
      // From "Online" menu — pick AI heroes for both? No, jump to hero select first
      startSelect('online');
      return;
    }
    UI.showScreen('screen-matchmaking');
    const status = UI.$('#mm-status');
    const messages = [
      'Connecting to the throne servers',
      'Searching for a champion',
      'Found ' + Game.p2.name,
      'Sealing the duel pact',
      'Entering the arena',
    ];
    let i = 0;
    status.textContent = messages[0];
    mmTimer = setInterval(() => {
      i++;
      if (i >= messages.length) {
        clearInterval(mmTimer);
        startBattle();
        return;
      }
      status.textContent = messages[i];
    }, 700);
  }

  function cancelMatchmaking() {
    if (mmTimer) clearInterval(mmTimer);
    UI.showScreen('screen-menu');
  }

  // ===== Battle setup =====
  function startBattle() {
    Game.over = false;
    Game.aiBusy = false;
    Game.current = Math.random() < 0.5 ? 'p1' : 'p2';
    Game.firstPlayerOfMatch = Game.current;
    Game.incomeSkipped = false;
    Game.dice = newDiceState();
    Game.triggers = new Set();
    Game.turnNumber = 1;
    Game.stats = { abilitiesUsed: 0, totalDamage: 0, biggestHit: 0, turnsPlayed: 0 };
    // Reset CP at the start of each match (rematch path)
    Game.p1.cp = 0;
    Game.p2.cp = 0;
    UI.$('#combat-log').innerHTML = '';
    UI.resetHpTracking();
    UI.showOffenseZone();
    UI.showScreen('screen-battle');
    UI.updatePlayerBar('p1', Game.p1);
    UI.updatePlayerBar('p2', Game.p2);
    UI.renderDiceTray(Game.dice, { canLock: false, hero: activePlayer().hero });
    UI.renderAbilities(activePlayer().hero, Game.triggers, onAbilityClick, isHumanTurn());
    UI.setActiveTurn(Game.current);
    UI.log(`<b>${Game.p1.name}</b> challenges <b>${Game.p2.name}</b>!`, 'crit');
    setTimeout(() => beginTurn(), 500);
  }

  // ===== Turn =====
  function activePlayer() { return Game[Game.current]; }
  function inactivePlayer() { return Game[Game.current === 'p1' ? 'p2' : 'p1']; }
  function isHumanTurn() {
    if (Game.mode === 'local') return true;
    return Game.current === 'p1';
  }

  function beginTurn() {
    if (Game.over) return;
    UI.setActiveTurn(Game.current);
    Game.dice = newDiceState();
    UI.renderDiceTray(Game.dice, { canLock: false, hero: activePlayer().hero });
    UI.renderAbilities(activePlayer().hero, new Set(), onAbilityClick, isHumanTurn());
    UI.$('#rolls-left').textContent = Game.dice.rollsLeft;
    UI.$('#btn-end-turn').disabled = true;

    // Income Phase — gain 1 CP (first player skips on their first turn).
    incomePhase(activePlayer());

    // Apply DoT (burn, poison)
    tickStatusesAtTurnStart(activePlayer());
    if (checkWinner()) return;

    GameAudio.turnStart(Game.current === 'p1');
    UI.showBanner(activePlayer().name + "'s turn");
    UI.log(`<b>${activePlayer().name}</b>'s turn`, isHumanTurn() ? 'you' : 'foe');

    if (!isHumanTurn()) {
      Game.aiBusy = true;
      setTimeout(aiTakeTurn, 900);
    }
  }

  // Income Phase — gain 1 CP up to the cap. The first player to act in
  // the match skips their very first income to balance going first.
  function incomePhase(p) {
    if (p === Game[Game.firstPlayerOfMatch] && !Game.incomeSkipped) {
      Game.incomeSkipped = true;
      UI.log(`<b>${p.name}</b> goes first — no income`, 'crit');
      return;
    }
    if (p.cp >= p.cpMax) {
      UI.log(`<b>${p.name}</b> at ◆ MAX (${p.cpMax})`);
      return;
    }
    p.cp = Math.min(p.cpMax, p.cp + 1);
    UI.log(`<b>${p.name}</b> gains <span class="cp-text">+1 ◆</span>`, 'crit');
    UI.updatePlayerBar(playerKey(p), p);
    UI.showCpGain(playerKey(p), 1);
    GameAudio.cpGain();
  }

  function tickStatusesAtTurnStart(p) {
    const remaining = [];
    let tickedAny = false;
    for (const s of p.statuses) {
      if (s.kind === 'burn') {
        const dmg = s.amount;
        p.hp -= dmg;
        UI.log(`<b>${p.name}</b> takes ${dmg} burn 🔥`);
        UI.floatNumber(playerKey(p), '🔥' + dmg, 'dmg');
        UI.flashHit(playerKey(p));
        GameAudio.status();
        tickedAny = true;
      } else if (s.kind === 'poison') {
        const dmg = s.amount;
        p.hp -= dmg;
        UI.log(`<b>${p.name}</b> takes ${dmg} poison ☠`);
        UI.floatNumber(playerKey(p), '☠' + dmg, 'dmg');
        UI.flashHit(playerKey(p));
        GameAudio.status();
        tickedAny = true;
      }
      s.turns -= 1;
      if (s.turns > 0) remaining.push(s);
    }
    p.statuses = remaining;
    UI.updatePlayerBar(playerKey(p), p);
    if (tickedAny) UI.shakeArena(false);
  }

  function playerKey(p) { return p === Game.p1 ? 'p1' : 'p2'; }

  // ===== Roll button =====
  UI.$('#btn-roll').addEventListener('click', () => {
    if (!isHumanTurn() || Game.over) return;
    if (Game.dice.rollsLeft <= 0) return;
    rollPhase();
  });

  UI.$('#btn-end-turn').addEventListener('click', () => {
    if (!isHumanTurn() || Game.over) return;
    GameAudio.buttonClick();
    endTurn();
  });

  function rollPhase() {
    GameAudio.diceRoll();
    rollDice(Game.dice);
    UI.renderDiceTray(Game.dice, {
      canLock: isHumanTurn() && Game.dice.rollsLeft > 0,
      onClick: toggleLock,
      hero: activePlayer().hero,
    });
    UI.animateDiceRoll(Game.dice);
    setTimeout(() => GameAudio.diceLand(), 600);
    Game.triggers = detectCombos(Game.dice.values);
    UI.$('#rolls-left').textContent = Game.dice.rollsLeft;
    UI.renderAbilities(activePlayer().hero, Game.triggers, onAbilityClick, isHumanTurn());
    UI.$('#btn-end-turn').disabled = false;
    if (Game.dice.rollsLeft === 0) {
      UI.toast('No rolls left — choose an ability or end turn');
    }
  }

  function toggleLock(idx) {
    if (Game.dice.values[idx] === 0) return;
    if (Game.dice.rollsLeft <= 0) return;
    const wasLocked = Game.dice.locked[idx];
    Game.dice.locked[idx] = !wasLocked;
    GameAudio.diceLock();
    UI.renderDiceTray(Game.dice, {
      canLock: true,
      onClick: toggleLock,
      hero: activePlayer().hero,
    });
    if (!wasLocked) UI.animateLockPulse(idx);
  }

  function onAbilityClick(idx) {
    if (!isHumanTurn() || Game.over) return;
    const hero = activePlayer().hero;
    const a = hero.abilities[idx];
    if (!Game.triggers.has(a.combo)) return;
    useAbility(activePlayer(), inactivePlayer(), a);
  }

  // Heroes that "throw" magical projectiles vs. melee slash visualization.
  const PROJECTILE_HEROES = {
    'pyromancer':   { glyph: '🔥', color: '#ff6b3d' },
    'moon-elf':     { glyph: '➹',  color: '#b6e2ff' },
    'shadow-thief': { glyph: '🗡', color: '#d8b8ff' },
    'paladin':      { glyph: '✦',  color: '#ffe28a' },
  };

  // ===== Combat resolution =====
  function useAbility(attacker, defender, ability) {
    Game.stats.abilitiesUsed++;
    const heavy = ['four','five','full-house','straight'].includes(ability.combo);
    GameAudio.abilityCast(heavy);
    UI.log(`<b>${attacker.name}</b> uses <b>${ability.name}</b>!`, attacker === Game.p1 ? 'you' : 'foe');

    // 1) Caster lunges
    const aKey = playerKey(attacker);
    const dKey = playerKey(defender);
    UI.animateAttack(aKey, dKey);

    // 2) Apply self-effects up front (heal, charge, etc) — show heal aura
    const ctx = { bonusDamage: 0 };
    const hpBefore = attacker.hp;
    if (ability.apply) {
      try { ability.apply(attacker, defender, Game.dice.values, ctx); } catch (e) { console.error(e); }
    }
    const healed = attacker.hp - hpBefore;
    if (healed > 0) {
      setTimeout(() => {
        UI.floatNumber(aKey, '+' + healed, 'heal');
        UI.animateHeal(aKey);
        UI.flashVignette('heal');
        GameAudio.heal();
      }, 220);
      UI.log(`<b>${attacker.name}</b> restores ${healed} HP`, 'crit');
    }

    let dmg = (ability.dmg || 0) + (ctx.bonusDamage || 0);

    // Charge bonus
    const charge = attacker.statuses.find(s => s.kind === 'charge');
    if (charge && dmg > 0) {
      dmg += charge.amount;
      UI.log(`⚡ Charge adds +${charge.amount}`, 'crit');
      attacker.statuses = attacker.statuses.filter(s => s.kind !== 'charge');
    }

    // Mark on defender
    const mark = defender.statuses.find(s => s.kind === 'mark');
    if (mark && dmg > 0) {
      dmg += mark.amount;
      UI.log(`🎯 Mark adds +${mark.amount}`, 'crit');
      defender.statuses = defender.statuses.filter(s => s.kind !== 'mark');
    }

    // Defense — split into passive resolution (dodge/guard) then chosen defense
    let dodged = false;
    let guardAbsorbed = 0;
    if (dmg > 0) {
      const dodge = defender.statuses.find(s => s.kind === 'dodge');
      if (dodge && Math.random() < 0.5) {
        UI.log(`💨 <b>${defender.name}</b> dodges!`, 'crit');
        defender.statuses = defender.statuses.filter(s => s.kind !== 'dodge');
        dodged = true;
        dmg = 0;
      } else if (!ability.undefendable) {
        const guard = defender.statuses.find(s => s.kind === 'guard');
        if (guard) {
          guardAbsorbed = Math.min(dmg, guard.amount);
          dmg -= guardAbsorbed;
          guard.amount -= guardAbsorbed;
          if (guard.amount <= 0) defender.statuses = defender.statuses.filter(s => s !== guard);
          UI.log(`🛡 Guard absorbs ${guardAbsorbed}`, 'crit');
        }
      } else {
        UI.log(`✦ Undefendable!`, 'crit');
      }
    }

    // Sync persistent guard badge on the defender's avatar after possible consumption
    UI.setGuardBadge(dKey, defender.statuses.some(s => s.kind === 'guard' && s.amount > 0));

    // Decide whether the defender chooses or auto-resolves.
    const willChooseDefense = (
      dmg > 0 && !dodged && !ability.undefendable
    );

    // Lazy-fire projectile only when impact is imminent so it doesn't fly past
    // an empty arena while the defender is still rolling/picking.
    const projDef = PROJECTILE_HEROES[attacker.hero.id];
    const hasProjectile = (ability.dmg || 0) > 0 && projDef && !dodged;
    function fireProjectile() {
      if (hasProjectile) UI.projectile(aKey, dKey, projDef.glyph, projDef.color);
    }

    if (willChooseDefense) {
      const defenderIsHuman = isHumanFor(defender);

      // proceed(): commit a chosen defense — applies it, animates side effects,
      //           fires the projectile, and schedules the impact resolution.
      const proceed = (chosenDefense, defRolls) => {
        const dHpBefore = defender.hp;
        const aHpBefore = attacker.hp;
        const reduced = Math.max(0, chosenDefense.apply(defRolls, dmg, defender, attacker));
        const blocked = dmg - reduced;
        const counter = Math.max(0, aHpBefore - attacker.hp);
        const selfHeal = Math.max(0, defender.hp - dHpBefore);
        UI.log(
          (blocked > 0
            ? `<b>${defender.name}</b> uses <b>${chosenDefense.name}</b> [${defRolls.join(', ')}] — blocks ${blocked}`
            : `<b>${defender.name}</b> uses <b>${chosenDefense.name}</b> [${defRolls.join(', ')}] — no blocks`),
          'crit'
        );
        const summary = chosenDefense.summary
          ? chosenDefense.summary(defRolls, dmg)
          : (blocked > 0 ? `🛡 ${blocked} BLOCKED` : '✗ NO BLOCK');
        UI.showDefenseDice(dKey, defRolls, {
          guardBlocked: guardAbsorbed,
          customLabel: summary,
          hero: defender.hero,
        });
        if (counter > 0) {
          setTimeout(() => {
            UI.flashHit(aKey);
            UI.animateRecoil(aKey);
            UI.floatNumber(aKey, '-' + counter, 'dmg');
            UI.shakeArena(false);
            GameAudio.hit(false);
          }, 400);
          UI.log(`<b>${defender.name}</b> counters for ${counter}`, 'crit');
        }
        if (selfHeal > 0) {
          setTimeout(() => {
            UI.animateHeal(dKey);
            UI.floatNumber(dKey, '+' + selfHeal, 'heal');
            UI.flashVignette('heal');
            GameAudio.heal();
          }, 450);
          UI.log(`<b>${defender.name}</b> heals ${selfHeal}`, 'crit');
        }
        UI.updatePlayerBar('p1', Game.p1);
        UI.updatePlayerBar('p2', Game.p2);
        if (checkWinner()) return;
        // Fire projectile to deliver the (reduced) hit, then run impact
        setTimeout(fireProjectile, 250);
        finalizeImpact(reduced);
      };

      if (defenderIsHuman) {
        runHumanDefenseTurn(defender, attacker, ability, dmg, proceed);
      } else {
        runAiDefenseTurn(defender, attacker, ability, dmg, proceed);
      }
    } else {
      // No defense choice (dodge auto-fired, undefendable, or no damage). Show pierce/dodge visual then impact.
      if (ability.dmg > 0) {
        if (dodged) {
          // Visual handled in finalizeImpact
          setTimeout(fireProjectile, 200);
        } else if (ability.undefendable) {
          setTimeout(() => UI.showPierce(dKey), 200);
          setTimeout(fireProjectile, 350);
        } else if (guardAbsorbed > 0 && dmg === 0) {
          setTimeout(() => UI.showGuardAbsorb(dKey, guardAbsorbed), 250);
        }
      }
      finalizeImpact(dmg, { dodged });
    }

    // ---- Inner: actually resolve the impact ----
    function finalizeImpact(finalDmg, opts = {}) {
      const wasDodged = opts.dodged || (finalDmg === 0 && dodged);
      // Delay so visuals (defense dice popup, pierce, projectile) read first
      const delay = ability.dmg > 0 && !wasDodged ? 1000 : 600;
      setTimeout(() => {
        if (wasDodged) {
          UI.animateDodge(dKey);
          UI.floatNumber(dKey, 'DODGE', 'miss');
          GameAudio.miss();
        } else if (finalDmg > 0) {
          UI.impactEffect(finalDmg >= 8 ? 'burst' : 'slash');
          UI.flashHit(dKey);
          UI.animateRecoil(dKey);
          UI.shakeArena(finalDmg >= 8);
          if (finalDmg >= 8) UI.flashVignette('crit');
          defender.hp -= finalDmg;
          Game.stats.totalDamage += (attacker === Game.p1 ? finalDmg : 0);
          Game.stats.biggestHit = Math.max(Game.stats.biggestHit, finalDmg);
          UI.floatNumber(dKey, '-' + finalDmg, finalDmg >= 8 ? 'crit' : 'dmg');
          if (finalDmg >= 8) GameAudio.crit(); else GameAudio.hit(finalDmg >= 5);
          UI.log(`<b>${defender.name}</b> takes ${finalDmg} damage`, 'foe');
        } else if (ability.dmg) {
          UI.floatNumber(dKey, 'BLOCKED', 'miss');
          GameAudio.miss();
        }
        UI.updatePlayerBar('p1', Game.p1);
        UI.updatePlayerBar('p2', Game.p2);

        if (checkWinner()) return;

        Game.dice.rollsLeft = 0;
        Game.triggers = new Set();
        UI.renderAbilities(activePlayer().hero, Game.triggers, onAbilityClick, isHumanTurn());
        UI.renderDiceTray(Game.dice, { canLock: false, hero: activePlayer().hero });
        UI.$('#rolls-left').textContent = 0;
        setTimeout(endTurn, 1000);
      }, delay);
    }
  }

  function isHumanFor(player) {
    if (Game.mode === 'local') return true;
    return player === Game.p1;
  }

  /* ============================================================
     Defensive turn — defender rolls 3 dice (up to 3 rolls), can
     lock keepers, and picks a defensive ability.
     ============================================================ */

  function runHumanDefenseTurn(defender, attacker, ability, dmg, commit) {
    const state = newDefenseState();
    function rerender() {
      UI.renderDefensePanel({
        defender, attacker, ability, dmg, state,
        onRoll: () => {
          if (state.rollsLeft <= 0) return;
          GameAudio.diceRoll();
          rollDefenseDice(state);
          rerender();
          setTimeout(() => GameAudio.diceLand(), 450);
        },
        onLock: (idx) => {
          if (state.values[idx] === 0) return;
          if (state.rollsLeft <= 0) return;
          state.locked[idx] = !state.locked[idx];
          GameAudio.diceLock();
          rerender();
        },
        onChoose: (chosenDefense) => {
          GameAudio.buttonClick();
          commit(chosenDefense, state.values.slice());
        },
      });
    }
    rerender();
  }

  function runAiDefenseTurn(defender, attacker, ability, dmg, commit) {
    const state = newDefenseState();
    let stepN = 0;

    function step() {
      stepN++;
      if (state.rollsLeft <= 0 || aiShouldStopRollingDef(state)) {
        const choice = AI.pickDefense(defender, attacker, state.values.slice(), dmg);
        commit(choice, state.values.slice());
        return;
      }
      if (state.hasRolled) {
        // Lock smart dice based on what would help the AI's best available defense
        state.locked = aiChooseDefenseLocks(state.values, defender);
      }
      GameAudio.diceRoll();
      rollDefenseDice(state);
      setTimeout(() => GameAudio.diceLand(), 280);
      // Yield briefly between rolls so player perceives the AI "thinking"
      setTimeout(step, 480);
    }
    // Tiny opening pause so the attack lunge plays before AI starts its defense
    setTimeout(step, 200);
  }

  function aiShouldStopRollingDef(state) {
    if (!state.hasRolled) return false;
    const triggers = detectDefenseCombos(state.values);
    // Three of a kind always blocks all — stop immediately
    if (triggers.has(DEF_COMBO.THREE)) return true;
    // All-high (every die ≥4) blocks max via Brace — stop
    if (triggers.has(DEF_COMBO.ALL_HIGH)) return true;
    return false;
  }

  // For the AI: pick which dice to keep before re-rolling toward a stronger defense.
  function aiChooseDefenseLocks(values, defender) {
    const counts = {};
    values.forEach(v => counts[v] = (counts[v] || 0) + 1);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topFace = +sorted[0][0];
    const topCount = sorted[0][1];
    // Prefer chasing 3-of-a-kind: lock all dice matching the most common face
    if (topCount >= 2) {
      return values.map(v => v === topFace);
    }
    // Otherwise lock dice that already block (≥4) and re-roll the failures
    return values.map(v => v >= 4);
  }

  // ===== End turn =====
  function endTurn() {
    if (Game.over) return;
    Game.stats.turnsPlayed++;
    Game.current = Game.current === 'p1' ? 'p2' : 'p1';
    Game.turnNumber++;
    Game.aiBusy = false;
    UI.$('#btn-end-turn').disabled = true;
    setTimeout(beginTurn, 350);
  }

  // ===== AI =====
  function aiTakeTurn() {
    if (Game.over) return;
    const hero = activePlayer().hero;

    function rollStep() {
      if (Game.over) return;
      // First time, roll all
      if (Game.dice.rollsLeft === MAX_ROLLS) {
        GameAudio.diceRoll();
        rollDice(Game.dice);
        UI.renderDiceTray(Game.dice, { canLock: false, hero: activePlayer().hero });
        UI.animateDiceRoll(Game.dice);
        Game.triggers = detectCombos(Game.dice.values);
        UI.renderAbilities(activePlayer().hero, Game.triggers, onAbilityClick, false);
        UI.$('#rolls-left').textContent = Game.dice.rollsLeft;
        setTimeout(() => GameAudio.diceLand(), 500);
        setTimeout(rollStep, 1100);
        return;
      }

      if (AI.shouldStopRolling(Game.dice.values) || Game.dice.rollsLeft === 0) {
        // Pick ability
        const a = AI.pickAbility(hero, Game.dice.values, activePlayer(), inactivePlayer());
        setTimeout(() => useAbility(activePlayer(), inactivePlayer(), a), 600);
        return;
      }

      // Lock dice intelligently
      Game.dice.locked = AI.chooseLocks(Game.dice.values);
      UI.renderDiceTray(Game.dice, { canLock: false, hero: activePlayer().hero });
      setTimeout(() => {
        GameAudio.diceLock();
        GameAudio.diceRoll();
        rollDice(Game.dice);
        UI.renderDiceTray(Game.dice, { canLock: false, hero: activePlayer().hero });
        UI.animateDiceRoll(Game.dice);
        Game.triggers = detectCombos(Game.dice.values);
        UI.renderAbilities(activePlayer().hero, Game.triggers, onAbilityClick, false);
        UI.$('#rolls-left').textContent = Game.dice.rollsLeft;
        setTimeout(() => GameAudio.diceLand(), 500);
        setTimeout(rollStep, 1100);
      }, 600);
    }

    rollStep();
  }

  // ===== Game over =====
  function checkWinner() {
    if (Game.p1.hp <= 0 || Game.p2.hp <= 0) {
      Game.over = true;
      const youWin = (Game.p1.hp > 0);
      setTimeout(() => showEnd(youWin), 1100);
      return true;
    }
    return false;
  }

  function showEnd(youWin) {
    const card = UI.$('.end-card');
    card.classList.toggle('defeat', !youWin);
    UI.$('#end-title').textContent = youWin ? 'VICTORY' : 'DEFEAT';
    UI.$('#end-sub').textContent = youWin
      ? `${Game.p1.name} claims the throne!`
      : `${Game.p2.name} stands victorious.`;
    UI.$('#end-portrait').textContent = youWin ? Game.p1.hero.glyph : Game.p2.hero.glyph;
    const stats = UI.$('#end-stats');
    stats.innerHTML = `
      <div>Turns played <b>${Game.stats.turnsPlayed}</b></div>
      <div>Abilities used <b>${Game.stats.abilitiesUsed}</b></div>
      <div>Total damage dealt <b>${Game.stats.totalDamage}</b></div>
      <div>Biggest hit <b>${Game.stats.biggestHit}</b></div>
      <div>Final ◆ CP <b>${(youWin ? Game.p1.cp : Game.p2.cp)}/15</b></div>
    `;
    UI.showScreen('screen-end');
    if (youWin) { GameAudio.victory(); UI.spawnConfetti(); }
    else { GameAudio.defeat(); }
  }

  function rematch() {
    if (!Game.p1 || !Game.p2) { UI.showScreen('screen-menu'); return; }
    // Restore HP, clear statuses
    Game.p1.hp = Game.p1.hpMax; Game.p1.statuses = [];
    Game.p2.hp = Game.p2.hpMax; Game.p2.statuses = [];
    // For local mode keep both players; for AI re-roll opponent hero too
    startBattle();
  }

  function confirmQuit() {
    if (Game.over) { UI.showScreen('screen-menu'); resetGame(); return; }
    if (confirm('Forfeit the duel and return to the menu?')) {
      resetGame();
      UI.showScreen('screen-menu');
    }
  }

  function resetGame() {
    Game.p1 = null;
    Game.p2 = null;
    Game.selectedHeroId = null;
    Game.over = false;
  }

  // ===== Menu live counters =====
  function tickPlayersOnline() {
    const base = 2400;
    const noise = Math.floor(Math.sin(Date.now() / 6000) * 120 + Math.random() * 40);
    UI.$('#players-online').textContent = (base + noise).toLocaleString() + ' players in arena';
  }
  setInterval(tickPlayersOnline, 2500);
  tickPlayersOnline();

  // First user gesture unlocks audio
  document.addEventListener('touchstart', () => GameAudio.resume(), { once: true });
  document.addEventListener('mousedown', () => GameAudio.resume(), { once: true });

  // Start at menu
  UI.showScreen('screen-menu');

})();
