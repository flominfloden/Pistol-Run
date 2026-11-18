import "./style.css";
import { Game } from "./core/game.js";
import { Renderer } from "./core/renderer.js";
import { Input } from "./core/input.js";
import { preloadCritical, preloadRest, preloadFaces, preloadDraft, artUrl } from "./core/assets.js";
import { initAudio, resumeAudio, play } from "./core/audio.js";
import { loadSave, writeSave, META_UPGRADES } from "./core/save.js";
import { Hud, formatNum } from "./ui/hud.js";
import { makeDraft, renderDraft } from "./ui/draft.js";
import { CARDS, BY_ID, NATION, TYPE_ZH } from "./data/cards.js";
import { ALL_ENEMY_IDS, ENEMY_UNITS, BOSSES } from "./data/enemies.js";

const $ = (id) => document.getElementById(id);

const BG_NAMES = ["field_ardennes", "field_bryansk", "field_moscow", "field_elalamein"];
const FACE_IDS = [
  ...new Set([
    ...Object.values(ENEMY_UNITS).flat(),
    ...BOSSES.map((b) => b.id),
    ...CARDS.map((c) => c.id),
    "no_10_commando",
    "no_9_commando",
  ]),
];

class App {
  constructor() {
    this.canvas = $("stage");
    this.renderer = new Renderer(this.canvas);
    this.hud = new Hud();
    this.input = new Input(this.canvas);
    this.save = loadSave();

    this.state = "menu"; // menu | playing | draft | over | meta | help
    this.game = null;
    this.bgName = BG_NAMES[0];
    this.pendingWaveClear = false;
    this.raf = 0;
    this.lastT = 0;
    this.draftCards = [];
    this.paused = false;

    this.bindUI();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("orientationchange", () => setTimeout(() => this.resize(), 120));

    this.updateMenuStats();
    this.renderMeta();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);

    this.startPreload();
  }

  async startPreload() {
    // 菜单只等一张背景，别让首屏卡在网络上
    await preloadCritical("no_10_commando", BG_NAMES[0]);
    this.ready = true;
    // 其余资源后台悄悄补，不阻塞任何操作
    preloadRest(FACE_IDS, BG_NAMES[0]).then(() => {
      preloadFaces(FACE_IDS);
      preloadDraft(CARDS.map((c) => c.id));
    });
  }

  resize() {
    const r = this.renderer.resize();
    if (this.game) this.game.resize(r.worldW, r.worldH);
  }

  // ── UI 绑定 ─────────────────────────────────────────────────────
  bindUI() {
    $("btn-start").addEventListener("click", () => this.startRun());
    $("btn-again").addEventListener("click", () => this.startRun());
    $("btn-home").addEventListener("click", () => this.toMenu());

    $("btn-meta").addEventListener("click", () => this.openMeta());
    $("btn-meta-close").addEventListener("click", () => this.closeMeta());
    $("btn-help").addEventListener("click", () => this.openHelp());
    $("btn-help-close").addEventListener("click", () => this.closeHelp());

    $("btn-reroll").addEventListener("click", () => this.reroll());
    $("btn-skip").addEventListener("click", () => this.skipDraft());

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.state === "playing") this.paused = true;
      else if (!document.hidden) this.paused = false;
    });
  }

  updateMenuStats() {
    $("meta-best").textContent = formatNum(this.save.best);
    $("meta-runs").textContent = this.save.runs;
    $("meta-credits").textContent = this.save.credits;
  }

  renderMeta() {
    const list = $("meta-list");
    list.innerHTML = "";
    $("meta-credits-2").textContent = this.save.credits;
    for (const up of META_UPGRADES) {
      const lv = this.save.meta[up.key] || 0;
      const maxed = lv >= up.max;
      const cost = up.cost(lv);

      const row = document.createElement("div");
      row.className = "meta-row";

      const img = document.createElement("img");
      img.className = "ico";
      img.src = artUrl(up.art);
      img.alt = "";

      const body = document.createElement("div");
      const h = document.createElement("h4");
      h.textContent = up.zh;
      if (lv > 0) {
        const s = document.createElement("span");
        s.className = "lv";
        s.textContent = "Lv." + lv;
        h.appendChild(s);
      }
      const p = document.createElement("p");
      p.textContent = up.desc;
      body.append(h, p);

      const btn = document.createElement("button");
      btn.className = "meta-buy";
      btn.type = "button";
      btn.textContent = maxed ? "已满级" : `${cost} 军功`;
      btn.disabled = maxed || this.save.credits < cost;
      btn.addEventListener("click", () => {
        const c = up.cost(this.save.meta[up.key] || 0);
        if (this.save.credits >= c && (this.save.meta[up.key] || 0) < up.max) {
          this.save.credits -= c;
          this.save.meta[up.key] = (this.save.meta[up.key] || 0) + 1;
          writeSave(this.save);
          this.renderMeta();
          this.updateMenuStats();
          play("gold", { gain: 0.32, rate: 1.2, throttleMs: 10 });
        }
      });

      row.append(img, body, btn);
      list.appendChild(row);
    }
  }

  openMeta() {
    this.state = "meta";
    $("menu").classList.add("hidden");
    $("meta").classList.remove("hidden");
    this.renderMeta();
  }

  closeMeta() {
    $("meta").classList.add("hidden");
    $("menu").classList.remove("hidden");
    this.state = "menu";
    this.updateMenuStats();
  }

  openHelp() {
    $("help").classList.remove("hidden");
  }

  closeHelp() {
    $("help").classList.add("hidden");
  }

  // ── 流程 ────────────────────────────────────────────────────────
  async startRun() {
    if (this._starting) return;
    this._starting = true;

    initAudio();
    resumeAudio();
    play("pack", { gain: 0.3, rate: 1.15, throttleMs: 0 });

    // 加载态：慢网下也要让玩家看到反应
    const startBtn = $("btn-start");
    const startLabel = startBtn.textContent;
    startBtn.disabled = true;
    startBtn.textContent = "装载中";

    $("menu").classList.add("hidden");
    $("over").classList.add("hidden");
    $("draft").classList.add("hidden");

    try {
      this.bgName = BG_NAMES[(Math.random() * BG_NAMES.length) | 0];
      // 只等背景 + 主角原画，其余在后台补，避免慢网下白屏几十秒
      await preloadCritical("no_10_commando", this.bgName);
      preloadRest(FACE_IDS, this.bgName);

      this.hud.show();
      this.hud.setBoss(null);

      this.game = new Game({
        meta: this.save.meta,
        worldW: this.renderer.worldW,
        worldH: this.renderer.worldH,
        onEvent: (ev) => this.onGameEvent(ev),
      });
      this.save.runs++;
      writeSave(this.save);

      this.state = "playing";
      this.pendingWaveClear = false;
      this.game.start();
    } finally {
      startBtn.disabled = false;
      startBtn.textContent = startLabel;
      this._starting = false;
    }

    this.hud.set(1, 0, 0);
    this.hud.setBuild([]);
    this.hud.setHp(this.game.player.hp, this.game.player.hpMax);
    this.hud.toast("战斗开始", 1100);
  }

  onGameEvent(ev) {
    if (ev.t === "wave") {
      this.hud.toast(`第 ${ev.wave} 波`, 1200);
      this.pendingWaveClear = false;
    } else if (ev.t === "boss") {
      this.hud.toast("敌军指挥官登场", 1600);
      play("hq_voice", { gain: 0.28, rate: 0.95, throttleMs: 0 });
      this.hud.setBoss(ev.boss);
    } else if (ev.t === "bossDown") {
      this.hud.setBoss(null);
      this.hud.toast("指挥官已被击毁", 1500);
    } else if (ev.t === "card") {
      // HUD 在下一帧同步
    } else if (ev.t === "waveClear") {
      this.pendingWaveClear = true;
      this.openDraft(ev.wave);
    } else if (ev.t === "dead") {
      this.onDead();
    }
  }

  openDraft(wave) {
    this.state = "draft";
    this.hud.hide();
    this.hud.setBoss(null);
    this.draftCards = makeDraft();

    const show = () => {
      $("draft-kicker").textContent = `第 ${wave} 波肃清`;
      $("reroll-cost").textContent = this.game.rerollCost;
      $("btn-reroll").disabled = this.game.gold < this.game.rerollCost;
      $("draft").classList.remove("hidden");
      renderDraft($("draft-cards"), this.draftCards, this.game.build, (card, el) => {
        this.pickCard(card, el);
      });
      play("flip", { gain: 0.35, rate: 1.0, throttleMs: 0 });
    };

    // 卡面到手再显示，慢网下也看不到空白卡
    preloadDraft(this.draftCards.map((c) => c.id)).then(show);
  }

  pickCard(card, el) {
    if (this.state !== "draft") return;
    this.state = "transition";
    el.style.transform = "translateY(-24px) scale(1.06)";
    this.game.addCard(card);
    this.hud.setBuild(this.game.build);
    play("veteran", { gain: 0.42, rate: 1.0, throttleMs: 0 });
    setTimeout(() => {
      $("draft").classList.add("hidden");
      this.hud.show();
      this.resumeAfterDraft();
    }, 320);
  }

  reroll() {
    if (this.state !== "draft") return;
    const cost = this.game.rerollCost;
    if (this.game.gold < cost) return;
    this.game.gold -= cost;
    this.game.rerollCost = Math.round(cost * 1.7);
    $("reroll-cost").textContent = this.game.rerollCost;
    $("btn-reroll").disabled = this.game.gold < this.game.rerollCost;
    this.draftCards = makeDraft();
    preloadDraft(this.draftCards.map((c) => c.id)).then(() => {
      renderDraft($("draft-cards"), this.draftCards, this.game.build, (card, el) => {
        this.pickCard(card, el);
      });
      play("flip", { gain: 0.3, rate: 1.25, throttleMs: 0 });
    });
  }

  skipDraft() {
    if (this.state !== "draft") return;
    this.game.gold += 40;
    this.game.rerollCost = 25;
    this.state = "transition";
    $("draft").classList.add("hidden");
    this.hud.show();
    play("gold", { gain: 0.35, rate: 1.0, throttleMs: 0 });
    this.resumeAfterDraft();
  }

  resumeAfterDraft() {
    this.state = "playing";
    this.pendingWaveClear = false;
    this.game.nextWave();
    this.game.running = true;
    this.hud.setHp(this.game.player.hp, this.game.player.hpMax);
  }

  onDead() {
    this.state = "over";
    this.hud.hide();
    const credits = Math.max(1, Math.round(this.game.score / 260));
    if (this.game.score > this.save.best) this.save.best = this.game.score;
    if (this.game.wave > this.save.waveBest) this.save.waveBest = this.game.wave;
    this.save.credits += credits;
    this.save.totalKills += this.game.kills;
    writeSave(this.save);

    $("over-title").textContent = this.game.wave >= 8 ? "战线守住了" : "战线失守";
    $("over-sub").textContent = `你在第 ${this.game.wave} 波被击倒。`;
    $("over-score").textContent = formatNum(this.game.score);
    $("over-wave").textContent = this.game.wave;
    $("over-kills").textContent = this.game.kills;
    $("over-credits").textContent = "+" + credits;

    const bd = $("over-build");
    bd.innerHTML = "";
    const agg = new Map();
    for (const b of this.game.build) {
      const e = agg.get(b.id);
      if (e) e.n++;
      else agg.set(b.id, { id: b.id, n: 1 });
    }
    for (const it of agg.values()) {
      const d = document.createElement("div");
      d.className = "pip";
      const img = document.createElement("img");
      img.src = artUrl(it.id);
      img.alt = "";
      const s = document.createElement("span");
      s.textContent = (BY_ID[it.id]?.zh || it.id) + (it.n > 1 ? ` ×${it.n}` : "");
      d.append(img, s);
      bd.appendChild(d);
    }

    setTimeout(() => $("over").classList.remove("hidden"), 620);
    this.updateMenuStats();
  }

  toMenu() {
    this.state = "menu";
    $("over").classList.add("hidden");
    $("draft").classList.add("hidden");
    $("menu").classList.remove("hidden");
    this.hud.hide();
    this.hud.setBoss(null);
    this.game = null;
    this.updateMenuStats();
  }

  // ── 循环 ────────────────────────────────────────────────────────
  loop(ts) {
    this.raf = requestAnimationFrame(this.loop);
    const dt = this.lastT ? Math.min(0.05, (ts - this.lastT) / 1000) : 0.016;
    this.lastT = ts;

    const r = this.renderer;
    r.t += dt;

    if (this.game && (this.state === "playing" || this.state === "draft" || this.state === "over")) {
      const g = this.game;

      if (this.state === "playing" && !this.paused) {
        g.setInput(this.input.sample(r.scale, 0));
        g.update(dt);
      } else {
        g.setInput({ x: 0, y: 0, dash: false });
        if (this.state !== "draft") g.update(dt * 0.35);
      }

      // 单屏竞技场：相机固定，只保留打击位移
      r.begin(0, g.shake);
      r.drawBackground(g, this.bgName);
      r.draw(g, this.state);
      r.endScreenspace();

      // HUD 同步
      if (this.state === "playing") {
        this.hud.set(g.wave, g.score, g.gold);
        this.hud.setHp(g.player.hp, g.player.hpMax);
        this.hud.setDash(1 - g.player.dashCdT / g.S.dashCd);
        if (g.boss) this.hud.setBoss(g.boss);
        this.hud.setBuild(g.build);
      }
    } else {
      // 菜单背景
      r.begin(0, 0);
      r.drawBackground({ groundScroll: ts * 0.02, time: ts / 1000 }, this.bgName);
      r.endScreenspace();
    }
  }
}

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

const app = new App();
window.__pistol = app;
