# Dice Throne — Arena of Champions

A mobile-first, browser-based recreation of the dice combat board game *Dice Throne*. No build step, no dependencies — pure HTML / CSS / JS.

## Run

Open `index.html` in any modern browser, or serve the folder:

```
python3 -m http.server 8000
# then visit http://localhost:8000
```

For best results on a phone, add to home screen and play full-screen.

## Modes

- **Quick Match** — duel an AI opponent with a randomly chosen hero.
- **Pass & Play** — two players share one device, taking turns.
- **Online** — simulated matchmaking (currently routes to AI).

## Heroes

Six champions: **Barbarian**, **Moon Elf**, **Pyromancer**, **Shadow Thief**, **Monk**, **Paladin**. Each has a unique kit of dice-combo abilities — pairs, straights, full houses, and the legendary five-of-a-kind.

## Rules in brief

1. Roll 5 dice. You may keep any and re-roll up to 3 times per turn.
2. Combos light up matching abilities — tap one to unleash it.
3. Defenders auto-roll three guard dice; each `4+` blocks 1 damage.
4. Status effects: 🔥 Burn, ☠ Poison, 🛡 Guard, ⚡ Charge, 💨 Dodge, 🎯 Mark.
5. First to drop their foe to 0 HP claims the throne.

## Files

```
index.html        Layout + screens
css/styles.css    Mobile-first AAA visual styling
js/audio.js       Web Audio API procedural SFX
js/heroes.js      Hero & ability data
js/dice.js        Dice rolling + combo detection
js/ai.js          AI opponent strategy
js/ui.js          DOM rendering helpers
js/main.js        Game controller (turn loop, combat resolution)
```
