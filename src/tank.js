const TANK_WIDTH = 44;
const TANK_HEIGHT = 16;
const TURRET_LENGTH = 24;

class Tank {
  constructor({ x, color, name, isAI }) {
    this.x = x;
    this.y = 0;             // ground level under the tank; body sits on top
    this.color = color;
    this.name = name;
    this.isAI = isAI;
    this.angle = 60;        // degrees, 0 = right, 90 = up, 180 = left
    this.score = 0;
  }

  settle() {
    this.y = Terrain.surfaceAt(this.x);
  }

  muzzle() {
    const rad = this.angle * Math.PI / 180;
    const px = this.x;
    const py = this.y - TANK_HEIGHT - 4;
    return {
      x: px + Math.cos(rad) * TURRET_LENGTH,
      y: py - Math.sin(rad) * TURRET_LENGTH,
    };
  }

  // Returns distance-from-center ratio (0 = dead center, 1 = edge of hitbox)
  // if (px, py) hits this tank, otherwise null.
  hitTest(px, py) {
    const half = TANK_WIDTH / 2;
    if (px < this.x - half || px > this.x + half) return null;
    if (py < this.y - TANK_HEIGHT - 14 || py > this.y + 4) return null;
    return Math.min(1, Math.abs(px - this.x) / half);
  }

  draw(ctx, isActive) {
    const bodyTop = this.y - TANK_HEIGHT;

    // turret
    const m = this.muzzle();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(this.x, bodyTop - 4);
    ctx.lineTo(m.x, m.y);
    ctx.stroke();

    // dome
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, bodyTop - 2, 9, Math.PI, 0);
    ctx.fill();

    // body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(this.x - TANK_WIDTH / 2, bodyTop, TANK_WIDTH, TANK_HEIGHT, 5);
    ctx.fill();

    // treads
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.roundRect(this.x - TANK_WIDTH / 2, this.y - 6, TANK_WIDTH, 6, 3);
    ctx.fill();

    // active-turn marker
    if (isActive) {
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath();
      ctx.moveTo(this.x, bodyTop - 30);
      ctx.lineTo(this.x - 7, bodyTop - 42);
      ctx.lineTo(this.x + 7, bodyTop - 42);
      ctx.closePath();
      ctx.fill();
    }
  }
}

// Hit-zone tiers from CLAUDE.md: center 100, near-center/off-side 70,
// outer ~10% graze 30.
function scoreForHit(ratio) {
  if (ratio <= 0.35) return 100;
  if (ratio <= 0.9) return 70;
  return 30;
}
