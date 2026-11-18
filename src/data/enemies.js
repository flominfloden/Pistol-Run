// 敌军阵容。只用 KARDS 卡牌，按兵种决定行为。
// type: infantry / tank / artillery / fighter / bomber
export const ENEMY_UNITS = {
  // ── 步兵：稳步推进，进入射程后点射 ──
  infantry: [
    "554th_rifle_regiment", "128th_rifles", "173rd_guard_rifles", "112th_infantry_regiment",
    "102_grenadier", "28_jger_regiment", "34th_infantry_regiment", "118th_mixed_regiment",
    "royal_fusiliers", "15th_cavalry_regiment", "8th_cavalry_regiment",
    "24th_cavalry_regiment", "40th_cavalry_regiment", "60th_cavalry_regiment",
    "36th_cavalry", "103rd_cavalry_recon",
  ],
  // ── 坦克：慢、厚、直射穿甲弹 ──
  tank: [
    "t34_1942", "t3485", "kv1s", "kv85", "kv2", "kv1_1941",
    "m4_sherman", "m8_greyhound", "m20_scout_car", "m10_wolverine",
    "churchill_mk_iv", "matilda_mk_ii",
    "panther_a", "panther_d", "panther_g", "tiger_ie", "tiger_ih",
    "stug_iiig", "marder_iii_h", "su_152",
  ],
  // ── 炮兵：停在后方，抛射带落点预警的炮弹 ──
  artillery: [
    "katyusha", "6_pounder", "17_pounder", "25_pounder", "88_mm_flak",
    "hummel", "wespe", "b4_203mm_howitzer",
  ],
  // ── 战斗机：高速俯冲横穿，连发 ──
  fighter: ["spitfire_mk_ia", "hurricane_mk_iia", "a6m2_zero", "fw_190_a"],
  // ── 轰炸机：横穿投弹 ──
  bomber: ["ju_87_b_stuka", "b17_flying_fortress"],
};

export const BOSSES = [
  { id: "tiger_ie", name: "虎式坦克 E 型", kind: "tank" },
  { id: "km_bismarck", name: "KM 俾斯麦号", kind: "ship" },
  { id: "king_tiger", name: "虎王坦克", kind: "tank" },
  { id: "ijn_yamato", name: "IJN 大和号", kind: "ship" },
  { id: "b4_203mm_howitzer", name: "203 毫米榴弹炮", kind: "artillery" },
];

export const ALL_ENEMY_IDS = new Set([
  ...ENEMY_UNITS.infantry,
  ...ENEMY_UNITS.tank,
  ...ENEMY_UNITS.artillery,
  ...ENEMY_UNITS.fighter,
  ...ENEMY_UNITS.bomber,
  ...BOSSES.map((b) => b.id),
]);
