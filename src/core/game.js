import { BY_ID, cardEffect } from "../data/cards.js";
import { ENEMY_UNITS, BOSSES } from "../data/enemies.js";
import { play } from "./audio.js";

export const BASE_STATS = {
  hpMax: 100,
  armor: 0,
  speed: 300,
  dashCd: 2.4,
  pellets: 1,
  fireRate: 2.6,
  damage: 11,
  bulletSpeed: 980,
  range: 780,
  pierce: 0,
  crit: 0.05,
  critMult: 2,
  explosive: 0,
  lifesteal: 0,
  goldMult: 1,
  magnet: 90,
  drone: 0,
  ricochet: 0,
  spreadTight: 0,
};

const ENEMY_BASE = {
  infantry: { hp: 22, speed: 152, dmg: 7, radius: 34, score: 10, gold: 3, range: 440, fireCd: 1.5 },
  tank: { hp: 96, speed: 92, dmg: 15, radius: 46, score: 28, gold: 8, range: 400, fireCd: 2.1 },
  artillery: { hp: 62, speed: 74, dmg: 0, radius: 42, score: 24, gold: 7, range: 620, fireCd: 2.6 },
  fighter: { hp: 40, speed: 420, dmg: 8, radius: 36, score: 20, gold: 6, range: 620, fireCd: 1.0 },
  bomber: { hp: 55, speed: 330, dmg: 0, radius: 40, score: 22, gold: 7, range: 900, fireCd: 1.8 },
};

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const dist2 = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2;

export class Game {
  constructor(opts) {
    this.meta = opts.meta || {};
    this.W = opts.worldW || 1600;
    this.H = opts.worldH || 900;
    this.onEvent = opts.onEvent || (() => {});
    this.reset();
  }

  reset() {
    const m = this.meta;
    this.stats = {};
    for (const k in BASE_STATS) this.stats[k] = 0;

    this.mods = {
      hpMax: (m.hpMax || 0) * 12,
      damage: (m.damage || 0) * 0.06,
      fireRate: (m.fireRate || 0) * 0.05,
      goldMult: (m.goldMult || 0) * 0.06,
      magnet: (m.magnet || 0) * 14,
      dashCd: (m.dashCd || 0) * 0.05,
      speed: (m.speed || 0) * 0.04,
      armor: (m.armor || 0) * 0.03,
    };

    this.player = {
      x: this.W * 0.24,
      y: this.groundMid(),
      vx: 0, vy: 0,
      hp: 0, hpMax: 0,
      dashT: 0, dashCdT: 0,
      dashDirX: 1, dashDirY: 0,
      aim: 0,
      fireT: 0,
      hurtT: 0,
      invuln: 0,
      recoil: 0,
    };

    this.enemies = [];
    this.bullets = [];
    this.ebullets = [];
    this.pickups = [];
    this.parts = [];
    this.floats = [];
    this.drones = [];
    this.muzzle = [];

    this.wave = 0;
    this.score = 0;
    this.gold = 0;
    this.kills = 0;
    this.build = [];
    this.spawnQueue = [];
    this.spawnT = 0;
    this.waveState = "idle";
    this.boss = null;
    this.time = 0;
    this.shake = 0;
    this.hitstop = 0;
    this.running = false;
    this.dead = false;
    this.groundScroll = 0;
    this.rerollCost = 25;
    this.input = { x: 0, y: 0, dash: false };
    this.lockTarget = null;
    this.lockUntil = 0;

    this.recompute();
    this.player.hp = this.player.hpMax;
  }

  recompute() {
    const g = this.mods;
    const st = this.stats;
    const s = {};

    for (const k in BASE_STATS) {
      const base = BASE_STATS[k];
      const add = st[k] || 0;
      switch (k) {
        case "hpMax":       s[k] = base + add; break;
        case "range":       s[k] = base + add; break;
        case "magnet":      s[k] = base + add + g.magnet; break;
        case "pellets":     s[k] = base + add; break;
        case "pierce":      s[k] = base + add; break;
        case "drone":       s[k] = base + add; break;
        case "ricochet":    s[k] = base + add; break;
        case "explosive":   s[k] = base + add; break;
        case "crit":        s[k] = Math.min(0.85, base + add); break;
        case "armor":       s[k] = Math.min(0.66, base + add + g.armor); break;
        case "lifesteal":   s[k] = Math.min(0.6, add); break;
        case "spreadTight": s[k] = Math.min(0.85, add); break;
        case "damage":      s[k] = base * (1 + add) * (1 + g.damage); break;
        case "fireRate":    s[k] = base * (1 + add) * (1 + g.fireRate); break;
        case "goldMult":    s[k] = base * (1 + add) * (1 + g.goldMult); break;
        case "speed":       s[k] = base * (1 + add) * (1 + g.speed); break;
        case "bulletSpeed": s[k] = base * (1 + add); break;
        case "dashCd":      s[k] = Math.max(0.6, base * (1 - Math.min(0.65, add)) * (1 - g.dashCd)); break;
        default:            s[k] = base + add;
      }
    }

    s.pellets = Math.max(1, Math.round(s.pellets));
    s.pierce = Math.max(0, Math.round(s.pierce));
    s.drone = Math.max(0, Math.floor(s.drone));
    s.ricochet = Math.max(0, Math.round(s.ricochet));

    // 射程必须覆盖大半屏，否则自动射击根本打不到刚出生的敌人
    const minRange = this.W * 0.94;
    s.range = Math.max(s.range, minRange);

    const prevMax = this.player.hpMax;
    this.player.hpMax = Math.max(10, Math.round(s.hpMax));
    if (prevMax > 0 && this.player.hpMax > prevMax) {
      this.player.hp += this.player.hpMax - prevMax;
    }
    this.player.hp = Math.min(this.player.hp, this.player.hpMax);
    this.S = s;

    while (this.drones.length < s.drone) {
      this.drones.push({ fireT: 0, x: this.player.x, y: this.player.y });
    }
    while (this.drones.length > s.drone) this.drones.pop();
  }

  resize(w, h) {
    const sx = w / this.W;
    const sy = h / this.H;
    this.W = w;
    this.H = h;
    this.player.x = clamp(this.player.x * sx, 60, w - 60);
    this.player.y = clamp(this.player.y * sy, 70, h - 70);
    for (const e of this.enemies) {
      e.x *= sx;
      e.y *= sy;
    }
    for (const b of this.bullets) { b.x *= sx; b.y *= sy; }
    for (const b of this.ebullets) {
      b.x *= sx; b.y *= sy;
      if (b.tx != null) { b.tx *= sx; b.ty *= sy; }
    }
    this.recompute();
  }

  addCard(card) {
    const e = cardEffect(card);
    this.stats[e.stat] = (this.stats[e.stat] || 0) + e.amount;
    if (e.extra && e.extra.amount) {
      this.stats[e.extra.stat] = (this.stats[e.extra.stat] || 0) + e.extra.amount;
    }
    this.build.push({ id: card.id, lines: e.lines, rarity: card.rarity });
    this.recompute();
    this.onEvent({ t: "card", card, effect: e });
  }

  start() {
    this.running = true;
    this.nextWave();
  }

  nextWave() {
    this.wave++;
    this.spawnT = 0;
    this.spawnQueue = [];

    const w = this.wave;
    if (w % 4 === 0) {
      this.waveState = "boss";
      const b = BOSSES[Math.min(BOSSES.length - 1, Math.floor(w / 4) - 1)];
      this.spawnBoss(b);
      this.onEvent({ t: "boss", boss: this.boss });
      return;
    }

    this.waveState = "spawning";
    const budget = 9 + Math.floor(w * 2.2);
    let spent = 0;
    while (spent < budget && this.spawnQueue.length < 60) {
      const kind = this.rollKind(w);
      this.spawnQueue.push(kind);
      spent += kind === "infantry" ? 1 : kind === "tank" ? 3 : kind === "artillery" ? 2.4 : 2;
    }
    this.onEvent({ t: "wave", wave: w });
  }

  rollKind(w) {
    const r = Math.random();
    if (w < 2) return r < 0.85 ? "infantry" : "fighter";
    if (w < 4) return r < 0.6 ? "infantry" : r < 0.85 ? "tank" : "fighter";
    if (w < 7) {
      if (r < 0.42) return "infantry";
      if (r < 0.68) return "tank";
      if (r < 0.84) return "artillery";
      return Math.random() < 0.5 ? "fighter" : "bomber";
    }
    if (r < 0.34) return "infantry";
    if (r < 0.6) return "tank";
    if (r < 0.78) return "artillery";
    if (r < 0.9) return "fighter";
    return "bomber";
  }

  // 可行动纵向范围：横屏偏下，竖屏居中收窄
  groundTop() { return this.W / this.H < 1.15 ? this.H * 0.36 : this.H * 0.36; }
  groundBottom() { return this.W / this.H < 1.15 ? this.H * 0.74 : this.H * 0.92; }
  groundMid() { return (this.groundTop() + this.groundBottom()) / 2; }

  spawnEnemy(kind) {
    const base = ENEMY_BASE[kind];
    const w = this.wave;
    const hpMult = 1 + w * 0.26;
    const dmgMult = 1 + w * 0.085;
    const id = pick(ENEMY_UNITS[kind] || ENEMY_UNITS.infantry);
    const isAir = kind === "fighter" || kind === "bomber";
    const top = this.groundTop();
    const bot = this.groundBottom();

    // 分道生成：把纵向可用带切成若干车道，避免同批敌人叠在一起
    const lanes = this.W / this.H < 1.15 ? 6 : 7;
    this.laneCursor = ((this.laneCursor || 0) + 1) % lanes;
    const laneY = top + 40 + ((bot - top - 70) * (this.laneCursor + Math.random() * 0.7)) / lanes;

    const e = {
      kind,
      id,
      card: BY_ID[id],
      x: this.W + rand(30, 110),
      y: isAir ? rand(this.H * 0.16, this.H * 0.62) : laneY,
      vx: 0, vy: 0,
      hp: base.hp * hpMult,
      hpMax: base.hp * hpMult,
      dmg: base.dmg * dmgMult,
      speed: base.speed * (1 + w * 0.012),
      radius: base.radius,
      score: base.score,
      gold: base.gold,
      fireCd: rand(0.4, base.fireCd),
      range: base.range,
      bob: Math.random() * Math.PI * 2,
      hurt: 0,
      slow: 0,
      dead: false,
      elite: Math.random() < Math.min(0.18, w * 0.012),
      phase: Math.random() * Math.PI * 2,
      bossFlag: false,
      air: isAir,
    };
    if (e.elite) {
      e.hp *= 1.9;
      e.hpMax = e.hp;
      e.score *= 2;
      e.gold *= 2;
      e.radius *= 1.16;
    }
    this.enemies.push(e);
    return e;
  }

  spawnBoss(def) {
    const w = this.wave;
    const hp = 700 + w * 260;
    const b = {
      kind: "boss",
      id: def.id,
      card: BY_ID[def.id],
      name: def.name,
      ship: def.kind === "ship",
      x: this.W + 160,
      y: this.H / 2,
      hp,
      hpMax: hp,
      dmg: 14 * (1 + w * 0.05),
      speed: 44,
      radius: Math.min(96, this.H * 0.13),
      score: 400,
      gold: 120,
      fireCd: 1.8,
      fireCd2: 3.4,
      range: 1200,
      bob: 0,
      hurt: 0,
      dead: false,
      elite: false,
      bossFlag: true,
      phase: 0,
      angle: 0,
      targetY: this.H / 2,
      homeX: this.W * 0.76,
    };
    this.enemies.push(b);
    this.boss = b;
  }

  update(dt) {
    if (!this.running) return;
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      return;
    }
    const step = Math.min(dt, 1 / 30);
    this.time += step;
    this.shake *= Math.pow(0.0025, step);

    this.updatePlayer(step);
    this.updateSpawner(step);
    this.updateEnemies(step);
    this.updateBullets(step);
    this.updateEbulets(step);
    this.updatePickups(step);
    this.updateParts(step);
    this.updateWaveState();

    this.groundScroll += this.player.vx * step * 0.06;
  }

  updatePlayer(dt) {
    const p = this.player;
    const S = this.S;
    const inp = this.input || { x: 0, y: 0, dash: false };

    let dx = inp.x, dy = inp.y;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }

    if (inp.dash && p.dashCdT <= 0) {
      p.dashCdT = S.dashCd;
      p.dashT = 0.2;
      p.invuln = 0.28;
      const dl = Math.hypot(dx, dy);
      if (dl > 0.1) {
        p.dashDirX = dx / dl;
        p.dashDirY = dy / dl;
      } else {
        p.dashDirX = Math.cos(p.aim);
        p.dashDirY = Math.sin(p.aim);
      }
      play("swap", { gain: 0.42, rate: 1.35, throttleMs: 120 });
      for (let i = 0; i < 12; i++) {
        this.parts.push({
          x: p.x, y: p.y,
          vx: -p.dashDirX * rand(80, 320) + rand(-90, 90),
          vy: -p.dashDirY * rand(80, 320) + rand(-90, 90),
          life: rand(0.2, 0.44), max: 0.44, r: rand(2, 5), c: "#e0c37c",
        });
      }
    }

    p.dashCdT = Math.max(0, p.dashCdT - dt);
    p.dashT = Math.max(0, p.dashT - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.recoil = Math.max(0, p.recoil - dt * 7);

    const sp = S.speed * (p.dashT > 0 ? 5.2 : 1);
    if (p.dashT > 0) {
      p.vx = p.dashDirX * sp;
      p.vy = p.dashDirY * sp;
    } else {
      const accel = 1 - Math.pow(0.0008, dt);
      p.vx += (dx * sp - p.vx) * accel;
      p.vy += (dy * sp - p.vy) * accel;
    }
    p.x = clamp(p.x + p.vx * dt, 56, this.W - 56);
    p.y = clamp(p.y + p.vy * dt, this.groundTop() + 30, this.groundBottom() - 30);

    const tgt = this.pickTarget(p);
    if (tgt) {
      const want = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      let d = want - p.aim;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      p.aim += d * Math.min(1, dt * 22);
    }

    p.fireT -= dt;
    if (p.fireT <= 0 && tgt) {
      p.fireT = 1 / Math.max(0.6, S.fireRate);
      this.firePistol(p, S);
    }

    for (let i = 0; i < this.drones.length; i++) {
      const d = this.drones[i];
      const da = (Math.PI * 2 * i) / this.drones.length + this.time * 1.5;
      d.x = p.x + Math.cos(da) * 84;
      d.y = p.y + Math.sin(da) * 84 * 0.8;
      d.fireT -= dt;
      if (d.fireT <= 0) {
        const t2 = this.nearestEnemy(d.x, d.y, S.range * 1.1);
        if (t2) {
          d.fireT = 1 / Math.max(0.9, S.fireRate * 0.62);
          const a = Math.atan2(t2.y - d.y, t2.x - d.x);
          this.spawnBullet(d.x, d.y, a, S.damage * 0.55, S, { small: true });
        }
      }
    }
  }

  firePistol(p, S) {
    const n = Math.max(1, S.pellets);
    const tight = Math.min(0.8, S.spreadTight || 0);
    const spread = n > 1 ? Math.min(0.48, 0.055 * n) * (1 - tight) : 0;
    for (let i = 0; i < n; i++) {
      const off = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread;
      const a = p.aim + off + rand(-0.02, 0.02) * (1 - tight);
      this.spawnBullet(
        p.x + Math.cos(p.aim) * 30,
        p.y + Math.sin(p.aim) * 30,
        a, S.damage, S, {}
      );
    }
    p.recoil = 1;
    this.muzzle.push({
      x: p.x + Math.cos(p.aim) * 42,
      y: p.y + Math.sin(p.aim) * 42,
      a: p.aim, life: 0.07, max: 0.07,
    });
    play("fire", { gain: 0.2, rate: rand(1.28, 1.46), throttleMs: 55 });
  }

  spawnBullet(x, y, a, dmg, S, opt) {
    const crit = Math.random() < S.crit;
    this.bullets.push({
      x, y,
      vx: Math.cos(a) * S.bulletSpeed,
      vy: Math.sin(a) * S.bulletSpeed,
      dmg: crit ? dmg * S.critMult : dmg,
      crit,
      r: opt.small ? 3.2 : 4.4,
      life: (S.range / S.bulletSpeed) * 1.08,
      pierce: S.pierce,
      hit: new Set(),
      ricochet: S.ricochet,
      explosive: S.explosive,
      small: !!opt.small,
    });
  }

  // 目标粘滞：锁定后持续 0.55s，除非死亡或离开范围
  pickTarget(p) {
    const S = this.S;
    const cur = this.lockTarget;
    if (cur && !cur.dead && cur.x <= this.W + 60 &&
        dist2(p.x, p.y, cur.x, cur.y) < (S.range * 1.1) ** 2 &&
        this.time < this.lockUntil) {
      return cur;
    }
    const t = this.nearestEnemy(p.x, p.y, S.range);
    this.lockTarget = t;
    this.lockUntil = this.time + 0.55;
    return t;
  }

  nearestEnemy(x, y, range) {
    let best = null;
    let bd = range * range;
    for (const e of this.enemies) {
      if (e.dead) continue;
      // 只瞄画面内的敌人，避免射空
      if (e.x > this.W + 40) continue;
      const d = dist2(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  updateSpawner(dt) {
    if (this.waveState !== "spawning") return;
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.spawnQueue.length) {
      this.spawnT = Math.max(0.2, 0.62 - this.wave * 0.022);
      this.spawnEnemy(this.spawnQueue.shift());
      // 允许一次补两个，前期就有压迫感
      if (this.spawnQueue.length && Math.random() < 0.45) {
        this.spawnEnemy(this.spawnQueue.shift());
      }
      if (this.spawnQueue.length === 0) this.waveState = "clearing";
    }
  }

  updateEnemies(dt) {
    const p = this.player;
    const list = this.enemies;

    // 轻量分离：避免单位完全叠在一起
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.dead || a.bossFlag || a.air) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (b.dead || b.bossFlag || b.air) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minD = (a.radius + b.radius) * 0.78;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0.01 && d2 < minD * minD) {
          const d = Math.sqrt(d2);
          const push = ((minD - d) / minD) * 90 * dt;
          const ux = dx / d;
          const uy = dy / d;
          a.x -= ux * push;
          a.y -= uy * push;
          b.x += ux * push;
          b.y += uy * push;
        }
      }
    }

    for (const e of list) {
      if (e.dead) continue;
      e.bob += dt * (e.kind === "infantry" ? 6 : 3);
      e.hurt = Math.max(0, e.hurt - dt * 4);
      e.slow = Math.max(0, e.slow - dt);

      if (e.bossFlag) { this.updateBoss(e, dt); continue; }

      if (e.kind === "fighter") {
        e.x -= e.speed * dt;
        e.y += Math.sin(e.bob * 1.4 + e.phase) * 90 * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0 && e.x > p.x - 40) {
          e.fireCd = rand(0.8, 1.3);
          const a = Math.atan2(p.y - e.y, p.x - e.x);
          this.enemyShoot(e, a, 620, 7);
        }
        if (e.x < -120) { e.x = this.W + 120; e.y = rand(this.H * 0.14, this.H * 0.86); }
        continue;
      }

      if (e.kind === "bomber") {
        e.x -= e.speed * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0) { e.fireCd = rand(1.5, 2.4); this.dropBomb(e); }
        if (e.x < -140) { e.x = this.W + 140; e.y = rand(this.H * 0.14, this.H * 0.86); }
        continue;
      }

      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const stop = e.kind === "artillery" ? e.range * 0.85 : e.range * 0.72;

      if (e.kind === "artillery") {
        if (d < stop * 0.7) e.x += (dx / d) * e.speed * dt * -0.6;
        else if (d > stop) e.x += (dx / d) * e.speed * dt;
        e.y += Math.sign(dy) * e.speed * 0.34 * dt;
      } else if (d > stop) {
        const sm = e.slow > 0 ? 0.45 : 1;
        e.x += (dx / d) * e.speed * sm * dt;
        e.y += (dy / d) * e.speed * sm * dt;
      }
      e.x = clamp(e.x, -60, this.W + 320);
      e.y = clamp(e.y, this.H * 0.08, this.H * 0.92);

      e.fireCd -= dt;
      if (e.fireCd <= 0) {
        if (e.kind === "artillery") {
          e.fireCd = rand(2.1, 3.1);
          this.lobShell(e);
          play("barrage", { gain: 0.16, rate: rand(1.2, 1.5), throttleMs: 280 });
        } else if (e.kind === "tank") {
          e.fireCd = rand(1.9, 2.6);
          this.enemyShoot(e, Math.atan2(dy, dx), 520, e.dmg);
          play("impact", { gain: 0.13, rate: rand(0.9, 1.1), throttleMs: 220 });
        } else {
          e.fireCd = rand(1.1, 1.9);
          this.enemyShoot(e, Math.atan2(dy, dx), 430, e.dmg);
        }
      }

      if (d < e.radius + 24) {
        this.hurtPlayer(10 * (1 + this.wave * 0.05));
        e.hp -= 12;
        if (e.hp <= 0) this.killEnemy(e);
      }
    }
  }

  updateBoss(b, dt) {
    const p = this.player;
    b.angle += dt * 0.6;
    b.targetY = this.H / 2 + Math.sin(b.angle * 0.85) * this.H * 0.26;
    b.y += (b.targetY - b.y) * Math.min(1, dt * 1.6);
    b.x += (b.homeX - b.x) * Math.min(1, dt * 1.3);

    b.fireCd -= dt;
    b.fireCd2 -= dt;
    const rage = b.hp / b.hpMax < 0.45 ? 1.5 : 1;

    if (b.fireCd <= 0) {
      b.fireCd = Math.max(0.5, 1.3 / rage);
      const base = Math.atan2(p.y - b.y, p.x - b.x);
      if (b.ship) {
        for (let i = -2; i <= 2; i++) this.enemyShoot(b, base + i * 0.16, 430, b.dmg * 0.7);
      } else {
        this.enemyShoot(b, base, 500, b.dmg);
        this.enemyShoot(b, base + 0.22, 460, b.dmg * 0.7);
        this.enemyShoot(b, base - 0.22, 460, b.dmg * 0.7);
      }
      play("impact", { gain: 0.2, rate: 0.75, throttleMs: 180 });
    }

    if (b.fireCd2 <= 0) {
      b.fireCd2 = Math.max(1.8, 4.4 / rage);
      if (b.ship) {
        for (let i = 0; i < 14; i++) {
          this.enemyShoot(b, (Math.PI * 2 * i) / 14 + b.angle, 340, b.dmg * 0.55);
        }
      } else {
        for (let i = 0; i < 3; i++) {
          this.lobShellAt(
            p.x + rand(-this.W * 0.16, this.W * 0.16),
            p.y + rand(-this.H * 0.14, this.H * 0.14),
            b.dmg * 1.25, 0.95
          );
        }
      }
      play("katyusha", { gain: 0.18, rate: 1.0, throttleMs: 320 });
    }
  }

  enemyShoot(e, a, speed, dmg) {
    this.ebullets.push({
      x: e.x + Math.cos(a) * (e.radius * 0.65),
      y: e.y + Math.sin(a) * (e.radius * 0.65),
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      r: 7,
      dmg,
      life: 4,
      type: "bolt",
      rot: a,
    });
  }

  lobShell(e) {
    const p = this.player;
    const lead = 0.7;
    this.lobShellAt(
      p.x + p.vx * lead + rand(-this.W * 0.06, this.W * 0.06),
      p.y + p.vy * lead + rand(-this.H * 0.06, this.H * 0.06),
      e.dmg * 1.25, 1.15
    );
  }

  lobShellAt(tx, ty, dmg, dur) {
    this.ebullets.push({
      x: tx, y: ty - this.H * 0.34,
      tx, ty,
      t: 0, dur,
      r: 15,
      dmg,
      type: "shell",
    });
  }

  dropBomb(e) {
    const p = this.player;
    this.ebullets.push({
      x: e.x, y: e.y,
      tx: clamp(p.x + p.vx * 0.5, 50, this.W - 50),
      ty: clamp(p.y + p.vy * 0.5, 50, this.H - 50),
      t: 0, dur: 0.9,
      r: 13,
      dmg: 13 * (1 + this.wave * 0.06),
      type: "bomb",
    });
  }

  updateBullets(dt) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < -60 || b.x > this.W + 90 || b.y < -70 || b.y > this.H + 70) {
        this.bullets.splice(i, 1);
        continue;
      }
      for (const e of this.enemies) {
        if (e.dead || b.hit.has(e)) continue;
        if (dist2(b.x, b.y, e.x, e.y) < (e.radius + b.r) ** 2) {
          b.hit.add(e);
          this.damageEnemy(e, b.dmg, b.crit, b.x, b.y);
          if (b.explosive > 0) this.explode(b.x, b.y, b.explosive, b.dmg * 0.5);
          if (b.pierce > 0) b.pierce--;
          else { this.bullets.splice(i, 1); }
          break;
        }
      }
    }
  }

  explode(x, y, radius, dmg) {
    this.parts.push({ x, y, r: radius, life: 0.26, max: 0.26, c: "#ffb45e", ring: true });
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (dist2(x, y, e.x, e.y) < (radius + e.radius) ** 2) {
        this.damageEnemy(e, dmg, false, x, y, true);
      }
    }
    play("bomb", { gain: 0.13, rate: 1.4, throttleMs: 100 });
  }

  damageEnemy(e, dmg, crit, hx, hy) {
    const armor = e.bossFlag ? 0.3 : e.kind === "tank" ? 0.22 : 0.05;
    const real = Math.max(1, dmg * (1 - armor));
    e.hp -= real;
    e.hurt = 1;
    if (e.slow <= 0 && e.kind === "infantry" && Math.random() < 0.1) e.slow = 0.7;

    this.floats.push({
      x: e.x + rand(-14, 14), y: e.y - e.radius * 0.6,
      v: Math.round(real), life: 0.62, max: 0.62, crit,
    });

    if (this.S.lifesteal > 0 && this.player.hp < this.player.hpMax) {
      this.player.hp = Math.min(this.player.hpMax, this.player.hp + real * this.S.lifesteal);
    }

    if (e.hp <= 0) this.killEnemy(e);
    else if (crit) play("flip", { gain: 0.08, rate: 1.8, throttleMs: 140 });
  }

  killEnemy(e) {
    if (e.dead) return;
    e.dead = true;
    const idx = this.enemies.indexOf(e);
    if (idx >= 0) this.enemies.splice(idx, 1);

    this.kills++;
    const gain = Math.round(e.score * (1 + this.wave * 0.06));
    this.score += gain;
    const gold = Math.round(e.gold * this.S.goldMult);
    this.gold += gold;

    this.floats.push({
      x: e.x, y: e.y - 20, v: "+" + gain, life: 0.9, max: 0.9, score: true,
    });

    const n = e.bossFlag ? 18 : 8;
    for (let i = 0; i < n; i++) {
      this.parts.push({
        x: e.x, y: e.y,
        vx: rand(-190, 190), vy: rand(-190, 190),
        life: rand(0.22, 0.6), max: 0.6,
        r: rand(1.6, 4.4),
        c: e.bossFlag ? "#d9a44c" : Math.random() < 0.4 ? "#c2513c" : "#8a8b78",
      });
    }

    if (e.bossFlag) {
      this.boss = null;
      this.shake = 26;
      this.hitstop = 0.14;
      play("hq_boom", { gain: 0.45, rate: 1, throttleMs: 400 });
      for (let i = 0; i < 5; i++) {
        this.pickups.push({
          x: e.x + rand(-90, 90), y: e.y + rand(-90, 90),
          vx: rand(-60, 60), vy: rand(-60, 60),
          r: 10, gold: 24, life: 16,
        });
      }
      this.onEvent({ t: "bossDown", boss: e });
    } else {
      play("bombing", { gain: 0.09, rate: rand(1.35, 1.7), throttleMs: 110 });
    }

    if (Math.random() < (e.bossFlag ? 1 : 0.42)) {
      this.pickups.push({
        x: e.x, y: e.y,
        vx: rand(-50, 50), vy: rand(-50, 50),
        r: 7, gold: Math.max(1, Math.round(gold * 0.45)), life: 13,
      });
    }
  }

  updateEbulets(dt) {
    const p = this.player;
    for (let i = this.ebullets.length - 1; i >= 0; i--) {
      const b = this.ebullets[i];
      if (b.type === "shell" || b.type === "bomb") {
        b.t += dt;
        if (b.t / b.dur >= 1) {
          this.ebullets.splice(i, 1);
          this.parts.push({ x: b.tx, y: b.ty, r: 74, life: 0.3, max: 0.3, c: "#ff9a3c", ring: true });
          this.shake = Math.max(this.shake, 8);
          play("bomb", { gain: 0.2, rate: 1.1, throttleMs: 110 });
          if (dist2(p.x, p.y, b.tx, b.ty) < (74 + 22) ** 2) this.hurtPlayer(b.dmg);
        }
        continue;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < -70 || b.x > this.W + 70 || b.y < -70 || b.y > this.H + 70) {
        this.ebullets.splice(i, 1);
        continue;
      }
      if (dist2(b.x, b.y, p.x, p.y) < (b.r + 20) ** 2) {
        this.ebullets.splice(i, 1);
        this.hurtPlayer(b.dmg);
      }
    }
  }

  hurtPlayer(dmg) {
    const p = this.player;
    if (p.invuln > 0 || this.dead) return;
    const real = Math.max(1, dmg * (1 - this.S.armor));
    p.hp -= real;
    p.hurtT = 1;
    p.invuln = 0.34;
    this.shake = Math.max(this.shake, 9);
    this.hitstop = 0.045;
    play("impact", { gain: 0.18, rate: 0.95, throttleMs: 70 });
    if (p.hp <= 0) { p.hp = 0; this.die(); }
  }

  die() {
    this.dead = true;
    this.running = false;
    this.shake = 22;
    play("last", { gain: 0.5, rate: 1 });
    this.onEvent({ t: "dead" });
  }

  updatePickups(dt) {
    const p = this.player;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const k = this.pickups[i];
      k.life -= dt;
      if (k.life <= 0) { this.pickups.splice(i, 1); continue; }
      const dx = p.x - k.x;
      const dy = p.y - k.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < this.S.magnet) {
        const pull = 620 / Math.max(30, d);
        k.vx += (dx / d) * pull * 60 * dt;
        k.vy += (dy / d) * pull * 60 * dt;
      }
      k.vx *= 0.94;
      k.vy *= 0.94;
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      if (d < 32) {
        this.gold += k.gold;
        this.pickups.splice(i, 1);
        play("gold", { gain: 0.12, rate: rand(1.15, 1.4), throttleMs: 50 });
      }
    }
  }

  updateParts(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const q = this.parts[i];
      q.life -= dt;
      if (q.life <= 0) { this.parts.splice(i, 1); continue; }
      if (!q.ring) {
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vx *= 0.965;
        q.vy *= 0.965;
      }
    }
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.life -= dt;
      f.y -= dt * 54;
      if (f.life <= 0) this.floats.splice(i, 1);
    }
    for (let i = this.muzzle.length - 1; i >= 0; i--) {
      this.muzzle[i].life -= dt;
      if (this.muzzle[i].life <= 0) this.muzzle.splice(i, 1);
    }
  }

  updateWaveState() {
    if (this.waveState === "spawning" && this.spawnQueue.length === 0) {
      this.waveState = "clearing";
    }
    if (this.waveState === "clearing" && this.enemies.length === 0) {
      this.waveState = "done";
      this.running = false;
      this.onEvent({ t: "waveClear", wave: this.wave });
      return;
    }
    if (this.waveState === "boss" && !this.boss) {
      this.waveState = "done";
      this.running = false;
      this.onEvent({ t: "waveClear", wave: this.wave });
    }
  }

  setInput(inp) {
    this.input = inp;
  }
}
