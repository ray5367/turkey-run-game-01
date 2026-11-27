// Turkey Trot — Burt the farmer. He patrols his farm, and when his vision
// cone catches the turkey he gives chase; lose him behind a hay bale and he
// searches where he last saw you. If you are cornered against a fence or the
// gate, he lunges.
import { FARMER, GROUND_Y, WORLD_W } from './config.js';

export class Farmer {
  constructor(world) {
    this.world = world;
    // He starts far ahead, facing away: the opening is a near-miss, not a
    // face-plant. The turkey slips past him before he turns around.
    this.reset(1050);
  }

  reset(x) {
    this.x = x;
    this.y = GROUND_Y;
    this.dir = 1; // patrols right at first
    this.state = 'patrol'; // patrol | suspicious | chase | search | stumble
    this.stateTime = 0;
    this.lastSeenX = x;
    this.lungeCooldown = 0;
    this.patrolMin = 420;
    this.patrolMax = 1080;
    this.walkPhase = 0;
  }

  get zone() {
    return this.world.zoneAt(this.x);
  }

  get chaseSpeed() {
    return FARMER.chaseSpeed * FARMER.zoneSpeed[this.zone];
  }

  // Can the farmer see the turkey? In front of him, inside his vision
  // range and cone, not hidden behind a hay bale.
  canSee(turkey) {
    const dx = turkey.x - this.x;
    const dy = turkey.y - this.y;
    if (Math.abs(dx) > FARMER.vision) return false;
    if (dx * this.dir <= 0 && Math.abs(dx) > 60) return false; // behind him
    if (Math.abs(dy) > 170) return false;
    const angle = Math.abs(Math.atan2(dy, dx * this.dir));
    if (angle > FARMER.visionHalfAngle && Math.abs(dx) > 90) return false;
    if (this.world.hiddenByHay(turkey.x, this.x)) return false;
    return true;
  }

  update(dt, turkey, sounds) {
    this.stateTime += dt;
    if (this.lungeCooldown > 0) this.lungeCooldown -= dt;
    const speed = this.state === 'chase' ? this.chaseSpeed : FARMER.patrolSpeed;

    if (this.state === 'stumble') {
      if (this.stateTime >= FARMER.stumbleTime) this.setState('search');
      return;
    }

    const sees = !turkey.dead && !turkey.escaped && this.canSee(turkey);
    if (sees) {
      this.lastSeenX = turkey.x;
      if (this.state === 'patrol' || this.state === 'search') {
        // First sighting: he stops and stares for a beat before the chase.
        this.setState('suspicious');
      } else if (this.state === 'suspicious' && this.stateTime >= FARMER.suspiciousTime) {
        this.setState('chase');
        sounds.alarm();
      }
    }

    if (this.state === 'chase') {
      const dx = turkey.x - this.x;
      this.dir = dx >= 0 ? 1 : -1;
      // Cornered: the turkey is pinned between the farmer and a fence or
      // the world edge — lunge to close the gap.
      const pinned = (turkey.x < 120 && dx < 0) || (turkey.x > WORLD_W - 160 && dx > 0);
      let v = speed;
      if (pinned && this.lungeCooldown <= 0 && Math.abs(dx) < 260) {
        v = FARMER.lungeSpeed;
        this.lungeCooldown = 2.5;
      }
      this.x += Math.sign(dx) * v * dt;
      this.walkPhase += dt * v * 0.05;
      if (!sees) {
        // Lost sight for a while: give up the chase and search.
        if (this.stateTime > 2.6) this.setState('search');
      } else {
        this.stateTime = Math.min(this.stateTime, 2.6);
      }
      // Caught the turkey: he trips, the turkey gets knocked away.
      if (Math.abs(turkey.x - this.x) < FARMER.catchRadius && Math.abs(turkey.y - this.y) < 90) {
        const killed = turkey.hurt(this.x, sounds);
        if (!killed) {
          this.setState('stumble');
        }
      }
    } else if (this.state === 'search') {
      const dx = this.lastSeenX - this.x;
      if (Math.abs(dx) > 12) {
        this.dir = dx >= 0 ? 1 : -1;
        this.x += this.dir * FARMER.patrolSpeed * 1.4 * dt;
        this.walkPhase += dt * 6;
      } else if (this.stateTime > FARMER.searchTime) {
        this.setState('patrol');
      }
    } else if (this.state === 'suspicious') {
      // He stops dead and stares at the turkey. If the turkey slips out of
      // sight, he shrugs it off and goes back to his patrol.
      this.dir = turkey.x >= this.x ? 1 : -1;
      if (!sees && this.stateTime > FARMER.suspiciousTime) this.setState('patrol');
    } else {
      // Patrol: walk his beat, turning at its ends. The beat follows the
      // turkey's zone so he is never far from the action.
      const zone = this.world.zoneAt(Math.max(0, Math.min(WORLD_W - 1, turkey.x)));
      const from = [0, 1280, 2560][zone];
      const to = [1280, 2560, 3840][zone];
      this.patrolMin = from + 60;
      this.patrolMax = to - 60;
      this.x += this.dir * FARMER.patrolSpeed * dt;
      this.walkPhase += dt * 5;
      if (this.x <= this.patrolMin) {
        this.x = this.patrolMin;
        this.dir = 1;
      } else if (this.x >= this.patrolMax) {
        this.x = this.patrolMax;
        this.dir = -1;
      }
    }
    this.x = Math.max(30, Math.min(WORLD_W - 30, this.x));
  }

  setState(s) {
    this.state = s;
    this.stateTime = 0;
  }

  // The HUD reads this: is the turkey spotted right now?
  get alerting() {
    return this.state === 'chase';
  }
}
