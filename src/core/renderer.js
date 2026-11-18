import { getImage, artUrl, faceUrl, bgUrl } from "./assets.js";
import { BY_ID, NATION } from "../data/cards.js";

const KIND_COLOR = {
  infantry: "#9dbb6a",
  tank: "#d9a44c",
  artillery: "#c2513c",
  fighter: "#7fb2c9",
  bomber: "#b18fc9",
};

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function hexToRgb(h) {
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}

function mix(a, b, k) {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * k);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * k);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * k);
  return `rgb(${r},${g},${bl})`;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.dpr = 1;
    this.W = 0;
    this.H = 0;
    this.scale = 1;
    this.offX = 0;
    this.offY = 0;
    this.t = 0;
    this.worldW = 1600;
    this.worldH = 900;
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.W = w;
    this.H = h;

    const aspect = w / h;
    if (aspect >= 1.15) {
      this.worldH = 900;
      this.worldW = Math.round(900 * aspect);
    } else {
      // 竖屏：世界高按屏比推出，但收紧上下可用带，让单位视觉更大
      this.worldW = 560;
      this.worldH = Math.round(560 / aspect);
    }

    this.scale = Math.min(w / this.worldW, h / this.worldH);
    this.offX = (w - this.worldW * this.scale) / 2;
    this.offY = (h - this.worldH * this.scale) / 2;
    return { worldW: this.worldW, worldH: this.worldH };
  }
  begin(camX, shake) {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = "#0c0d09";
    ctx.fillRect(0, 0, this.W, this.H);
    const sx = shake ? (Math.random() - 0.5) * shake : 0;
    const sy = shake ? (Math.random() - 0.5) * shake : 0;
    ctx.save();
    ctx.translate(this.offX + sx, this.offY + sy);
    ctx.scale(this.scale, this.scale);
    ctx.beginPath();
    ctx.rect(0, 0, this.worldW, this.worldH);
    ctx.clip();
    this.camX = 0;
  }

  endScreenspace() {
    this.ctx.restore();
  }

  drawBackground(game, bgName) {
    const ctx = this.ctx;
    const W = this.worldW;
    const H = this.worldH;
    const portrait = W / H < 1.15;
    const img = getImage(bgUrl(bgName, portrait)) || getImage(bgUrl(bgName, false));

    ctx.fillStyle = "#0a0b07";
    ctx.fillRect(0, 0, W, H);

    if (img) {
      // 竖屏用竖版图（已构图好），横屏用宽幅图；等比铺满不拉伸
      const cover = Math.max(W / img.width, H / img.height) * 1.02;
      const dw = img.width * cover;
      const dh = img.height * cover;
      const drift = ((game.groundScroll || 0) * 0.1) % Math.max(1, dw - W);
      const dx = -(dw - W) / 2 - drift;
      const dy = portrait ? 0 : -(dh - H) / 2;

      ctx.save();
      ctx.globalAlpha = 1;
      ctx.drawImage(img, dx, dy, dw, dh);
      if (dx + dw < W) ctx.drawImage(img, dx + dw, dy, dw, dh);
      ctx.restore();
    }

    const v = ctx.createRadialGradient(
      W * 0.5, H * 0.5, Math.min(W, H) * 0.3,
      W * 0.5, H * 0.5, Math.max(W, H) * 0.82
    );
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(8,9,6,0.68)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);

    // 可活动地面区域（与 game.groundTop / groundBottom 一致）
    const gTop = H * (portrait ? 0.36 : 0.36);
    const gBot = H * (portrait ? 0.74 : 0.92);
    ctx.save();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(10,11,8,0.34)");
    g.addColorStop(0.3, "rgba(10,11,8,0.06)");
    g.addColorStop(0.64, "rgba(10,11,8,0.02)");
    g.addColorStop(0.78, "rgba(10,11,8,0.16)");
    g.addColorStop(1, "rgba(10,11,8,0.5)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 上下边界虚线
    ctx.globalAlpha = 0.11;
    ctx.strokeStyle = "#c2a25a";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([18, 16]);
    ctx.beginPath();
    ctx.moveTo(0, gBot);
    ctx.lineTo(W, gBot);
    ctx.stroke();
    ctx.restore();
  }

  drawToken(img, x, y, w, h, opts = {}) {
    const ctx = this.ctx;
    const r = opts.radius != null ? opts.radius : 4;
    ctx.save();
    ctx.translate(x, y);
    if (opts.rot) ctx.rotate(opts.rot);

    const hw = w / 2;
    const hh = h / 2;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    roundRect(ctx, -hw + 2, -hh + 6, w, h, r);
    ctx.fill();

    ctx.fillStyle = opts.bg || "#20221a";
    roundRect(ctx, -hw, -hh, w, h, r);
    ctx.fill();

    if (img) {
      ctx.save();
      roundRect(ctx, -hw, -hh, w, h, r);
      ctx.clip();
      const ia = img.width / img.height;
      const ta = w / h;
      let dw = w, dh = h, dx = -hw, dy = -hh;
      if (ia > ta) {
        dh = h;
        dw = h * ia;
        dx = -hw - (dw - w) / 2;
      } else {
        dw = w;
        dh = w / ia;
        dy = -hh - (dh - h) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
      if (opts.tint) {
        ctx.fillStyle = opts.tint;
        ctx.fillRect(-hw, -hh, w, h);
      }
      ctx.restore();
    }

    if (opts.border) {
      ctx.strokeStyle = opts.border;
      ctx.lineWidth = opts.borderW || 1.6;
      roundRect(ctx, -hw + 0.5, -hh + 0.5, w - 1, h - 1, r);
      ctx.stroke();
    }
    ctx.restore();
  }

  draw(game, state) {
    const ctx = this.ctx;
    const t = game.time;

    // 落点预警
    for (const b of game.ebullets) {
      if (b.type !== "shell" && b.type !== "bomb") continue;
      const k = Math.min(1, b.t / b.dur);
      const rad = 74 * (0.35 + k * 0.65);
      ctx.save();
      ctx.globalAlpha = 0.3 + k * 0.42;
      ctx.strokeStyle = "#d2452f";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(b.tx, b.ty, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.1 + k * 0.24;
      ctx.fillStyle = "#d2452f";
      ctx.beginPath();
      ctx.arc(b.tx, b.ty, rad * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 掉落物
    for (const k of game.pickups) {
      const pulse = 0.8 + Math.sin(t * 8 + k.x * 0.05) * 0.2;
      ctx.save();
      ctx.globalAlpha = k.life < 3 ? 0.35 + Math.abs(Math.sin(k.life * 8)) * 0.65 : 1;
      ctx.fillStyle = "rgba(185,154,82,0.22)";
      ctx.beginPath();
      ctx.arc(k.x, k.y, 17 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e0c37c";
      ctx.beginPath();
      ctx.arc(k.x, k.y, 6.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#6b561f";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }

    for (const e of game.enemies) this.drawEnemy(e, t);

    this.drawPlayer(game, t);

    // 玩家子弹
    ctx.save();
    ctx.lineCap = "round";
    for (const b of game.bullets) {
      const sp = Math.hypot(b.vx, b.vy) || 1;
      const nx = b.vx / sp;
      const ny = b.vy / sp;
      const len = 20;
      ctx.globalAlpha = 0.36;
      ctx.strokeStyle = b.crit ? "#ffb347" : "#b99a52";
      ctx.lineWidth = b.small ? 4.5 : 7.5;
      ctx.beginPath();
      ctx.moveTo(b.x - nx * len, b.y - ny * len);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.globalAlpha = 0.96;
      ctx.strokeStyle = b.crit ? "#ffe3a0" : "#f4ddb0";
      ctx.lineWidth = b.small ? 2 : 3.2;
      ctx.beginPath();
      ctx.moveTo(b.x - nx * len, b.y - ny * len);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();

    // 敌方子弹
    for (const b of game.ebullets) {
      if (b.type === "shell" || b.type === "bomb") {
        const k = Math.min(1, b.t / b.dur);
        const px = b.x + (b.tx - b.x) * k;
        const py = b.y + (b.ty - b.y) * k;
        const size = b.type === "bomb" ? 11 : 15;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.atan2(b.ty - b.y, b.tx - b.x) + Math.PI / 2);
        ctx.fillStyle = "#2a2b22";
        ctx.strokeStyle = "#c2513c";
        ctx.lineWidth = 2;
        roundRect(ctx, -size * 0.4, -size, size * 0.8, size * 2, size * 0.4);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        continue;
      }
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot || Math.atan2(b.vy, b.vx));
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#c2513c";
      ctx.beginPath();
      ctx.ellipse(0, 0, b.r * 2.4, b.r * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#e8d9a8";
      ctx.beginPath();
      ctx.moveTo(-b.r * 1.7, -b.r * 0.3);
      ctx.lineTo(-b.r * 0.3, -b.r * 0.3);
      ctx.lineTo(-b.r * 0.3, -b.r * 0.75);
      ctx.lineTo(b.r * 1.7, 0);
      ctx.lineTo(-b.r * 0.3, b.r * 0.75);
      ctx.lineTo(-b.r * 0.3, b.r * 0.3);
      ctx.lineTo(-b.r * 1.7, b.r * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#8c2f22";
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.restore();
    }

    // 粒子
    for (const q of game.parts) {
      const k = q.life / q.max;
      ctx.save();
      if (q.ring) {
        ctx.globalAlpha = k * 0.75;
        ctx.strokeStyle = q.c;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r * (1.15 - k * 0.5), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.globalAlpha = k;
        ctx.fillStyle = q.c;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r * (0.4 + k * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 枪口火光
    for (const m of game.muzzle) {
      const k = m.life / m.max;
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.a);
      ctx.globalAlpha = k;
      ctx.fillStyle = "#ffe9b0";
      ctx.beginPath();
      ctx.moveTo(0, -5 * k);
      ctx.lineTo(16 * k, 0);
      ctx.lineTo(0, 5 * k);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 飘字
    ctx.save();
    ctx.textAlign = "center";
    for (const f of game.floats) {
      const k = Math.min(1, (f.life / f.max) * 1.6);
      ctx.globalAlpha = k;
      if (f.score) {
        ctx.font = "700 17px 'Franklin Gothic Demi Cond', sans-serif";
        ctx.fillStyle = "#e0c37c";
        ctx.fillText(String(f.v), f.x, f.y);
      } else {
        ctx.font = f.crit ? "700 22px 'Roboto Black', sans-serif" : "700 16px 'Roboto Black', sans-serif";
        ctx.fillStyle = f.crit ? "#ffd68a" : "#f0e6cc";
        ctx.strokeStyle = "rgba(10,10,6,0.85)";
        ctx.lineWidth = 3;
        ctx.strokeText(String(f.v), f.x, f.y);
        ctx.fillText(String(f.v), f.x, f.y);
      }
    }
    ctx.restore();
  }

  drawEnemy(e, t) {
    const ctx = this.ctx;
    const face = getImage(artUrl(e.id)) || getImage(faceUrl(e.id));
    const nat = e.card ? NATION[e.card.nation] : null;
    const isBoss = e.bossFlag;
    const k = Math.min(1.5, Math.max(0.72, 900 / this.worldH));

    const bob = Math.sin(e.bob) * (e.kind === "infantry" ? 2.4 : 1.2);
    const w = isBoss ? 210 * k : e.radius * 2.1;
    const h = isBoss ? 210 * k : e.radius * 1.66;
    const baseY = e.y + bob + h * 0.46;

    // 投影
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(e.x, baseY, w * 0.42, h * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 底座
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = nat ? nat.color : "#3a3c30";
    ctx.beginPath();
    ctx.ellipse(e.x, baseY, w * 0.34, h * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isBoss ? "#e6c98a" : "rgba(232,226,207,0.4)";
    ctx.lineWidth = isBoss ? 2.4 : 1.1;
    ctx.stroke();
    ctx.restore();

    const tintA = isBoss ? 0.14 : 0.5;
    const hurtTint = e.hurt > 0.05 ? `rgba(255,96,64,${tintA * e.hurt})` : null;
    const borderCol = isBoss ? "#e6c98a" : nat ? mix(nat.color, "#e8e2cf", 0.6) : "#8a8b78";

    this.drawToken(face, e.x, e.y + bob, w, h, {
      radius: isBoss ? 9 : 3,
      border: borderCol,
      borderW: isBoss ? 3 : 1.7,
      tint: hurtTint,
      bg: "#1a1c14",
    });

    if (e.elite) {
      ctx.save();
      ctx.translate(e.x + w * 0.44, e.y + bob - h * 0.48);
      ctx.fillStyle = "#e0c37c";
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (!isBoss && e.hp < e.hpMax - 0.5) {
      const bw = w * 0.86;
      const hk = Math.max(0, e.hp / e.hpMax);
      const by = e.y + bob - h * 0.5 - 10;
      ctx.save();
      ctx.fillStyle = "rgba(8,9,6,0.85)";
      ctx.fillRect(e.x - bw / 2, by, bw, 4);
      ctx.fillStyle = hk > 0.5 ? "#9dbb6a" : hk > 0.22 ? "#d9a44c" : "#c2513c";
      ctx.fillRect(e.x - bw / 2, by, bw * hk, 4);
      ctx.restore();
    }

    if (!isBoss) {
      ctx.save();
      ctx.translate(e.x - w * 0.5 - 2, e.y + bob - h * 0.5 + 3);
      ctx.fillStyle = KIND_COLOR[e.kind] || "#8a8b78";
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(10,10,6,0.75)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }
  }

  drawPlayer(game, t) {
    const ctx = this.ctx;
    const p = game.player;
    const art = getImage(artUrl("no_10_commando"));
    const S = game.S;
    const k = Math.min(1.6, Math.max(0.82, 900 / this.worldH));

    const w = 76 * k;
    const h = 64 * k;

    if (p.dashT > 0) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      this.drawToken(art, p.x - p.dashDirX * 28, p.y - p.dashDirY * 28, w, h, {
        radius: 4, border: "rgba(224,195,124,0.6)", bg: "#1a1c14",
      });
      ctx.restore();
    }

    // 影子
    ctx.save();
    ctx.globalAlpha = 0.46;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + h * 0.54, w * 0.4, h * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 地面定位环
    const pulse = 0.9 + Math.sin(t * 3.2) * 0.1;
    ctx.save();
    ctx.translate(p.x, p.y + h * 0.52);
    ctx.scale(1, 0.34);
    ctx.strokeStyle = "rgba(224,195,124,0.55)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, (w * 0.52) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(224,195,124,0.22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, (w * 0.7) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 光晕
    ctx.save();
    const glow = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, w * 0.95);
    glow.addColorStop(0, "rgba(240,214,150,0.26)");
    glow.addColorStop(1, "rgba(240,214,150,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, w * 0.95, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const tilt = Math.cos(t * 6) * 0.02;
    const flick = p.invuln > 0 ? 0.55 + Math.abs(Math.sin(t * 40)) * 0.45 : 1;
    ctx.save();
    ctx.globalAlpha = flick;
    const tint = p.hurtT > 0.05 ? `rgba(255,80,60,${0.42 * p.hurtT})` : null;
    this.drawToken(art, p.x, p.y, w, h, {
      radius: 5,
      border: "#f0d696",
      borderW: 3,
      rot: tilt,
      tint,
      bg: "#1a1c14",
    });
    ctx.restore();

    // 头顶三角标记
    ctx.save();
    ctx.translate(p.x, p.y - h * 0.5 - 12);
    const bob = Math.sin(t * 4) * 2;
    ctx.fillStyle = "#f0d696";
    ctx.beginPath();
    ctx.moveTo(0, 7 + bob);
    ctx.lineTo(-6, -2 + bob);
    ctx.lineTo(6, -2 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const tgt = game.lockTarget && !game.lockTarget.dead ? game.lockTarget : game.nearestEnemy(p.x, p.y, S.range);
    if (tgt) {
      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.strokeStyle = "#e0c37c";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 9]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.stroke();
      ctx.restore();
    }

    // 手枪
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.aim);
    const rec = p.recoil * 4;
    ctx.fillStyle = "#2f3229";
    roundRect(ctx, 12 - rec, -3.6, 21, 7.2, 1.8);
    ctx.fill();
    ctx.fillStyle = "#d6cfb4";
    ctx.fillRect(29 - rec, -2.4, 6, 4.8);
    ctx.restore();
  }
}
