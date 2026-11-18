import { artUrl } from "../core/assets.js";
import { BY_ID } from "../data/cards.js";

const $ = (id) => document.getElementById(id);

export class Hud {
  constructor() {
    this.wave = $("hud-wave");
    this.score = $("hud-score");
    this.gold = $("hud-gold");
    this.plate = $("hp-plate");
    this.load = $("load-row");
    this.dashFill = $("dash-fill");
    this.dashText = $("dash-text");
    this.toastEl = $("toast");
    this.root = $("hud");
    this.bossBar = $("boss-bar");
    this.bossName = $("boss-name");
    this.bossFill = $("boss-fill");
    this.lastBuild = 0;
    this._toastT = 0;
    this._pipCache = new Map();
  }

  show() {
    this.root.classList.add("live");
  }

  hide() {
    this.root.classList.remove("live");
  }

  set(wave, score, gold) {
    this.wave.textContent = wave;
    this.score.textContent = formatNum(score);
    this.gold.textContent = gold;
  }

  setHp(hp, hpMax) {
    const cells = 10;
    const filled = Math.ceil((hp / hpMax) * cells);
    if (this.plate.childElementCount !== cells) {
      this.plate.innerHTML = "";
      for (let i = 0; i < cells; i++) {
        const d = document.createElement("i");
        d.style.cssText =
          "width:19px;height:7px;background:rgba(232,226,207,0.13);border:1px solid rgba(232,226,207,0.2);display:block;transition:background .18s";
        this.plate.appendChild(d);
      }
    }
    const low = hp / hpMax < 0.3;
    for (let i = 0; i < cells; i++) {
      const cell = this.plate.children[i];
      const on = i < filled;
      cell.style.background = on
        ? low
          ? "#c2513c"
          : "#b99a52"
        : "rgba(232,226,207,0.1)";
      cell.style.borderColor = on ? "rgba(232,226,207,0.4)" : "rgba(232,226,207,0.16)";
    }
  }

  setDash(k) {
    this.dashFill.style.transform = `scaleX(${Math.max(0, Math.min(1, k))})`;
    this.dashText.textContent = k >= 1 ? "冲刺就绪" : "装填中";
    this.dashFill.style.background = k >= 1 ? "#b99a52" : "#5e5842";
  }

  setBuild(build) {
    if (build.length === this.lastBuild) return;
    this.lastBuild = build.length;
    // 只显示最近 8 个，按 id 聚合
    const agg = new Map();
    for (const b of build) {
      const e = agg.get(b.id);
      if (e) e.n++;
      else agg.set(b.id, { id: b.id, n: 1, rarity: b.rarity });
    }
    const list = [...agg.values()].slice(-8);
    this.load.innerHTML = "";
    for (const it of list) {
      const d = document.createElement("div");
      d.className = "token fresh";
      const img = document.createElement("img");
      img.src = artUrl(it.id);
      img.alt = BY_ID[it.id]?.zh || it.id;
      img.loading = "lazy";
      const b = document.createElement("b");
      b.textContent = it.n;
      d.append(img, b);
      this.load.appendChild(d);
    }
  }

  setBoss(boss) {
    if (!boss) {
      this.bossBar.classList.add("hidden");
      return;
    }
    this.bossBar.classList.remove("hidden");
    this.bossName.textContent = boss.name || BY_ID[boss.id]?.zh || "BOSS";
    this.bossFill.style.transform = `scaleX(${Math.max(0, boss.hp / boss.hpMax)})`;
  }

  toast(msg, ms = 1500) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add("show");
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => this.toastEl.classList.remove("show"), ms);
  }
}

export function formatNum(n) {
  if (n >= 100000) return (n / 1000).toFixed(0) + "k";
  return String(Math.round(n));
}
