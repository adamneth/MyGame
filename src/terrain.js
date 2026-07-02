// Terrain: destructible heightmap. surface[x] = y coordinate of the ground
// surface at pixel column x (smaller y = higher ground).
const Terrain = {
  width: 0,
  height: 0,
  surface: null,

  generate(width, height) {
    this.width = width;
    this.height = height;
    this.surface = new Float32Array(width);

    const base = height * (0.6 + Math.random() * 0.12);
    const layers = [];
    for (let i = 1; i <= 4; i++) {
      layers.push({
        amp: (height * 0.14) / i * (0.5 + Math.random()),
        freq: (Math.PI * 2 / width) * i * (0.6 + Math.random() * 0.9),
        phase: Math.random() * Math.PI * 2,
      });
    }

    const minY = height * 0.30;
    const maxY = height * 0.92;
    for (let x = 0; x < width; x++) {
      let y = base;
      for (const l of layers) y -= l.amp * Math.sin(l.freq * x + l.phase);
      this.surface[x] = Math.min(maxY, Math.max(minY, y));
    }
  },

  surfaceAt(x) {
    const i = Math.min(this.width - 1, Math.max(0, Math.round(x)));
    return this.surface[i];
  },

  // Remove a hemispherical bite of ground centered on (cx, cy).
  carveCrater(cx, cy, radius) {
    const from = Math.max(0, Math.floor(cx - radius));
    const to = Math.min(this.width - 1, Math.ceil(cx + radius));
    for (let x = from; x <= to; x++) {
      const dx = x - cx;
      const half = Math.sqrt(radius * radius - dx * dx);
      const craterBottom = cy + half;
      if (craterBottom > this.surface[x]) {
        this.surface[x] = Math.min(this.height, craterBottom);
      }
    }
  },

  draw(ctx) {
    ctx.fillStyle = '#5d4a36';
    ctx.beginPath();
    ctx.moveTo(0, this.height);
    for (let x = 0; x < this.width; x++) ctx.lineTo(x, this.surface[x]);
    ctx.lineTo(this.width - 1, this.height);
    ctx.closePath();
    ctx.fill();

    // grassy top edge
    ctx.strokeStyle = '#7aa84f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, this.surface[0]);
    for (let x = 1; x < this.width; x++) ctx.lineTo(x, this.surface[x]);
    ctx.stroke();
  },
};
