const UI = {
  popups: [],   // {x, y, text, color, age}

  reset() {
    this.popups = [];
  },

  addPopup(x, y, text, color) {
    this.popups.push({ x, y, text, color, age: 0 });
  },

  update(dt) {
    for (const p of this.popups) p.age += dt;
    this.popups = this.popups.filter(p => p.age < 1.4);
  },

  drawPopups(ctx) {
    for (const p of this.popups) {
      const t = p.age / 1.4;
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = p.color;
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y - 20 - t * 40);
      ctx.globalAlpha = 1;
    }
  },

  drawHUD(ctx, tanks, tm, chargePower) {
    const W = ctx.canvas.width;

    // score panels
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = tanks[0].color;
    ctx.fillText(`${tanks[0].name}  ${tanks[0].score}`, 16, 30);
    ctx.textAlign = 'right';
    ctx.fillStyle = tanks[1].color;
    ctx.fillText(`${tanks[1].score}  ${tanks[1].name}`, W - 16, 30);

    // round + turn indicator
    ctx.textAlign = 'center';
    ctx.fillStyle = '#eceff1';
    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.fillText(`Round ${Math.min(tm.round, tm.ROUNDS)} / ${tm.ROUNDS}`, W / 2, 26);
    if (tm.phase !== 'gameover') {
      const t = tanks[tm.current];
      ctx.fillStyle = t.color;
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText(`${t.name}'s turn`, W / 2, 48);
    }

    // player angle + power readout
    const player = tanks[0];
    ctx.textAlign = 'left';
    ctx.fillStyle = '#b0bec5';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText(`Angle ${Math.round(player.angle)}°`, 16, 54);

    // power bar while charging
    if (chargePower !== null) {
      const bw = 220, bh = 14, bx = W / 2 - bw / 2, by = ctx.canvas.height - 34;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#ffb74d';
      ctx.fillRect(bx, by, bw * (chargePower / 100), bh);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#eceff1';
      ctx.fillText(`Power ${Math.round(chargePower)}`, W / 2, by - 6);
    }

    // controls hint
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText('←/→ aim · hold SPACE to charge, release to fire · M mute', W / 2, ctx.canvas.height - 10);
  },

  drawEndScreen(ctx, tanks) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.fillStyle = 'rgba(10,12,18,0.78)';
    ctx.fillRect(0, 0, W, H);

    const [p, e] = tanks;
    let title, color;
    if (p.score > e.score) { title = 'YOU WIN!'; color = p.color; }
    else if (e.score > p.score) { title = 'CPU WINS'; color = e.color; }
    else { title = 'DRAW'; color = '#eceff1'; }

    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.font = 'bold 52px "Segoe UI", sans-serif';
    ctx.fillText(title, W / 2, H / 2 - 50);

    ctx.fillStyle = '#eceff1';
    ctx.font = '26px "Segoe UI", sans-serif';
    ctx.fillText(`${p.name} ${p.score}   —   ${e.score} ${e.name}`, W / 2, H / 2 + 8);

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.fillText('Press R to play again', W / 2, H / 2 + 64);
  },
};
