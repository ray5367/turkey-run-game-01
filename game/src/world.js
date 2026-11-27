// Turkey Trot — the world: three zones (farmyard, barn, kitchen), the forest
// gate at the far end, and everything the turkey runs past, jumps over or
// hides behind. Layout is seeded so a screenshot seed rebuilds the same farm.
import { ZONES, GATE_X, GROUND_Y, OVEN } from './config.js';
import { makeRng, range } from './random.js';

export class World {
  constructor(seed = 1) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.fences = []; // {x, w, h} — jump over them
    this.hay = []; // {x, w, h} — hide behind them (blocks the farmer's sight)
    this.pumpkins = []; // {x, r} — decoration you can hop on
    this.pickups = []; // {x, y, kind, taken, bob}
    this.tables = []; // kitchen tables {x, w, h}
    this.clouds = [];
    this.trees = [];
    this.build();
  }

  zoneAt(x) {
    for (let i = 0; i < ZONES.length; i++) {
      if (x >= ZONES[i].from && x < ZONES[i].to) return i;
    }
    return ZONES.length - 1;
  }

  build() {
    const rng = this.rng;
    // Fences: a low one in each zone, plus one guarding the gate.
    this.fences = [
      { x: 620, w: 26, h: 74 },
      { x: 1480, w: 26, h: 74 },
      { x: 2260, w: 26, h: 74 },
      { x: 2980, w: 26, h: 74 },
      { x: 3560, w: 26, h: 74 },
    ];
    // Hay bales: the turkey's cover. Stand behind one and the farmer's
    // vision cone stops at the bale.
    this.hay = [
      { x: 430, w: 92, h: 84 },
      { x: 980, w: 92, h: 84 },
      { x: 1700, w: 92, h: 84 },
      { x: 2140, w: 92, h: 84 },
      { x: 2760, w: 92, h: 84 },
      { x: 3380, w: 92, h: 84 },
    ];
    // Pumpkins scattered as hop-able decoration.
    this.pumpkins = [];
    for (let i = 0; i < 14; i++) {
      this.pumpkins.push({ x: 180 + i * 260 + range(rng, -40, 40), r: range(rng, 22, 34) });
    }
    // Kitchen tables with hanging pots above them.
    this.tables = [
      { x: 2680, w: 150, h: 96 },
      { x: 3300, w: 150, h: 96 },
    ];
    // Pickups: corn trails along the ground, pie slices up on hay bales,
    // one golden feather high above the barn.
    this.pickups = [];
    const cornXs = [300, 380, 760, 840, 1180, 1260, 1620, 1700, 2060, 2140, 2500, 2580, 2900, 3220, 3480, 3640];
    for (const x of cornXs) this.pickups.push({ x, y: GROUND_Y - 42, kind: 'corn', taken: false, bob: range(rng, 0, 6.28) });
    for (const bale of this.hay) {
      this.pickups.push({ x: bale.x + bale.w / 2, y: GROUND_Y - bale.h - 46, kind: 'pie', taken: false, bob: range(rng, 0, 6.28) });
    }
    this.pickups.push({ x: 1900, y: GROUND_Y - 260, kind: 'feather', taken: false, bob: 0 });
    this.pickups.push({ x: 3450, y: GROUND_Y - 240, kind: 'feather', taken: false, bob: 1.2 });
    // Sky dressing: clouds and distant trees, placed by the same seed.
    this.clouds = [];
    for (let i = 0; i < 9; i++) {
      this.clouds.push({ x: range(rng, 0, 3840), y: range(rng, 50, 190), s: range(rng, 0.7, 1.5) });
    }
    this.trees = [];
    for (let i = 0; i < 12; i++) {
      this.trees.push({ x: range(rng, 60, 3780), s: range(rng, 0.8, 1.4), kind: i % 3 === 0 ? 'pine' : 'oak' });
    }
  }

  // Ground height at x: flat everywhere except the tops of things you can
  // stand on (hay bales, tables, pumpkins).
  standHeightAt(x) {
    let top = GROUND_Y;
    for (const b of this.hay) {
      if (x >= b.x && x <= b.x + b.w) top = Math.min(top, GROUND_Y - b.h);
    }
    for (const t of this.tables) {
      if (x >= t.x && x <= t.x + t.w) top = Math.min(top, GROUND_Y - t.h);
    }
    for (const p of this.pumpkins) {
      if (Math.abs(x - p.x) < p.r * 0.8) top = Math.min(top, GROUND_Y - p.r * 1.1);
    }
    return top;
  }

  // Is the turkey hidden? Standing behind a hay bale (between the farmer
  // and the bale, within 30 px of it) breaks the farmer's line of sight.
  hiddenByHay(turkeyX, farmerX) {
    for (const b of this.hay) {
      const baleMid = b.x + b.w / 2;
      if (farmerX < baleMid && turkeyX > baleMid - 14 && turkeyX < b.x + b.w + 26) return true;
      if (farmerX > baleMid && turkeyX < baleMid + 14 && turkeyX > b.x - 26) return true;
    }
    return false;
  }

  // The oven's flame burst state: bursts every OVEN.burstEvery seconds.
  ovenBurstAt(time) {
    const phase = time % OVEN.burstEvery;
    return { active: phase < OVEN.burstTime, phase };
  }

  gate() {
    return { x: GATE_X, y: GROUND_Y };
  }
}
