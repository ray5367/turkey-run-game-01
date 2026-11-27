// Turkey Trot — tuning, zones and palette. One place for every number the
// game balances on, so the loop in main.js stays readable.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 620;
export const WORLD_W = 3840;
export const GATE_X = 3720;

// Zones: the run crosses farmyard -> barn -> kitchen, then the forest gate.
export const ZONES = [
  { name: 'FARMYARD', from: 0, to: 1280, sky: ['#ffd98a', '#f7b95c'], ground: '#c98a3d', grass: '#7ba23f' },
  { name: 'BARN', from: 1280, to: 2560, sky: ['#e8a56b', '#c97e42'], ground: '#a4713a', grass: '#8a6a35' },
  { name: 'KITCHEN', from: 2560, to: 3840, sky: ['#f2c184', '#d99a55'], ground: '#b98a5a', grass: '#a08050' },
];

export const TURKEY = {
  runSpeed: 265,
  dashSpeed: 640,
  dashTime: 0.18,
  dashCooldown: 1.15,
  dashCost: 34,
  dashRegen: 26, // meter per second
  jumpVel: -640,
  gravity: 1750,
  width: 46,
  height: 58,
  hearts: 3,
};

export const FARMER = {
  patrolSpeed: 92,
  chaseSpeed: 238,
  lungeSpeed: 330,
  vision: 430,
  visionHalfAngle: 0.62, // radians either side of facing
  searchTime: 2.2,
  stumbleTime: 1.5,
  catchRadius: 40,
  // Chase speed multiplier per zone: the kitchen farmer is the fastest.
  zoneSpeed: [0.92, 1.05, 1.2],
  // First sighting takes this long to register: the farmer stops, stares,
  // then gives chase. It is the player's beat to react (or vault over him).
  suspiciousTime: 0.8,
};

export const KNIFE = {
  warnTime: 0.55, // telegraph before the blade drops
  fallSpeed: 950,
  spawnEvery: [3.4, 2.6, 2.0], // seconds, per zone
  stuckTime: 1.2, // a stuck blade stays dangerous this long
};

export const OVEN = {
  x: 3120, // oven door centre, kitchen zone
  burstEvery: 3.1,
  burstTime: 1.25,
  flameReach: 190, // flames lick this far out of the oven door
  flameHeight: 150,
};

export const SCORE = {
  corn: 50,
  pie: 150,
  feather: 250,
  distancePerPx: 0.1, // 1 point per 10 px travelled right
  escapeBonus: 1000,
  timeBonusMax: 500,
  timeBonusAfterSec: 45,
};

export const PALETTE = {
  turkeyBody: '#7a4a21',
  turkeyDark: '#5d3413',
  turkeyLight: '#a06a35',
  featherRed: '#c0392b',
  featherOrange: '#e67e22',
  featherGold: '#f1c40f',
  wattle: '#d21f3c',
  beak: '#f39c12',
  farmerShirt: '#b03a2e',
  farmerOveralls: '#2e5fa3',
  farmerSkin: '#f0c08a',
  farmerHat: '#d9b36c',
  hay: '#e3b93c',
  hayDark: '#b98f22',
  pumpkin: '#e67e22',
  pumpkinDark: '#c85a17',
  knifeBlade: '#dfe6ea',
  knifeHandle: '#4a2c14',
  ovenBody: '#5b6066',
  ovenDark: '#33373b',
  flameA: '#ffdd33',
  flameB: '#ff7b00',
  flameC: '#e63e00',
  hudPanel: 'rgba(43, 26, 14, 0.72)',
  hudText: '#ffe9b8',
  hudAccent: '#ffb347',
  alert: '#ff3b30',
  hidden: '#7ed957',
};
