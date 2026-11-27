// Turkey Trot — the game loop, state machine and scoring. Wires the turkey,
// the farmer, the hazards, the world, the renderer, the input and the sound
// bank together. One update + one draw per animation frame, capped dt.
import { VIEW_W, GROUND_Y, GATE_X, SCORE } from './config.js';
import { World } from './world.js';
import { Turkey } from './turkey.js';
import { Farmer } from './farmer.js';
import { Hazards } from './hazards.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { applyShot } from './shots.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.world = new World(1);
    this.turkey = new Turkey(this.world);
    this.farmer = new Farmer(this.world);
    this.hazards = new Hazards(this.world, 7);
    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas);
    this.sounds = new SoundBank();
    this.input.onFirstGesture = () => this.sounds.unlock();
    this.state = 'title'; // title | playing | paused | caught | escaped
    this.time = 0; // total wall-clock seconds since load (drives animation)
    this.elapsed = 0; // seconds of the current run
    this.cameraX = 0;
    this.shotMode = false;
    this.stats = { corn: 0, pie: 0, feather: 0 };
    this._raf = 0;
    this._last = 0;
    this._escapeAt = 0;
  }

  start() {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) {
      const seed = Number(params.get('seed') || '1');
      applyShot(this, shot, seed);
      // One deterministic frame, then stop: the screenshot must not move.
      this.update(0.016);
      this.renderer.draw(this);
      return;
    }
    this._last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - this._last) / 1000);
      this._last = now;
      this.update(dt);
      this.renderer.draw(this);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  resetRun() {
    this.world = new World(1);
    this.turkey = new Turkey(this.world);
    this.farmer = new Farmer(this.world);
    this.hazards = new Hazards(this.world, 7);
    this.elapsed = 0;
    this.cameraX = 0;
    this.stats = { corn: 0, pie: 0, feather: 0 };
    this.state = 'playing';
    this.sounds.gobble();
    this.sounds.startMusic();
  }

  update(dt) {
    this.time += dt;
    const input = this.input;
    // Global keys work on every screen.
    if (input.mutePressed) {
      this.sounds.setMuted(!this.sounds.muted);
    }
    if (this.state === 'title') {
      if (input.startPressed || input.mouseDown) {
        this.sounds.unlock();
        this.resetRun();
      }
      this.input.endFrame();
      return;
    }
    if (this.state === 'paused') {
      if (input.pausePressed || input.startPressed) this.state = 'playing';
      if (input.restartPressed) this.resetRun();
      this.input.endFrame();
      return;
    }
    if (this.state === 'caught' || this.state === 'escaped') {
      if (input.restartPressed || input.startPressed) this.resetRun();
      this.input.endFrame();
      return;
    }
    // Playing.
    if (input.pausePressed) {
      this.state = 'paused';
      this.input.endFrame();
      return;
    }
    if (input.restartPressed) {
      this.resetRun();
      this.input.endFrame();
      return;
    }
    this.elapsed += dt;
    const turkey = this.turkey;
    const farmer = this.farmer;

    turkey.update(dt, input, this.sounds);
    farmer.update(dt, turkey, this.sounds);
    this.hazards.update(dt, turkey, this.time, this.sounds, farmer.x);

    // Hidden? Behind a hay bale from the farmer's side.
    turkey.hidden = this.world.hiddenByHay(turkey.x, farmer.x) && farmer.state !== 'chase';

    // Pickups.
    for (const p of this.world.pickups) {
      if (p.taken) continue;
      const dx = p.x - turkey.x;
      const dy = p.y - (turkey.y - 30);
      if (Math.abs(dx) < 34 && Math.abs(dy) < 52) {
        p.taken = true;
        turkey.collect(p.kind, this.sounds);
        if (p.kind === 'corn') this.stats.corn += 1;
        else if (p.kind === 'pie') this.stats.pie += 1;
        else this.stats.feather += 1;
      }
    }

    // Hazards.
    const blade = this.hazards.touchingTurkey(turkey);
    if (blade) {
      const killed = turkey.hurt(blade.x, this.sounds);
      if (killed) return this.endCaught();
      blade.state = 'stuck';
      blade.t = 0;
    }
    if (this.hazards.inOvenFlames(turkey, this.time)) {
      const killed = turkey.hurt(3120, this.sounds);
      if (killed) return this.endCaught();
    }
    if (turkey.dead) return this.endCaught();

    // The gate: escape!
    if (turkey.x >= GATE_X - 10 && !turkey.escaped) {
      turkey.escaped = true;
      turkey.score += SCORE.escapeBonus;
      const timeBonus = Math.max(0, SCORE.timeBonusMax - Math.max(0, this.elapsed - SCORE.timeBonusAfterSec) * 10);
      turkey.score += timeBonus;
      this.state = 'escaped';
      this.sounds.stopMusic();
      this.sounds.escaped();
      this.input.endFrame();
      return;
    }

    // Camera follows the turkey, clamped to the world.
    const target = Math.max(0, Math.min(3840 - VIEW_W, turkey.x - VIEW_W * 0.42));
    this.cameraX += (target - this.cameraX) * Math.min(1, dt * 6);
    this.input.endFrame();
  }

  endCaught() {
    this.state = 'caught';
    this.sounds.stopMusic();
    this.sounds.caught();
    this.input.endFrame();
  }
}

// Boot when the page loads.
const canvas = document.getElementById('game');
const game = new Game(canvas);
// A handle for automated play-testing (screenshots, input drills). Harmless
// in the shipped game: it only exposes the live game object.
window.__turkeyTrot = game;
game.start();
