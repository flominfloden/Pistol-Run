// ─────────────────────────────────────────────────────────────────────
// KARDS 卡池。全部卡面 / 数值 / 中文文本来自 KARDS 官方卡牌数据。
// 每张卡在《小手枪快跑》里是一张「强化卡」：
//   兵种 → 强化方向，稀有度 → 强化档位，国家 → 词条风味
// ─────────────────────────────────────────────────────────────────────

export const RARITY_MULT = { Standard: 1, Limited: 1.28, Special: 1.62, Elite: 2.1 };

export const NATION = {
  USA: { zh: "美国", color: "#4a5d3a" },
  Soviet: { zh: "苏联", color: "#7a2a22" },
  Germany: { zh: "德国", color: "#3d4148" },
  Britain: { zh: "英国", color: "#2f3f56" },
  Japan: { zh: "日本", color: "#6a4a2a" },
  France: { zh: "法国", color: "#3b4a5c" },
  Italy: { zh: "意大利", color: "#4c5340" },
  Poland: { zh: "波兰", color: "#5a3a3a" },
  Finland: { zh: "芬兰", color: "#3a4a44" },
  Anzac: { zh: "澳新", color: "#4a4a3a" },
  Neutral: { zh: "中立", color: "#43443c" },
};

export const TYPE_ZH = {
  infantry: "步兵",
  tank: "坦克",
  artillery: "炮兵",
  fighter: "战斗机",
  bomber: "轰炸机",
  order: "指令",
  countermeasure: "反制",
};

// 每张卡的原始数据（id / 中文名 / 兵种 / 国家 / 稀有度 / 费用 / 攻 / 防）
export const CARDS = [
  ["no_9_commando", "第 9 突击队", "infantry", "Britain", "Standard", 1, 1, 1],
  ["no_10_commando", "第 10 突击队", "infantry", "Britain", "Limited", 2, 2, 1],
  ["no_1_commando", "第 1 突击队", "infantry", "Britain", "Limited", 2, 1, 3],
  ["no_3_commando", "第 3 突击队", "infantry", "Britain", "Special", 3, 3, 3],
  ["no_43_commando", "第 43 突击队", "infantry", "Britain", "Standard", 3, 3, 3],
  ["no_46_commando", "第 46 突击队", "infantry", "Britain", "Standard", 1, 1, 1],
  ["5th_rangers", "第 5 游骑兵营", "infantry", "USA", "Limited", 4, 4, 4],
  ["the_rangers", "游骑兵营", "infantry", "Britain", "Elite", 3, 2, 5],
  ["75th_rangers", "第 75 游骑兵团", "infantry", "USA", "Standard", 5, 4, 6],
  ["1st_cavalry_troop", "第 1 骑兵侦察小队", "infantry", "USA", "Limited", 2, 1, 4],
  ["36th_cavalry", "骑兵第 36 师", "infantry", "Soviet", "Limited", 6, 3, 3],
  ["8th_cavalry_regiment", "骑兵第 8 团", "infantry", "Soviet", "Standard", 3, 2, 3],
  ["24th_cavalry_regiment", "骑兵第 24 团", "infantry", "Soviet", "Standard", 4, 3, 4],
  ["40th_cavalry_regiment", "骑兵第 40 团", "infantry", "Soviet", "Standard", 3, 2, 3],
  ["60th_cavalry_regiment", "骑兵第 60 团", "infantry", "Soviet", "Standard", 4, 3, 4],
  ["15th_cavalry_regiment", "骑兵第十五联队", "infantry", "Japan", "Standard", 3, 2, 3],
  ["103rd_cavalry_recon", "第 103 骑兵侦察队", "infantry", "USA", "Standard", 2, 1, 3],
  ["lovat_scouts", "洛瓦特侦察兵团", "infantry", "Britain", "Limited", 2, 1, 4],
  ["commandos_kieffer", "基弗突击队", "infantry", "France", "Special", 2, 0, 1],
  ["112th_infantry_regiment", "第 112 步兵团", "infantry", "USA", "Standard", 2, 2, 3],
  ["102_grenadier", "第 102 掷弹兵团", "infantry", "Germany", "Standard", 2, 2, 3],
  ["28_jger_regiment", "第 28 猎兵团", "infantry", "Germany", "Standard", 3, 3, 3],
  ["128th_rifles", "步兵第 128 团", "infantry", "Soviet", "Standard", 2, 2, 3],
  ["554th_rifle_regiment", "步兵第 554 团", "infantry", "Soviet", "Standard", 1, 1, 2],
  ["173rd_guard_rifles", "近卫步兵第 173 团", "infantry", "Soviet", "Standard", 1, 1, 1],
  ["royal_fusiliers", "皇家燧发枪兵团", "infantry", "Britain", "Standard", 3, 0, 8],
  ["34th_infantry_regiment", "橘联队", "infantry", "Japan", "Standard", 3, 3, 3],
  ["118th_mixed_regiment", "步兵第百十八联队", "infantry", "Japan", "Standard", 4, 3, 4],
  ["under_fire", "枪林弹雨", "order", "Japan", "Standard", 3, 0, 0],
  ["mass_deployment", "大规模部署", "order", "USA", "Elite", 10, 0, 0],
  ["home_guard", "国土警卫队", "order", "Britain", "Standard", 1, 0, 0],
  ["sabotage", "毁坏", "order", "France", "Limited", 7, 0, 0],
  ["spy_ring", "间谍组织", "order", "Soviet", "Limited", 2, 0, 0],
  ["command_failure", "指挥不当", "order", "Japan", "Limited", 3, 0, 0],
  ["corps_command", "军司令部", "order", "Anzac", "Limited", 4, 0, 0],
  ["arming_the_resistance", "武装抵抗", "order", "France", "Special", 4, 0, 0],
  ["heroes_of_the_soviet_union", "苏联英雄", "order", "Soviet", "Elite", 2, 0, 0],
  ["desert_raid", "沙漠突袭", "order", "Britain", "Special", 2, 0, 0],
  ["desert_push", "沙漠推进", "order", "Italy", "Standard", 1, 0, 0],
  ["partisans", "游击队", "order", "Soviet", "Special", 6, 0, 0],
  ["katyusha", "喀秋莎", "artillery", "Soviet", "Limited", 2, 1, 2],
  ["6_pounder", "6 磅炮", "artillery", "Britain", "Standard", 3, 2, 1],
  ["17_pounder", "17 磅炮", "artillery", "Britain", "Limited", 4, 2, 3],
  ["25_pounder", "25 磅炮", "artillery", "Britain", "Standard", 4, 2, 3],
  ["88_mm_flak", "88 毫米高射炮", "artillery", "Germany", "Limited", 6, 3, 4],
  ["b4_203mm_howitzer", "203 毫米榴弹炮", "artillery", "Soviet", "Special", 5, 2, 3],
  ["hummel", "野蜂自行火炮", "artillery", "Germany", "Standard", 4, 2, 3],
  ["wespe", "黄蜂自行火炮", "artillery", "Germany", "Standard", 3, 2, 2],
  ["su_152", "SU-152", "tank", "Soviet", "Limited", 4, 4, 4],
  ["isu152", "ISU-152", "tank", "Soviet", "Elite", 9, 6, 4],
  ["t34_1942", "T-34 1942", "tank", "Soviet", "Standard", 5, 5, 5],
  ["t3485", "T-34-85", "tank", "Soviet", "Standard", 5, 5, 5],
  ["kv2", "KV-2", "tank", "Soviet", "Special", 7, 7, 5],
  ["kv1_1941", "KV-1 1941", "tank", "Soviet", "Elite", 6, 3, 6],
  ["kv1s", "KV-1S", "tank", "Soviet", "Standard", 6, 4, 5],
  ["kv85", "KV-85", "tank", "Soviet", "Standard", 6, 5, 5],
  ["m4_sherman", "M4 谢尔曼", "tank", "USA", "Standard", 4, 4, 4],
  ["m26_pershing", "M26 潘兴", "tank", "USA", "Elite", 10, 8, 8],
  ["m8_greyhound", "M8 灰狗", "tank", "USA", "Standard", 1, 1, 3],
  ["m10_wolverine", "M10 狼獾", "tank", "USA", "Special", 2, 3, 2],
  ["m20_scout_car", "M20 侦察车", "tank", "USA", "Limited", 1, 1, 3],
  ["churchill_mk_iv", "丘吉尔 Mk IV", "tank", "Britain", "Standard", 5, 2, 7],
  ["matilda_mk_ii", "玛蒂尔达 Mk II", "tank", "Britain", "Standard", 4, 3, 5],
  ["panther_d", "豹式坦克 D 型", "tank", "Germany", "Elite", 7, 7, 6],
  ["panther_g", "豹式坦克 G 型", "tank", "Germany", "Special", 5, 6, 5],
  ["panther_a", "豹式坦克 A 型", "tank", "Germany", "Special", 5, 5, 5],
  ["tiger_ie", "虎式坦克 E 型", "tank", "Germany", "Elite", 8, 7, 7],
  ["tiger_ih", "虎式坦克 H 型", "tank", "Germany", "Special", 8, 8, 8],
  ["stug_iiig", "三号突击炮 G 型", "tank", "Germany", "Standard", 4, 3, 4],
  ["jagdpanther", "猎豹坦克歼击车", "tank", "Germany", "Elite", 7, 6, 6],
  ["marder_iii_h", "三号 M 型自行反坦克炮", "tank", "Germany", "Standard", 3, 3, 3],
  ["spitfire_mk_ia", "喷火 Mk Ia", "fighter", "Britain", "Standard", 5, 5, 5],
  ["hurricane_mk_iia", "飓风 Mk IIA", "fighter", "Britain", "Standard", 5, 4, 4],
  ["a6m2_zero", "A6M2 零战", "fighter", "Japan", "Standard", 4, 4, 4],
  ["b17_flying_fortress", "B-17 飞行堡垒", "bomber", "USA", "Special", 8, 5, 5],
  ["ju_87_b_stuka", "Ju 87 B 斯图卡", "bomber", "Germany", "Standard", 4, 3, 2],
  ["fw_190_a", "Fw 190 A", "fighter", "Germany", "Standard", 5, 5, 5],
].map(([id, zh, type, nation, rarity, cost, atk, def]) => ({
  id, zh, type, nation, rarity, cost, atk, def,
}));

export const BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

// ── 强化定义 ─────────────────────────────────────────────────────────
// 每张卡根据「兵种 + 稀有度 + id 哈希」生成一个稳定的强化效果。

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

const STAT_LABEL = {
  pellets: "齐射",
  fireRate: "射速",
  damage: "杀伤",
  hpMax: "生命上限",
  armor: "减伤",
  speed: "移速",
  dashCd: "冲刺冷却",
  bulletSpeed: "弹速",
  range: "射程",
  pierce: "穿透",
  crit: "暴击率",
  critMult: "暴击伤害",
  explosive: "爆破",
  lifesteal: "缴获生命",
  goldMult: "军饷",
  magnet: "拾取范围",
  drone: "僚机",
  ricochet: "跳弹",
  spreadTight: "精度",
};

// 兵种模板：[stat, 每档基础值, 展示用文案(取整后)]
// 数值口径：比例类按小数（0.16 = +16%），平加类按点数
const TEMPLATES = {
  infantry: [
    ["fireRate", 0.15, (v) => `射速 +${Math.round(v * 100)}%`],
    ["pellets", 0.4, (v) => `齐射 +${Math.max(1, Math.round(v))}`],
    ["crit", 0.05, (v) => `暴击率 +${Math.round(v * 100)}%`],
  ],
  tank: [
    ["hpMax", 16, (v) => `生命上限 +${Math.round(v)}`],
    ["armor", 0.06, (v) => `减伤 +${Math.round(v * 100)}%`],
    ["pellets", 0.34, (v) => `齐射 +${Math.max(1, Math.round(v))}`],
  ],
  artillery: [
    ["damage", 0.18, (v) => `杀伤 +${Math.round(v * 100)}%`],
    ["explosive", 14, (v) => `子弹爆破 +${Math.round(v)}`],
    ["range", 40, (v) => `射程 +${Math.round(v)}`],
  ],
  fighter: [
    ["speed", 0.07, (v) => `移动速度 +${Math.round(v * 100)}%`],
    ["dashCd", 0.1, (v) => `冲刺冷却 -${Math.round(v * 100)}%`],
    ["bulletSpeed", 0.08, (v) => `弹速 +${Math.round(v * 100)}%`],
  ],
  bomber: [
    ["drone", 0.45, (v) => `僚机 +${Math.max(1, Math.round(v))}`],
    ["pierce", 0.42, (v) => `穿透 +${Math.max(1, Math.round(v))}`],
    ["bulletSpeed", 0.07, (v) => `弹速 +${Math.round(v * 100)}%`],
  ],
  order: [
    ["goldMult", 0.2, (v) => `军饷 +${Math.round(v * 100)}%`],
    ["lifesteal", 0.05, (v) => `伤害缴获生命 ${Math.round(v * 100)}%`],
    ["magnet", 34, (v) => `拾取范围 +${Math.round(v)}`],
  ],
  countermeasure: [
    ["ricochet", 0.4, (v) => `跳弹 +${Math.max(1, Math.round(v))}`],
    ["armor", 0.05, (v) => `减伤 +${Math.round(v * 100)}%`],
    ["crit", 0.04, (v) => `暴击率 +${Math.round(v * 100)}%`],
  ],
};

// 国家附加词条（小加成，提供收藏风味）
const NATION_BONUS = {
  Soviet: ["damage", 0.05],
  Germany: ["pierce", 0.2],
  USA: ["goldMult", 0.06],
  Britain: ["armor", 0.03],
  Japan: ["speed", 0.04],
  France: ["crit", 0.02],
  Italy: ["range", 16],
  Poland: ["armor", 0.025],
  Finland: ["bulletSpeed", 0.04],
  Anzac: ["magnet", 14],
  Neutral: ["goldMult", 0.04],
};

export function cardEffect(card) {
  const tpl = TEMPLATES[card.type] || TEMPLATES.infantry;
  const mult = RARITY_MULT[card.rarity] || 1;
  const pick = tpl[hash(card.id) % tpl.length];
  const amount = pick[1] * mult;
  const bonus = NATION_BONUS[card.nation] || ["goldMult", 0.04];

  const lines = [pick[2](amount)];
  if (bonus[1]) lines.push(STAT_LABEL[bonus[0]] + " +" + fmtStat(bonus[0], bonus[1] * mult));

  return {
    stat: pick[0],
    amount,
    extra: { stat: bonus[0], amount: bonus[1] * mult },
    lines,
    label: pick[2](amount),
  };
}

function fmtStat(stat, v) {
  if (["armor", "crit", "goldMult", "lifesteal", "fireRate", "dashCd", "spreadTight", "damage", "speed", "bulletSpeed"].includes(stat)) {
    return Math.round(v * 100) + "%";
  }
  return String(Math.round(v));
}

export { STAT_LABEL, fmtStat, hash };
