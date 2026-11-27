// Turkey Trot — hazards: the carving knives that fall from above (always
// telegraphed first) and the kitchen oven's flame bursts. Both are checked
// against the turkey in main.js; this file only spawns and moves them.
import { KNIFE, OVEN, GROUND_Y } from './config.js';
import { makeRng, range } from './random.js';

export class Hazards {
  constructor(world, seed = 7) {
    this.world = world;
    this.rng = makeRng(seed);
    this.knives = []; // {x, y, vy, state, t}
    // The first blade waits: the opening seconds belong to the player.
    this.spawnTimer = 4.0;
  }

  reset() {
    this.knives = [];
    this.spawnTimer = 4.0;
  }

  update(dt, turkey, time, sounds, farmerX = -9999) {
    // A knife drops ahead of the turkey every few seconds, faster in the
    // later zones. Never while the turkey is invulnerable (no cheap
    // follow-up hit) and never right on top of the farmer.
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && !turkey.dead && !turkey.escaped && turkey.invulnLeft <= 0) {
      this.spawnTimer = KNIFE.spawnEvery[turkey.zone] * range(this.rng, 0.85, 1.2);
      const ahead = turkey.x + turkey.facing * range(this.rng, 280, 520);
      const x = Math.max(80, Math.min(3800, ahead));
      if (Math.abs(x - farmerX) > 320) {
        this.knives.push({ x, y: -40, vy: 0, state: 'warn', t: 0 });
        sounds.knifeWarn();
      }
    }
    for (const k of this.knives) {
      k.t += dt;
      if (k.state === 'warn' && k.t >= KNIFE.warnTime) {
        k.state = 'falling';
        k.y = 40;
        k.vy = KNIFE.fallSpeed;
      } else if (k.state === 'falling') {
        k.y += k.vy * dt;
        if (k.y >= GROUND_Y - 8) {
          k.y = GROUND_Y - 8;
          k.state = 'stuck';
          k.t = 0;
        }
      }
    }
    this.knives = this.knives.filter((k) => !(k.state === 'stuck' && k.t > KNIFE.stuckTime));
  }

  // Does a live blade (falling or stuck) touch the turkey? The blade spans
  // from its handle (k.y - 52) to its tip (k.y + 26); it only hurts when
  // that span overlaps the turkey's body (feet at turkey.y, 58 px tall).
  touchingTurkey(turkey) {
    for (const k of this.knives) {
      if (k.state === 'warn') continue;
      const bladeTop = k.y - 52;
      const bladeTip = k.y + 26;
      const turkeyTop = turkey.y - 58;
      const turkeyFeet = turkey.y;
      if (Math.abs(k.x - turkey.x) < 26 && bladeTip > turkeyTop && bladeTop < turkeyFeet) return k;
    }
    return null;
  }

  // Is the turkey inside the oven's flame burst?
  inOvenFlames(turkey, time) {
    const burst = this.world.ovenBurstAt(time);
    if (!burst.active) return false;
    const inX = turkey.x > OVEN.x - 30 && turkey.x < OVEN.x + OVEN.flameReach;
    const inY = turkey.y > GROUND_Y - OVEN.flameHeight;
    return inX && inY;
  }
}
