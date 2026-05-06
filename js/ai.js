/* ============================================================
   Dice Throne — AI opponent
   Strategy:
     1. Roll all dice on first roll.
     2. Look at current roll. If a strong combo is already
        achievable (full house, four/five of a kind, straight),
        keep those dice.
     3. Else, lock the most-frequent value and try to build up.
     4. Stop early when a Five-of-a-kind or strong combo is hit.
     5. Pick the best ability available (highest damage,
        accounting for status synergies).
   ============================================================ */

const AI = (function () {

  function chooseLocks(values) {
    // Returns array of booleans, true = lock that index
    const locks = Array(values.length).fill(false);

    // Count how many of each face
    const counts = {};
    values.forEach(v => counts[v] = (counts[v] || 0) + 1);
    const sortedFaces = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topFace = +sortedFaces[0][0];
    const topCount = sortedFaces[0][1];

    // Detect partial straight
    const uniq = [...new Set(values)].sort((a, b) => a - b);
    const hasStraightPotential = uniq.length >= 4 && (uniq[uniq.length - 1] - uniq[0] <= 4);

    if (topCount >= 3 || (topCount === 2 && (sortedFaces[1] && sortedFaces[1][1] >= 2))) {
      // Lock all dice matching the top one or two faces
      const facesToKeep = sortedFaces.filter(([, c]) => c >= 2).map(([f]) => +f);
      values.forEach((v, i) => { if (facesToKeep.includes(v)) locks[i] = true; });
    } else if (hasStraightPotential) {
      // Keep one of each unique value seen
      const seen = new Set();
      values.forEach((v, i) => { if (!seen.has(v)) { seen.add(v); locks[i] = true; } });
    } else {
      // Lock the dominant face
      values.forEach((v, i) => { if (v === topFace) locks[i] = true; });
    }
    return locks;
  }

  function shouldStopRolling(values) {
    const triggers = detectCombos(values);
    if (triggers.has(COMBO.FIVE)) return true;
    if (triggers.has(COMBO.FOUR)) return true;
    if (triggers.has(COMBO.FULL_HOUSE)) return true;
    if (triggers.has(COMBO.STRAIGHT)) return true;
    return false;
  }

  function pickAbility(hero, values, self, foe) {
    const triggers = detectCombos(values);
    const choices = hero.abilities.filter(a => triggers.has(a.combo));

    // Score each: damage + bonus for status synergy + bonus for self-heal when low
    const scored = choices.map(a => {
      let score = (a.dmg || 0);
      if (a.undefendable) score += 1.5;
      if (a.combo === COMBO.FIVE) score += 4;
      if (a.combo === COMBO.FOUR) score += 2;
      if (a.combo === COMBO.FULL_HOUSE) score += 1.5;
      // Heal synergy when wounded
      if (self.hp < self.hpMax * 0.4 && /heal|peace|hands|focus|rebirth/i.test(a.name)) score += 4;
      // Avoid pure utility when foe is low (finish them)
      if (foe.hp <= 6 && (a.dmg || 0) >= foe.hp) score += 10;
      // Avoid wasting Any-roll utility if a stronger combo exists
      if (a.combo === COMBO.ANY && choices.length > 1) score -= 1;
      return { a, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.a || hero.abilities.find(a => a.combo === COMBO.ANY);
  }

  // Pick the best defense for the AI given rolls + incoming damage.
  // Strategy: prefer the one that minimizes resulting damage, with small
  // bonuses for utility (counter, dodge, heal, return-burn).
  function pickDefense(defender, attacker, rolls, dmg) {
    const triggers = detectDefenseCombos(rolls);
    const choices = defender.hero.defenses.filter(d => triggers.has(d.combo));

    function snapshotApply(d) {
      // Sandbox apply so we don't mutate state during scoring
      const dHp = defender.hp;
      const aHp = attacker.hp;
      const dSt = defender.statuses.map(s => ({ ...s }));
      const aSt = attacker.statuses.map(s => ({ ...s }));
      let result;
      try { result = d.apply(rolls, dmg, defender, attacker); } catch (e) { result = dmg; }
      const aHpAfter = attacker.hp;
      const dHpAfter = defender.hp;
      const counterDamage = aHp - aHpAfter;
      const selfHeal = dHpAfter - dHp;
      defender.hp = dHp;
      attacker.hp = aHp;
      defender.statuses = dSt;
      attacker.statuses = aSt;
      return { result, counterDamage, selfHeal };
    }

    const scored = choices.map(d => {
      const { result, counterDamage, selfHeal } = snapshotApply(d);
      // Lower is better for damage taken; bonus for counter / heal
      const damageTaken = Math.max(0, result);
      let score = -damageTaken * 2;
      score += counterDamage * 1.4;
      score += selfHeal * 1.2;
      // Bias slightly toward special defenses when they actually help
      if (d.combo !== 'd-any' && damageTaken < dmg) score += 0.5;
      return { d, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.d || STANDARD_DEFENSE;
  }

  return { chooseLocks, shouldStopRolling, pickAbility, pickDefense };
})();

window.AI = AI;
