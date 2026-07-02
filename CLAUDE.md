# Project: TankBeef (formerly "Tactical Tank Battle")

## About This Project
A 1v1 turn-based tank artillery game, inspired by *Pocket Tanks*. Simple, clean
visual style — nostalgic but running on modern web tech. Built as a **prototype**
to validate the core loop before deciding on scope for a bigger version.

Stack: **Plain HTML5 Canvas + vanilla JavaScript**. No framework, no build step.
Chosen for fast iteration and zero engine lock-in — if the project grows later
(mobile wrapper, multiplayer, more VFX), nothing here needs to be unwound.

---

## Core Loop
1. Two tanks spawn on procedurally generated terrain, one on the left, one on
   the right of the screen.
2. Terrain is destructible — a heightmap that craters on impact.
3. Players alternate turns: set angle + power, fire, projectile resolves
   (gravity arc), then control passes to the other tank.
4. **1 round = both tanks have fired once.** Game is **10 rounds** (20 shots
   total, 10 per tank).
5. Both tanks always survive all 10 rounds — no elimination, no health bar.
   Winner = **higher total score after round 10**. Tie is possible (v1: display
   as a draw, no tiebreaker needed yet).

## Scoring
Points awarded per confirmed hit, based on where on the tank the shot lands:
| Hit zone | Points |
|---|---|
| Center of tank | 100 |
| Near-center / off to the side | 70 |
| Grazes outer ~10% of the tank's hitbox | 30 |
| Miss (terrain or no contact) | 0 |

Implementation note: model the tank hitbox as a horizontal span; on impact,
compute distance from tank center as a % of half-width, then bucket into the
three tiers above.

## Controls (v1)
Classic Pocket Tanks scheme:
- Arrow keys (left/right) adjust **angle**
- Hold spacebar to charge **power**, release to fire
- No mouse-drag aiming in v1

## Opponent (v1 build order)
- **Phase 1: AI opponent.** Doesn't need to be smart — compute angle/power from
  basic projectile-motion math targeting the enemy x-position, inject
  randomness/error so it's beatable. Tune accuracy after core loop feels good.
- **Phase 2: Local 2-player hot-seat** (same keyboard, alternating control) —
  add once the single-player loop is solid.
- Online multiplayer explicitly **out of scope** for this prototype.

## Weapons (v1 scope)
Just **one basic projectile type** — prove the core loop (aim, fire, terrain
destruction, scoring, turn passing) before adding weapon variety. Multiple
weapons (big shell, cluster, digger, etc.) are a **post-prototype** feature.

---

## Systems Breakdown

### Terrain
- Heightmap: array of column heights across screen width.
- Randomized per map load — layered sine waves and/or midpoint displacement
  for varied but reasonable (non-degenerate) hills.
- Rendered each frame from the heightmap array.
- Destruction: on projectile impact, subtract a crater radius from affected
  columns, redraw.

### Tank
- Position: x is fixed at spawn side, y follows terrain height at that x.
- State: angle, power, turret rendering, alive (always true in v1 — no death
  state needed since there's no health system).

### Projectile / Physics
- Simple gravity-arc simulation. No wind in v1 (candidate for later — flagged
  as a future addition, not a v1 requirement).
- Per-frame collision check against: (a) terrain heightmap, (b) opposing
  tank's hitbox.
- On terrain hit: trigger crater/destruction.
- On tank hit: compute hit-zone tier, award points, trigger crater too (shots
  that hit the tank should still deform nearby terrain for visual consistency).

### Turn Manager
- Enforces strict alternation (Player/AI → other → …).
- Locks input while a shot is in flight / resolving.
- Increments round counter after both sides have fired once.
- Ends game after round 10, triggers score comparison → win/lose/draw screen.

### AI (Phase 1)
- Estimate required angle/power via simplified projectile-motion formula
  aimed at opponent's current x.
- Add randomized error margin so it's beatable, not perfect.
- Refine accuracy/behavior in a later pass once core loop is validated.

### UI / Scoring Display
- Live score for both sides.
- Round counter (e.g. "Round 3 / 10").
- Turn indicator (whose turn it is).
- End-of-game screen: final scores, winner (or draw).

---

## Explicit Non-Goals for v1
- No health/elimination system — pure points model only.
- No wind physics.
- No multiple weapon types.
- No online multiplayer.
- No mouse-drag aiming (arrow keys + power bar only).

These are natural "phase 2+" candidates once the core loop is proven, but
should **not** be built into the initial prototype — keep scope tight.

---

## Suggested Build Order (for Claude Code)
1. Canvas setup + render loop skeleton.
2. Terrain generation (static first, then randomize).
3. Tank rendering, positioned correctly on terrain.
4. Aiming input (angle/power via arrow keys + spacebar charge).
5. Projectile physics + terrain collision + crater destruction.
6. Tank hit detection + hit-zone scoring tiers.
7. Turn manager (alternation, round counting, input locking).
8. Basic AI opponent.
9. UI: score display, round counter, turn indicator, end screen.
10. Polish pass: visual style (clean/nostalgic), juice (impact feedback, etc.)

## Suggested File Structure
```
/tank-battle
  index.html
  /src
    terrain.js
    tank.js
    projectile.js
    turnManager.js
    ai.js
    ui.js
    main.js       (game loop, wiring everything together)
  /assets         (if/when sprites are added — v1 can use primitive shapes)
```

---

## How to Use This Doc
Drop this file into your project root as `CLAUDE.md` before starting a Claude
Code session. It will be read automatically at the start of every session —
no need to re-paste this context into chat.
