// Turkey Trot — every pixel the game shows. All art is drawn in code on a
// 1280x720 canvas: the turkey, the farmer, the farmyard, barn and kitchen,
// the HUD and the title / caught / escaped screens. No image files at all,
// so the game loads with zero network requests.
import { VIEW_W, VIEW_H, GROUND_Y, WORLD_W, ZONES, PALETTE, TURKEY, FARMER, OVEN, GATE_X } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = '800', font = 'system-ui, sans-serif') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(game) {
    const { ctx } = this;
    const camX = game.cameraX;
    ctx.save();
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    this.drawSky(game, camX);
    ctx.save();
    ctx.translate(-camX, 0);
    this.drawDistant(game, camX);
    this.drawGround(game);
    this.drawGate(game);
    this.drawPickups(game);
    this.drawWorldProps(game);
    this.drawOven(game);
    this.drawKnives(game);
    this.drawFarmer(game);
    this.drawTurkey(game);
    ctx.restore();
    this.drawHUD(game);
    if (game.state === 'title') this.drawTitle(game);
    else if (game.state === 'paused') this.drawPaused(game);
    else if (game.state === 'caught') this.drawCaught(game);
    else if (game.state === 'escaped') this.drawEscaped(game);
    ctx.restore();
  }

  zoneAtX(x) {
    for (let i = 0; i < ZONES.length; i++) {
      if (x >= ZONES[i].from && x < ZONES[i].to) return ZONES[i];
    }
    return ZONES[ZONES.length - 1];
  }

  drawSky(game, camX) {
    const { ctx } = this;
    const zone = this.zoneAtX(camX + VIEW_W / 2);
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, zone.sky[0]);
    g.addColorStop(0.75, zone.sky[1]);
    g.addColorStop(1, '#e89a4e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Low autumn sun.
    ctx.fillStyle = '#fff3c4';
    ellipse(ctx, 1080 - camX * 0.02, 110, 46, 46);
    ctx.fillStyle = 'rgba(255, 243, 196, 0.35)';
    ellipse(ctx, 1080 - camX * 0.02, 110, 70, 70);
    // Drifting clouds.
    ctx.fillStyle = 'rgba(255, 250, 235, 0.85)';
    for (const c of game.world.clouds) {
      const sx = c.x - camX * 0.35;
      if (sx < -160 || sx > VIEW_W + 160) continue;
      ellipse(ctx, sx, c.y, 52 * c.s, 20 * c.s);
      ellipse(ctx, sx + 34 * c.s, c.y + 6, 38 * c.s, 16 * c.s);
      ellipse(ctx, sx - 36 * c.s, c.y + 8, 30 * c.s, 13 * c.s);
    }
  }

  drawDistant(game, camX) {
    const { ctx } = this;
    // Rolling hills.
    ctx.fillStyle = '#8fae4e';
    ctx.beginPath();
    ctx.moveTo(-100, GROUND_Y);
    for (let x = -100; x <= WORLD_W + 100; x += 80) {
      ctx.lineTo(x, GROUND_Y - 60 - Math.sin(x * 0.004) * 26);
    }
    ctx.lineTo(WORLD_W + 100, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    // Trees: oaks with autumn crowns, pines at the forest edge.
    for (const t of game.world.trees) {
      if (t.x < camX - 120 || t.x > camX + VIEW_W + 120) continue;
      if (t.kind === 'pine') {
        ctx.fillStyle = '#3f6b2f';
        ctx.beginPath();
        ctx.moveTo(t.x, GROUND_Y - 190 * t.s);
        ctx.lineTo(t.x - 42 * t.s, GROUND_Y - 60);
        ctx.lineTo(t.x + 42 * t.s, GROUND_Y - 60);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(t.x - 7 * t.s, GROUND_Y - 62, 14 * t.s, 62);
      } else {
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(t.x - 8 * t.s, GROUND_Y - 110 * t.s, 16 * t.s, 110 * t.s);
        ctx.fillStyle = t.x % 2 ? '#d98a2b' : '#c96a1e';
        ellipse(ctx, t.x, GROUND_Y - 130 * t.s, 52 * t.s, 40 * t.s);
        ellipse(ctx, t.x - 34 * t.s, GROUND_Y - 108 * t.s, 30 * t.s, 24 * t.s);
        ellipse(ctx, t.x + 34 * t.s, GROUND_Y - 108 * t.s, 30 * t.s, 24 * t.s);
      }
    }
    // The barn, big on the horizon of the middle zone.
    ctx.fillStyle = '#a33327';
    ctx.fillRect(1560, GROUND_Y - 210, 300, 210);
    ctx.fillStyle = '#7e241b';
    ctx.beginPath();
    ctx.moveTo(1540, GROUND_Y - 210);
    ctx.lineTo(1710, GROUND_Y - 300);
    ctx.lineTo(1880, GROUND_Y - 210);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f7e8c9';
    ctx.fillRect(1680, GROUND_Y - 120, 60, 120);
    ctx.strokeStyle = '#f7e8c9';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(1680, GROUND_Y - 120);
    ctx.lineTo(1740, GROUND_Y);
    ctx.moveTo(1740, GROUND_Y - 120);
    ctx.lineTo(1680, GROUND_Y);
    ctx.stroke();
  }

  drawGround(game) {
    const { ctx } = this;
    const zone = this.zoneAtX(game.cameraX + VIEW_W / 2);
    ctx.fillStyle = zone.ground;
    ctx.fillRect(-50, GROUND_Y, WORLD_W + 100, VIEW_H - GROUND_Y);
    ctx.fillStyle = zone.grass;
    ctx.fillRect(-50, GROUND_Y, WORLD_W + 100, 14);
    // Dirt speckles.
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    const camX = game.cameraX;
    for (let x = Math.floor(camX / 46) * 46; x < camX + VIEW_W + 46; x += 46) {
      ctx.fillRect(x + ((x * 7) % 23), GROUND_Y + 26 + ((x * 13) % 44), 10, 5);
    }
    // Zone boundary signs.
    text(ctx, 'FARMYARD', 90, GROUND_Y + 62, 22, 'rgba(255,233,184,0.55)', 'left');
    text(ctx, 'BARN', 1370, GROUND_Y + 62, 22, 'rgba(255,233,184,0.55)', 'left');
    text(ctx, 'KITCHEN', 2650, GROUND_Y + 62, 22, 'rgba(255,233,184,0.55)', 'left');
  }

  drawGate(game) {
    const { ctx } = this;
    // The forest gate: two posts, a green arch and a "FREEDOM" sign.
    ctx.fillStyle = '#4a2c14';
    ctx.fillRect(GATE_X - 8, GROUND_Y - 210, 16, 210);
    ctx.fillRect(GATE_X + 92, GROUND_Y - 210, 16, 210);
    ctx.fillStyle = '#2f7d32';
    ctx.beginPath();
    ctx.moveTo(GATE_X - 8, GROUND_Y - 210);
    ctx.quadraticCurveTo(GATE_X + 50, GROUND_Y - 280, GATE_X + 108, GROUND_Y - 210);
    ctx.lineTo(GATE_X + 108, GROUND_Y - 180);
    ctx.quadraticCurveTo(GATE_X + 50, GROUND_Y - 240, GATE_X - 8, GROUND_Y - 180);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff8e1';
    roundRect(ctx, GATE_X - 6, GROUND_Y - 268, 116, 40, 8);
    ctx.fill();
    text(ctx, 'FREEDOM', GATE_X + 52, GROUND_Y - 241, 20, '#2f7d32', 'center');
    // A pine forest behind the gate.
    ctx.fillStyle = '#2e5d27';
    for (let i = 0; i < 5; i++) {
      const px = GATE_X + 130 + i * 46;
      ctx.beginPath();
      ctx.moveTo(px, GROUND_Y - 230);
      ctx.lineTo(px - 30, GROUND_Y - 40);
      ctx.lineTo(px + 30, GROUND_Y - 40);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawPickups(game) {
    const { ctx } = this;
    const t = game.time;
    for (const p of game.world.pickups) {
      if (p.taken) continue;
      const bob = Math.sin(t * 3 + p.bob) * 5;
      const y = p.y + bob;
      if (p.kind === 'corn') {
        ctx.fillStyle = '#f7d54d';
        ellipse(ctx, p.x, y, 12, 20);
        ctx.fillStyle = '#e0a92e';
        for (let i = -1; i <= 1; i++) {
          ctx.fillRect(p.x - 8 + i * 6, y - 14, 2, 28);
        }
        ctx.fillStyle = '#7ba23f';
        ctx.beginPath();
        ctx.moveTo(p.x - 10, y + 16);
        ctx.lineTo(p.x - 20, y + 30);
        ctx.lineTo(p.x - 2, y + 26);
        ctx.closePath();
        ctx.fill();
      } else if (p.kind === 'pie') {
        ctx.fillStyle = '#e8a33d';
        ctx.beginPath();
        ctx.moveTo(p.x - 18, y + 10);
        ctx.lineTo(p.x + 18, y + 10);
        ctx.lineTo(p.x, y - 16);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#c97e2a';
        ctx.beginPath();
        ctx.moveTo(p.x - 18, y + 10);
        ctx.lineTo(p.x + 18, y + 10);
        ctx.lineTo(p.x + 14, y + 18);
        ctx.lineTo(p.x - 14, y + 18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff3d6';
        ellipse(ctx, p.x, y - 4, 6, 4);
      } else {
        // Golden feather: it shimmers.
        const glow = 0.5 + 0.5 * Math.sin(t * 5);
        ctx.fillStyle = `rgba(241, 196, 15, ${0.25 + glow * 0.25})`;
        ellipse(ctx, p.x, y, 26, 26);
        ctx.strokeStyle = PALETTE.featherGold;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p.x, y + 18);
        ctx.quadraticCurveTo(p.x - 16, y, p.x, y - 20);
        ctx.quadraticCurveTo(p.x + 16, y, p.x, y + 18);
        ctx.stroke();
        ctx.strokeStyle = '#fff3b0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, y + 14);
        ctx.lineTo(p.x, y - 16);
        ctx.stroke();
      }
    }
  }

  drawWorldProps(game) {
    const { ctx } = this;
    // Fences.
    for (const f of game.world.fences) {
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(f.x, GROUND_Y - f.h, 6, f.h);
      ctx.fillRect(f.x + f.w - 6, GROUND_Y - f.h, 6, f.h);
      ctx.fillRect(f.x - 4, GROUND_Y - f.h + 8, f.w + 8, 8);
      ctx.fillRect(f.x - 4, GROUND_Y - f.h + 34, f.w + 8, 8);
    }
    // Hay bales with twine.
    for (const b of game.world.hay) {
      ctx.fillStyle = PALETTE.hay;
      roundRect(ctx, b.x, GROUND_Y - b.h, b.w, b.h, 12);
      ctx.fill();
      ctx.strokeStyle = PALETTE.hayDark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x + 10, GROUND_Y - b.h + 8);
      ctx.lineTo(b.x + 10, GROUND_Y - 8);
      ctx.moveTo(b.x + b.w - 10, GROUND_Y - b.h + 8);
      ctx.lineTo(b.x + b.w - 10, GROUND_Y - 8);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(b.x + 14 + i * 12, GROUND_Y - b.h + 18 + (i % 3) * 18, 8, 3);
      }
    }
    // Pumpkins.
    for (const p of game.world.pumpkins) {
      ctx.fillStyle = PALETTE.pumpkin;
      ellipse(ctx, p.x, GROUND_Y - p.r * 0.8, p.r, p.r * 0.8);
      ctx.fillStyle = PALETTE.pumpkinDark;
      ctx.beginPath();
      ctx.ellipse(p.x, GROUND_Y - p.r * 0.8, p.r * 0.45, p.r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5d8a3c';
      ctx.fillRect(p.x - 3, GROUND_Y - p.r * 1.7, 6, 14);
    }
    // Kitchen tables.
    for (const tb of game.world.tables) {
      ctx.fillStyle = '#7d4f2a';
      ctx.fillRect(tb.x, GROUND_Y - tb.h, tb.w, 12);
      ctx.fillRect(tb.x + 8, GROUND_Y - tb.h + 12, 10, tb.h - 12);
      ctx.fillRect(tb.x + tb.w - 18, GROUND_Y - tb.h + 12, 10, tb.h - 12);
      ctx.fillStyle = '#e8e0d0';
      ellipse(ctx, tb.x + tb.w / 2, GROUND_Y - tb.h - 2, 26, 8);
    }
  }

  drawOven(game) {
    const { ctx } = this;
    const burst = game.world.ovenBurstAt(game.time);
    const ox = OVEN.x;
    // Oven body.
    ctx.fillStyle = PALETTE.ovenBody;
    roundRect(ctx, ox - 60, GROUND_Y - 190, 130, 190, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.ovenDark;
    roundRect(ctx, ox - 44, GROUND_Y - 150, 98, 110, 8);
    ctx.fill();
    // Hot coals glow inside.
    const glow = burst.active ? 0.9 : 0.35;
    ctx.fillStyle = `rgba(255, 120, 0, ${glow})`;
    ellipse(ctx, ox + 5, GROUND_Y - 95, 34, 22);
    // Flame burst licking out of the door.
    if (burst.active) {
      const f = Math.sin(game.time * 22) * 8;
      ctx.fillStyle = PALETTE.flameB;
      ctx.beginPath();
      ctx.moveTo(ox + 20, GROUND_Y - 60);
      ctx.quadraticCurveTo(ox + 90, GROUND_Y - 150 - f, ox + OVEN.flameReach, GROUND_Y - 40);
      ctx.quadraticCurveTo(ox + 90, GROUND_Y - 10 + f, ox + 20, GROUND_Y - 20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.flameA;
      ctx.beginPath();
      ctx.moveTo(ox + 20, GROUND_Y - 55);
      ctx.quadraticCurveTo(ox + 70, GROUND_Y - 120 - f, ox + OVEN.flameReach - 40, GROUND_Y - 42);
      ctx.quadraticCurveTo(ox + 70, GROUND_Y - 18 + f, ox + 20, GROUND_Y - 28);
      ctx.closePath();
      ctx.fill();
      text(ctx, 'HOT!', ox + 110, GROUND_Y - 170, 26, PALETTE.flameB, 'center');
    }
    // Warning sign above the oven.
    ctx.fillStyle = '#fff3d6';
    roundRect(ctx, ox - 50, GROUND_Y - 232, 116, 32, 6);
    ctx.fill();
    text(ctx, 'OVEN', ox + 8, GROUND_Y - 209, 20, '#a33327', 'center');
  }

  drawKnives(game) {
    const { ctx } = this;
    for (const k of game.hazards.knives) {
      if (k.state === 'warn') {
        // Telegraph: a flashing marker where the blade will land.
        const blink = Math.sin(game.time * 18) > 0 ? 0.9 : 0.35;
        ctx.fillStyle = `rgba(255, 59, 48, ${blink})`;
        ctx.beginPath();
        ctx.moveTo(k.x, GROUND_Y - 46);
        ctx.lineTo(k.x - 16, GROUND_Y - 14);
        ctx.lineTo(k.x + 16, GROUND_Y - 14);
        ctx.closePath();
        ctx.fill();
        text(ctx, '!', k.x, GROUND_Y - 52, 26, '#ff3b30', 'center');
      } else {
        // The blade: steel, handle up, stuck in the dirt when it lands.
        ctx.save();
        ctx.translate(k.x, k.y);
        ctx.fillStyle = PALETTE.knifeBlade;
        ctx.beginPath();
        ctx.moveTo(-7, -34);
        ctx.lineTo(7, -34);
        ctx.lineTo(0, 26);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = PALETTE.knifeHandle;
        roundRect(ctx, -6, -52, 12, 20, 4);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  drawTurkey(game) {
    const { ctx } = this;
    const t = game.turkey;
    if (t.invulnLeft > 0 && Math.floor(game.time * 14) % 2 === 0) return; // blink
    const x = t.x;
    const y = t.y;
    const running = Math.abs(t.vx) > 30 && t.onGround;
    const legSwing = running ? Math.sin(t.runPhase) * 10 : 0;
    const flap = t.onGround ? 0 : Math.sin(game.time * 18) * 0.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(t.facing, 1);
    // Tail fan: five feathers in autumn colours.
    const featherCols = [PALETTE.featherRed, PALETTE.featherOrange, PALETTE.featherGold, PALETTE.featherOrange, PALETTE.featherRed];
    for (let i = 0; i < 5; i++) {
      const ang = -0.9 + i * 0.45 + flap * 0.2;
      ctx.save();
      ctx.translate(-16, -34);
      ctx.rotate(ang);
      ctx.fillStyle = featherCols[i];
      ctx.beginPath();
      ctx.ellipse(0, -20, 9, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(0, -26, 4, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Legs.
    ctx.strokeStyle = '#e8a33d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-4, -14);
    ctx.lineTo(-4 + legSwing, 0);
    ctx.moveTo(8, -14);
    ctx.lineTo(8 - legSwing, 0);
    ctx.stroke();
    // Body.
    ctx.fillStyle = PALETTE.turkeyBody;
    ellipse(ctx, 0, -30, 26, 24);
    ctx.fillStyle = PALETTE.turkeyLight;
    ellipse(ctx, 6, -26, 16, 15);
    // Wing.
    ctx.fillStyle = PALETTE.turkeyDark;
    ctx.save();
    ctx.translate(-2, -30);
    ctx.rotate(-0.4 + flap * 0.6);
    ctx.beginPath();
    ctx.ellipse(-8, 0, 16, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Head, beak, wattle, eye.
    ctx.fillStyle = PALETTE.turkeyBody;
    ellipse(ctx, 22, -52, 13, 12);
    ctx.fillStyle = PALETTE.beak;
    ctx.beginPath();
    ctx.moveTo(30, -54);
    ctx.lineTo(44, -50);
    ctx.lineTo(30, -46);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.wattle;
    ctx.beginPath();
    ctx.ellipse(30, -42, 4, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1c1c';
    ellipse(ctx, 25, -55, 2.6, 2.6);
    ctx.fillStyle = '#fff';
    ellipse(ctx, 26, -56, 1, 1);
    // Dash motion lines.
    if (t.dashTimeLeft > 0) {
      ctx.strokeStyle = 'rgba(255, 233, 184, 0.8)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-30 - i * 14, -44 + i * 12);
        ctx.lineTo(-52 - i * 14, -44 + i * 12);
        ctx.stroke();
      }
    }
    ctx.restore();
    // Landing dust.
    if (t.landDust > 0) {
      ctx.fillStyle = `rgba(210, 180, 140, ${t.landDust * 2})`;
      ellipse(ctx, x, GROUND_Y + 4, 26, 7);
    }
  }

  drawFarmer(game) {
    const { ctx } = this;
    const f = game.farmer;
    const x = f.x;
    const y = f.y;
    const walk = Math.sin(f.walkPhase) * 7;
    // Vision cone when he is patrolling or suspicious.
    if (f.state === 'patrol' || f.state === 'suspicious') {
      ctx.save();
      ctx.translate(x, y - 52);
      ctx.fillStyle = 'rgba(255, 220, 90, 0.14)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, FARMER.vision, f.dir === 1 ? -FARMER.visionHalfAngle : Math.PI - FARMER.visionHalfAngle, f.dir === 1 ? FARMER.visionHalfAngle : Math.PI + FARMER.visionHalfAngle);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(f.dir, 1);
    // Legs (overalls).
    ctx.strokeStyle = PALETTE.farmerOveralls;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-6, -52);
    ctx.lineTo(-6 + walk, 0);
    ctx.moveTo(6, -52);
    ctx.lineTo(6 - walk, 0);
    ctx.stroke();
    // Body: shirt + overalls.
    ctx.fillStyle = PALETTE.farmerShirt;
    roundRect(ctx, -20, -104, 40, 56, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.farmerOveralls;
    ctx.fillRect(-20, -72, 40, 24);
    ctx.fillStyle = '#f7d54d';
    ctx.fillRect(-4, -68, 8, 8);
    // Arms: one holds the carving knife when chasing.
    ctx.strokeStyle = PALETTE.farmerShirt;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(14, -96);
    ctx.lineTo(30, -70);
    ctx.stroke();
    if (f.state === 'chase') {
      ctx.fillStyle = PALETTE.knifeBlade;
      ctx.beginPath();
      ctx.moveTo(28, -74);
      ctx.lineTo(52, -92);
      ctx.lineTo(56, -84);
      ctx.lineTo(34, -66);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.knifeHandle;
      ctx.fillRect(24, -72, 10, 8);
    }
    // Head: skin, beard, nose, straw hat.
    ctx.fillStyle = PALETTE.farmerSkin;
    ellipse(ctx, 0, -122, 17, 16);
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath();
    ctx.ellipse(2, -110, 13, 9, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#1c1c1c';
    ellipse(ctx, 7, -126, 2.4, 2.4);
    ctx.fillStyle = PALETTE.farmerHat;
    ellipse(ctx, 0, -136, 26, 7);
    ctx.fillRect(-13, -158, 26, 24);
    ctx.fillStyle = '#a33327';
    ctx.fillRect(-13, -140, 26, 5);
    // "!" when he spots you (or is staring), "?" while searching.
    ctx.restore();
    if (f.state === 'chase' || f.state === 'suspicious') {
      text(ctx, '!', x, y - 176, 34, PALETTE.alert, 'center');
    } else if (f.state === 'search') {
      text(ctx, '?', x, y - 176, 30, '#ffb347', 'center');
    }
  }

  drawHUD(game) {
    const { ctx } = this;
    const t = game.turkey;
    // Top-left panel: hearts, score, dash meter.
    ctx.fillStyle = PALETTE.hudPanel;
    roundRect(ctx, 16, 14, 300, 96, 12);
    ctx.fill();
    for (let i = 0; i < TURKEY.hearts; i++) {
      const hx = 44 + i * 36;
      const hy = 44;
      ctx.fillStyle = i < t.hearts ? '#ff5b5b' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(hx, hy + 8);
      ctx.bezierCurveTo(hx - 12, hy - 6, hx - 2, hy - 14, hx, hy - 4);
      ctx.bezierCurveTo(hx + 2, hy - 14, hx + 12, hy - 6, hx, hy + 8);
      ctx.fill();
    }
    text(ctx, `SCORE ${Math.floor(t.score)}`, 32, 84, 24, PALETTE.hudText);
    // Dash meter.
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, 32, 92, 140, 8, 4);
    ctx.fill();
    ctx.fillStyle = t.dashMeter >= TURKEY.dashCost ? '#7ed957' : '#ffb347';
    roundRect(ctx, 32, 92, 140 * (t.dashMeter / 100), 8, 4);
    ctx.fill();
    text(ctx, 'DASH', 180, 100, 13, PALETTE.hudText);
    // Top-centre: distance to the gate with zone markers.
    const prog = Math.min(1, Math.max(0, t.maxX / GATE_X));
    ctx.fillStyle = PALETTE.hudPanel;
    roundRect(ctx, 360, 14, 560, 52, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, 380, 34, 520, 10, 5);
    ctx.fill();
    ctx.fillStyle = '#7ed957';
    roundRect(ctx, 380, 34, 520 * prog, 10, 5);
    ctx.fill();
    text(ctx, 'FARMYARD', 380, 58, 11, PALETTE.hudText, 'left');
    text(ctx, 'BARN', 553, 58, 11, PALETTE.hudText, 'left');
    text(ctx, 'KITCHEN', 726, 58, 11, PALETTE.hudText, 'left');
    text(ctx, 'GATE', 880, 58, 11, '#7ed957', 'left');
    // Turkey marker on the distance bar.
    ctx.fillStyle = '#fff3d6';
    ellipse(ctx, 380 + 520 * prog, 39, 6, 6);
    // Top-right: zone + time.
    ctx.fillStyle = PALETTE.hudPanel;
    roundRect(ctx, 948, 14, 316, 52, 12);
    ctx.fill();
    text(ctx, ZONES[t.zone].name, 1064, 40, 22, PALETTE.hudAccent, 'center');
    text(ctx, `${Math.floor(game.elapsed)}s`, 1200, 40, 20, PALETTE.hudText, 'center');
    // Alert banners.
    if (game.farmer.alerting && game.state === 'playing') {
      const blink = Math.sin(game.time * 10) > -0.2;
      if (blink) {
        ctx.fillStyle = 'rgba(255, 59, 48, 0.9)';
        roundRect(ctx, 490, 82, 300, 44, 10);
        ctx.fill();
        text(ctx, 'SPOTTED! RUN!', 640, 113, 26, '#fff', 'center');
      }
    } else if (t.hidden && game.state === 'playing') {
      ctx.fillStyle = 'rgba(126, 217, 87, 0.9)';
      roundRect(ctx, 510, 82, 260, 44, 10);
      ctx.fill();
      text(ctx, 'HIDDEN', 640, 113, 26, '#12340a', 'center');
    }
  }

  drawTitle(game) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(43, 26, 14, 0.45)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'TURKEY TROT', 640, 190, 92, '#ffe9b8', 'center');
    text(ctx, 'A Thanksgiving Escape', 640, 240, 34, '#ffb347', 'center');
    text(ctx, 'Burt the farmer wants you for dinner. Outrun him from the', 640, 310, 24, '#fff3d6', 'center');
    text(ctx, 'farmyard, through the barn, past the kitchen oven — and out the gate.', 640, 342, 24, '#fff3d6', 'center');
    text(ctx, 'Dodge the carving knives. Hide behind the hay. Grab the corn.', 640, 374, 24, '#fff3d6', 'center');
    // Start button.
    ctx.fillStyle = '#e67e22';
    roundRect(ctx, 490, 420, 300, 72, 14);
    ctx.fill();
    ctx.fillStyle = '#7e241b';
    roundRect(ctx, 490, 420, 300, 72, 14);
    ctx.stroke();
    text(ctx, '▶  START THE RUN', 640, 468, 30, '#fff8e1', 'center');
    text(ctx, 'Arrows / WASD move · Up / Space jump · Shift / click dash', 640, 540, 20, '#ffe9b8', 'center');
    text(ctx, 'Press Enter or click to start', 640, 574, 18, 'rgba(255,233,184,0.75)', 'center');
  }

  drawPaused(game) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(43, 26, 14, 0.55)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'PAUSED', 640, 330, 72, '#ffe9b8', 'center');
    text(ctx, 'P to resume · R to restart', 640, 390, 24, '#ffb347', 'center');
  }

  drawCaught(game) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(60, 10, 10, 0.55)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Solid panel behind the text so no scenery shows through it.
    ctx.fillStyle = 'rgba(40, 8, 8, 0.92)';
    roundRect(ctx, 300, 200, 680, 300, 18);
    ctx.fill();
    text(ctx, 'CAUGHT!', 640, 260, 96, '#ff6b5e', 'center');
    text(ctx, 'Burt has you. Dinner is served...', 640, 320, 28, '#fff3d6', 'center');
    text(ctx, `Score ${Math.floor(game.turkey.score)}  ·  Distance ${Math.floor(game.turkey.maxX / 10)}m`, 640, 380, 26, '#ffe9b8', 'center');
    text(ctx, 'Press R or Enter to try again', 640, 460, 24, '#ffb347', 'center');
  }

  drawEscaped(game) {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(20, 50, 20, 0.5)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Solid panel behind the text so no scenery shows through it.
    ctx.fillStyle = 'rgba(16, 42, 16, 0.92)';
    roundRect(ctx, 300, 190, 680, 330, 18);
    ctx.fill();
    // Confetti.
    const cols = ['#f1c40f', '#e67e22', '#c0392b', '#7ed957', '#fff3d6'];
    for (let i = 0; i < 60; i++) {
      const px = (i * 227) % VIEW_W;
      const py = (i * 137 + game.time * 40) % 420;
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(px, py, 8, 5);
    }
    text(ctx, 'ESCAPED!', 640, 250, 96, '#7ed957', 'center');
    text(ctx, 'Tom the turkey lives to gobble another day.', 640, 310, 28, '#fff3d6', 'center');
    text(ctx, `Score ${Math.floor(game.turkey.score)}  ·  Time ${Math.floor(game.elapsed)}s`, 640, 380, 26, '#ffe9b8', 'center');
    text(ctx, `Corn ${game.stats.corn} · Pie ${game.stats.pie} · Feathers ${game.stats.feather}`, 640, 420, 22, '#ffe9b8', 'center');
    text(ctx, 'Press R or Enter to run again', 640, 490, 24, '#ffb347', 'center');
  }
}
