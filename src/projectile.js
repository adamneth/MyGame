const GRAVITY = 350;          // px/s^2
const CRATER_RADIUS = 30;
const POWER_TO_SPEED = 7.5;   // muzzle speed = power (10..100) * this

class Projectile {
  constructor(x, y, angleDeg, speed, shooterIndex) {
    const rad = angleDeg * Math.PI / 180;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(rad) * speed;
    this.vy = -Math.sin(rad) * speed;
    this.shooterIndex = shooterIndex;
    this.trail = [];
    this.age = 0;
  }

  // Advances the projectile; returns an impact event or null while in flight.
  // Events: {type:'terrain'|'tank'|'offscreen', x, y, ratio?}
  update(dt, tanks) {
    this.age += dt;
    if (this.age > 15) return { type: 'offscreen', x: this.x, y: this.y };

    const target = tanks[1 - this.shooterIndex];

    // substep so fast shots can't tunnel through terrain or the tank
    const steps = Math.max(1, Math.ceil((Math.abs(this.vx) + Math.abs(this.vy)) * dt / 4));
    const sdt = dt / steps;
    for (let i = 0; i < steps; i++) {
      this.vy += GRAVITY * sdt;
      this.x += this.vx * sdt;
      this.y += this.vy * sdt;

      const ratio = target.hitTest(this.x, this.y);
      if (ratio !== null) return { type: 'tank', x: this.x, y: this.y, ratio };

      if (this.y >= Terrain.surfaceAt(this.x)) {
        return { type: 'terrain', x: this.x, y: this.y };
      }

      if (this.x < -60 || this.x > Terrain.width + 60 || this.y > Terrain.height + 60) {
        return { type: 'offscreen', x: this.x, y: this.y };
      }
    }

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 40) this.trail.shift();
    return null;
  }

  draw(ctx) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.age = 0;
    this.duration = 0.6;
  }

  update(dt) {
    this.age += dt;
    return this.age >= this.duration;
  }

  draw(ctx) {
    const t = this.age / this.duration;
    const r = CRATER_RADIUS * (0.4 + t * 1.1);
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = '#ffb74d';
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff176';
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
