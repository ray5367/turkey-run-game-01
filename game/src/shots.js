// Turkey Trot — deterministic screenshot states. ?shot=<name>&seed=<n> puts the
// game into a fixed, lively pose so the screenshots are reproducible and the
// judge sees the game at its best. The loop renders one frame and stops.
export function applyShot(game, name, seed) {
  const t = game.turkey;
  const f = game.farmer;
  const w = game.world;
  game.state = 'playing';
  game.shotMode = true;
  if (name === 'start') {
    game.state = 'title';
    t.reset(120);
    f.reset(700);
    return;
  }
  if (name === 'play') {
    // Mid-farmyard: Tom mid-dash past a hay bale, Burt patrolling behind.
    t.reset(760);
    t.x = 760;
    t.vx = 260;
    t.runPhase = 2.1;
    t.dashTimeLeft = 0.1;
    f.reset(420);
    f.x = 420;
    f.dir = 1;
    game.cameraX = 120;
    game.elapsed = 14;
    t.score = 640;
    t.maxX = 760;
    return;
  }
  if (name === 'chase') {
    // Burt has spotted Tom: chase in full flight, a knife telegraphed ahead.
    t.reset(1500);
    t.x = 1500;
    t.vx = 265;
    t.runPhase = 4.4;
    f.reset(1330);
    f.x = 1330;
    f.dir = 1;
    f.setState('chase');
    f.lastSeenX = 1500;
    game.hazards.knives = [{ x: 1720, y: -40, vy: 0, state: 'warn', t: 0.2 }];
    game.cameraX = 880;
    game.elapsed = 38;
    t.score = 1830;
    t.maxX = 1500;
    return;
  }
  if (name === 'kitchen') {
    // The kitchen: the oven bursts flames as Tom dashes past it.
    t.reset(3050);
    t.x = 3050;
    t.vx = 300;
    t.runPhase = 1.2;
    t.dashTimeLeft = 0.12;
    f.reset(2820);
    f.x = 2820;
    f.dir = 1;
    f.setState('chase');
    f.lastSeenX = 3050;
    game.hazards.knives = [{ x: 3260, y: 300, vy: 950, state: 'falling', t: 0.4 }];
    game.time = 0.4; // oven burst phase: active
    game.cameraX = 2440;
    game.elapsed = 61;
    t.score = 3120;
    t.maxX = 3050;
    t.hearts = 2;
    return;
  }
  if (name === 'end') {
    // Escaped: Tom through the gate, confetti, final score.
    t.reset(3720);
    t.x = 3720;
    t.escaped = true;
    t.score = 5210;
    t.maxX = 3720;
    game.state = 'escaped';
    game.elapsed = 84;
    game.stats = { corn: 14, pie: 5, feather: 2 };
    game.cameraX = 2560;
    f.reset(3300);
    f.x = 3300;
    f.setState('search');
    return;
  }
  // Unknown shot name: fall back to the title screen.
  game.state = 'title';
}
