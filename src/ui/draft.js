import { BY_ID, cardEffect, NATION, TYPE_ZH } from "../data/cards.js";
import { draftUrl } from "../core/assets.js";

const RARITY_LABEL = {
  Standard: "标准",
  Limited: "限定",
  Special: "特殊",
  Elite: "精英",
};

const weight = { Standard: 58, Limited: 27, Special: 12, Elite: 3 };

let bag = null;
function getBag() {
  if (bag) return bag;
  bag = [];
  for (const id in BY_ID) {
    const c = BY_ID[id];
    const w = weight[c.rarity] || 10;
    for (let i = 0; i < w; i++) bag.push(c);
  }
  return bag;
}

export function makeDraft() {
  const b = getBag();
  const pool = [];
  const seen = new Set();
  let guard = 0;
  while (pool.length < 3 && guard++ < 600) {
    const c = b[(Math.random() * b.length) | 0];
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    pool.push(c);
  }
  return pool;
}

export function renderDraft(container, cards, owned, onPick) {
  container.innerHTML = "";
  cards.forEach((card, i) => {
    const eff = cardEffect(card);
    const ownedCount = owned.filter((b) => b.id === card.id).length;

    const btn = document.createElement("button");
    btn.className = "draft-card";
    btn.type = "button";
    btn.style.animationDelay = `${i * 0.07}s`;
    btn.setAttribute(
      "aria-label",
      `${card.zh}，${RARITY_LABEL[card.rarity]}，效果：${eff.lines.join("，")}`
    );

    const img = document.createElement("img");
    img.className = "face";
    img.src = draftUrl(card.id);
    img.alt = card.zh;
    img.draggable = false;
    img.onerror = () => {
      img.style.visibility = "hidden";
      btn.style.background = NATION[card.nation]?.color || "#2a2c22";
    };

    const rar = document.createElement("i");
    rar.className = "rar " + card.rarity;

    const buff = document.createElement("div");
    buff.className = "buff";
    const effEl = document.createElement("div");
    effEl.className = "effect";
    effEl.textContent = eff.lines.join(" · ");
    const tag = document.createElement("span");
    tag.className = "tag" + (ownedCount ? " stack" : "");
    tag.textContent = ownedCount ? `已叠加 ×${ownedCount}` : TYPE_ZH[card.type] || "强化";
    buff.append(effEl, tag);

    btn.append(img, rar, buff);
    btn.addEventListener("click", () => onPick(card, btn));
    container.appendChild(btn);
  });
}
