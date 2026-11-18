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
    img.alt = card.zh;
    img.draggable = false;

    // 先用国家色占位，图到了自然顶上；慢网下也不会看起来像卡死
    btn.style.background = NATION[card.nation]?.color || "#2a2c22";
    img.style.opacity = "0";
    img.style.transition = "opacity .18s";
    img.onload = () => {
      img.style.opacity = "1";
      fallback.style.opacity = "0";
    };
    img.onerror = () => {
      img.remove();
    };
    img.src = draftUrl(card.id);

    const rar = document.createElement("i");
    rar.className = "rar " + card.rarity;

    // 占位态：图没到也能看清是哪张卡
    const fallback = document.createElement("div");
    fallback.className = "skel";
    fallback.innerHTML =
      `<span class="skel-cost">${card.cost}</span>` +
      `<span class="skel-name">${card.zh}</span>` +
      `<span class="skel-type">${TYPE_ZH[card.type] || ""} · ${RARITY_LABEL[card.rarity]}</span>`;

    const buff = document.createElement("div");
    buff.className = "buff";
    const effEl = document.createElement("div");
    effEl.className = "effect";
    effEl.textContent = eff.lines.join(" · ");
    const tag = document.createElement("span");
    tag.className = "tag" + (ownedCount ? " stack" : "");
    tag.textContent = ownedCount ? `已叠加 ×${ownedCount}` : TYPE_ZH[card.type] || "强化";
    buff.append(effEl, tag);

    btn.append(fallback, img, rar, buff);
    btn.addEventListener("click", () => onPick(card, btn));
    container.appendChild(btn);
  });
}
