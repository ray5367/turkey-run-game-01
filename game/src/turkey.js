// Turkey Trot — the player. Tom the turkey: runs, jumps, dashes and hides.
// Physics are simple and forgiving on purpose: a narrow escape should feel
// earned, never cheap.
import { TURKEY, GROUND_Y, WORLD_W, SCORE } from './config.js';

export class Turkey {
  constructor(world) {
    this.world = world;
    this.reset(120);
  }

  reset(x) {
    this.x = x;
    this.y = GROUND_Y; // feet position
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = true;
    this.hearts = TURKEY.hearts;
    this.score = 0;
    this.maxX = x;
    this.dashMeter = 100;
    this.dashTimeLeft = 0;
    this.dashCooldownLeft = 0;
    this.invulnLeft = 0;
    this.runPhase = 0; // leg cycle, for the run animation
    this.dead = false;
    this.escaped = false;
    this.hidden = false;
  }

  get zone() {
    return this.world.zoneAt(this.x);
  }

  update(dt, input, sounds) {
    if (this.dead || this.escaped) return;
    const accel = 2600;
    let move = 0;
    if (input.left) move -= 1;
    if (input.right) move += 1;

    // Dash: a burst toward the facing direction (or toward the mouse
    // click), with a short cooldown and a meter that refills over time.
    if (input.dashPressed && this.dashCooldownLeft <= 0 && this.dashMeter >= TURKEY.dashCost) {
      this.dashTimeLeft = TURKEY.dashTime;
      this.dashCooldownLeft = TURKEY.dashCooldown;
      this.dashMeter -= TURKEY.dashCost;
      if (input.mouseDown) this.facing = input.mouseX + 0 >= 640 ? 1 : -1;
      sounds.dash();
    }
    if (this.dashTimeLeft > 0) {
      this.dashTimeLeft -= dt;
      this.vx = this.facing * TURKEY.dashSpeed;
    } else {
      const target = move * TURKEY.runSpeed;
      const rate = this.onGround ? accel : accel * 0.55;
      if (this.vx < target) this.vx = Math.min(target, this.vx + rate * dt);
      else if (this.vx > target) this.vx = Math.max(target, this.vx - rate * dt);
      if (move !== 0) this.facing = move;
    }

    if (input.jumpPressed && this.onGround) {
      this.vy = TURKEY.jumpVel;
      this.onGround = false;
      sounds.jump();
    }

    this.vy += TURKEY.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = Math.max(24, Math.min(WORLD_W - 24, this.x));

    // Land on the ground or on top of a bale / table / pumpkin.
    const floor = this.world.standHeightAt(this.x);
    if (this.y >= floor) {
      if (!this.onGround && this.vy > 500) {
        // A hard landing puffs a little dust (render reads vy through landDust).
        this.landDust = 0.25;
      }
      this.y = floor;
      this.vy = 0;
      this.onGround = true;
    } else if (this.y < floor - 4) {
      this.onGround = false;
    }
    if (this.landDust > 0) this.landDust -= dt;

    // Fences block the run: you must jump them.
    for (const f of this.world.fences) {
      const top = GROUND_Y - f.h;
      if (this.x + 18 > f.x && this.x - 18 < f.x + f.w && this.y > top + 6 && this.y - TURKEY.height < GROUND_Y) {
        if (this.vx > 0) this.x = f.x - 18;
        else if (this.vx < 0) this.x = f.x + f.w + 18;
        this.vx = 0;
      }
    }

    // Distance score: only rightward progress counts.
    if (this.x > this.maxX) {
      this.score += (this.x - this.maxX) * SCORE.distancePerPx;
      this.maxX = this.x;
    }

    this.dashMeter = Math.min(100, this.dashMeter + TURKEY.dashRegen * dt);
    if (this.dashCooldownLeft > 0) this.dashCooldownLeft -= dt;
    if (this.invulnLeft > 0) this.invulnLeft -= dt;
    if (Math.abs(this.vx) > 20 && this.onGround) this.runPhase += dt * Math.abs(this.vx) * 0.045;
  }

  // A hazard hit: lose a heart, get knocked back, brief invulnerability.
  hurt(fromX, sounds) {
    if (this.invulnLeft > 0 || this.dead) return false;
    this.hearts -= 1;
    this.invulnLeft = 2.0;
    this.vx = this.x < fromX ? -320 : 320;
    this.vy = -260;
    this.onGround = false;
    sounds.hurt();
    if (this.hearts <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }

  collect(kind, sounds) {
    if (kind === 'corn') this.score += SCORE.corn;
    else if (kind === 'pie') this.score += SCORE.pie;
    else if (kind === 'feather') this.score += SCORE.feather;
    sounds.pickup(kind);
  }
}
