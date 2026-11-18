const KEY = "pistol-run-save-v1";

const DEFAULT = {
  best: 0,
  runs: 0,
  credits: 0,
  totalKills: 0,
  waveBest: 0,
  meta: {
    hpMax: 0,
    damage: 0,
    fireRate: 0,
    goldMult: 0,
    magnet: 0,
    dashCd: 0,
    speed: 0,
    armor: 0,
  },
};

export const META_UPGRADES = [
  {
    key: "hpMax",
    zh: "体质",
    desc: "生命上限 +10",
    icon: "556th",
    max: 8,
    cost: (lv) => 30 + lv * 26,
    art: "173rd_guard_rifles",
  },
  {
    key: "damage",
    zh: "弹药",
    desc: "杀伤 +6%",
    max: 10,
    cost: (lv) => 34 + lv * 30,
    art: "6_pounder",
  },
  {
    key: "fireRate",
    zh: "枪机",
    desc: "射速 +5%",
    max: 10,
    cost: (lv) => 32 + lv * 30,
    art: "no_9_commando",
  },
  {
    key: "goldMult",
    zh: "军需",
    desc: "军饷 +6%",
    max: 8,
    cost: (lv) => 26 + lv * 22,
    art: "home_guard",
  },
  {
    key: "magnet",
    zh: "拾取",
    desc: "拾取范围 +12",
    max: 6,
    cost: (lv) => 22 + lv * 18,
    art: "m20_scout_car",
  },
  {
    key: "dashCd",
    zh: "冲刺",
    desc: "冲刺冷却 -5%",
    max: 8,
    cost: (lv) => 30 + lv * 26,
    art: "no_1_commando",
  },
  {
    key: "speed",
    zh: "机动",
    desc: "移动速度 +4%",
    max: 8,
    cost: (lv) => 28 + lv * 24,
    art: "lovat_scouts",
  },
  {
    key: "armor",
    zh: "护甲",
    desc: "减伤 +3%",
    max: 8,
    cost: (lv) => 36 + lv * 32,
    art: "churchill_mk_iv",
  },
];

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const d = JSON.parse(raw);
    return {
      ...DEFAULT,
      ...d,
      meta: { ...DEFAULT.meta, ...(d.meta || {}) },
    };
  } catch {
    return structuredClone(DEFAULT);
  }
}

export function writeSave(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* 隐私模式下静默失败 */
  }
}

export function upgradeCost(up, lv) {
  return up.cost(lv);
}
