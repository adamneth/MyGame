const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const MIN_POWER = 15;
const MAX_POWER = 100;
const CHARGE_RATE = 55;      // power per second while holding space
const ANGLE_RATE = 45;       // degrees per second while holding an arrow

let tanks = [];
let projectile = null;
let explosion = null;
let chargePower = null;      // null when not charging
let resolveTimer = 0;
let aiTimer = 0;
const keys = {};

function newGame() {
  Terrain.generate(W, H);
  tanks = [
    new Tank({ x: 120, color: '#4fc3f7', name: 'YOU', isAI: false }),
    new Tank({ x: W - 120, color: '#ef5350', name: 'CPU', isAI: true }),
  ];
  tanks[0].angle = 60;
  tanks[1].angle = 120;
  for (const t of tanks) t.settle();
  TurnManager.reset();
  UI.reset();
  projectile = null;
  explosion = null;
  chargePower = null;
}

function currentTank() { return tanks[TurnManager.current]; }
function playerCanAct() {
  return !currentTank().isAI &&
    (TurnManager.phase === 'aim' || TurnManager.phase === 'charging');
}

function fire(tank, power) {
  const m = tank.muzzle();
  projectile = new Projectile(m.x, m.y, tank.angle, power * POWER_TO_SPEED, TurnManager.current);
  TurnManager.phase = 'flight';
  AudioSys.fire();
}

function onImpact(ev) {
  projectile = null;
  explosion = new Explosion(ev.x, ev.y);

  if (ev.type !== 'offscreen') {
    Terrain.carveCrater(ev.x, ev.y, CRATER_RADIUS);
    AudioSys.explosion();
  }

  const shooter = tanks[TurnManager.current];
  if (ev.type === 'tank') {
    const pts = scoreForHit(ev.ratio);
    shooter.score += pts;
    UI.addPopup(ev.x, ev.y, `+${pts}`, '#ffd54f');
    AudioSys.hit(pts);
  } else {
    UI.addPopup(ev.x, Math.min(ev.y, H - 40), 'Miss', 'rgba(255,255,255,0.7)');
    AudioSys.miss();
  }

  TurnManager.phase = 'resolve';
  resolveTimer = 0.9;
}

function startNextTurn() {
  TurnManager.endShot();
  if (TurnManager.phase === 'gameover') {
    const [p, e] = tanks;
    AudioSys.jingle(p.score > e.score ? 'win' : e.score > p.score ? 'lose' : 'draw');
    return;
  }
  if (currentTank().isAI) aiTimer = 1.1;
}

// --- input ---
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  keys[e.code] = true;
  AudioSys.ensure();   // audio can only start after a user gesture

  if (e.code === 'Space') {
    e.preventDefault();
    if (playerCanAct() && TurnManager.phase === 'aim') {
      TurnManager.phase = 'charging';
      chargePower = MIN_POWER;
      AudioSys.startCharge();
    }
  }
  if (e.code === 'KeyM') {
    AudioSys.toggleMute();
  }
  if (e.code === 'KeyR' && TurnManager.phase === 'gameover') {
    newGame();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;

  if (e.code === 'Space' && TurnManager.phase === 'charging' && !currentTank().isAI) {
    AudioSys.stopCharge();
    fire(currentTank(), chargePower);
    chargePower = null;
  }
});

window.addEventListener('pointerdown', () => AudioSys.ensure());

const volSlider = document.getElementById('volume');
volSlider.addEventListener('input', () => {
  AudioSys.ensure();
  AudioSys.setVolume(volSlider.value / 100);
  volSlider.blur();   // keep arrow keys aiming the tank, not the slider
});

// --- game loop ---
function update(dt) {
  UI.update(dt);
  AudioSys.setIntensity(TurnManager.round);
  for (const t of tanks) t.settle();

  // arrow-key aiming (player only, while it's their turn)
  if (playerCanAct()) {
    const tank = currentTank();
    if (keys['ArrowLeft'])  tank.angle = Math.min(175, tank.angle + ANGLE_RATE * dt);
    if (keys['ArrowRight']) tank.angle = Math.max(5, tank.angle - ANGLE_RATE * dt);
  }

  switch (TurnManager.phase) {
    case 'aim':
      if (currentTank().isAI) {
        aiTimer -= dt;
        if (aiTimer <= 0) {
          const plan = AI.planShot(currentTank(), tanks[0]);
          currentTank().angle = plan.angle;
          fire(currentTank(), plan.power);
        }
      }
      break;

    case 'charging':
      chargePower = Math.min(MAX_POWER, chargePower + CHARGE_RATE * dt);
      AudioSys.setCharge(chargePower);
      break;

    case 'flight': {
      const ev = projectile.update(dt, tanks);
      if (ev) onImpact(ev);
      break;
    }

    case 'resolve':
      resolveTimer -= dt;
      if (resolveTimer <= 0 && !explosion) startNextTurn();
      break;
  }

  if (explosion && explosion.update(dt)) explosion = null;
}

function render() {
  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2b3a55');
  sky.addColorStop(1, '#4a5d7a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  Terrain.draw(ctx);
  for (let i = 0; i < tanks.length; i++) {
    tanks[i].draw(ctx, TurnManager.phase !== 'gameover' && i === TurnManager.current);
  }
  if (projectile) projectile.draw(ctx);
  if (explosion) explosion.draw(ctx);

  UI.drawPopups(ctx);
  UI.drawHUD(ctx, tanks, TurnManager, TurnManager.phase === 'charging' ? chargePower : null);
  if (TurnManager.phase === 'gameover') UI.drawEndScreen(ctx, tanks);
}

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

newGame();
requestAnimationFrame(frame);
