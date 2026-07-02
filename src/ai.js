// Phase 1 AI: solve flat-ground projectile motion for the target's x,
// then add error so it's beatable. Height difference is ignored, which
// adds natural inaccuracy on hilly maps.
const AI = {
  planShot(tank, target) {
    const dx = target.x - tank.x;
    const dir = Math.sign(dx);
    const dist = Math.abs(dx);

    let theta = 40 + Math.random() * 25;                 // elevation, deg
    let speed = Math.sqrt(GRAVITY * dist / Math.sin(2 * theta * Math.PI / 180));

    // error injection: +-8% speed, +-3 degrees
    speed *= 1 + (Math.random() * 2 - 1) * 0.08;
    theta += (Math.random() * 2 - 1) * 3;

    const power = Math.min(100, Math.max(15, speed / POWER_TO_SPEED));
    const angle = dir > 0 ? theta : 180 - theta;
    return { angle, power };
  },
};
