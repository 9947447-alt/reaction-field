/**
 * B2-R1 规范离子只读静态数据表
 * 依据 docs/PHASE22_B2_R1_RULE_FREEZE.md §2.1 & §2.2
 */

import type {
  B2R1AnionId,
  B2R1CationId,
  B2R1IonDefinition,
  B2R1IonId,
} from "./types";

/**
 * 阳离子只读定义列表（13 种，严格对齐 §2.1）
 */
export const B2R1_CATION_DEFINITIONS: readonly B2R1IonDefinition[] = Object.freeze([
  Object.freeze({
    id: "H+",
    formula: "H+",
    displayFormula: "H⁺",
    nameZh: "氢离子",
    nameEn: "Hydrogen ion",
    charge: 1,
    kind: "cation",
    typicalUses: "中和、稀酸 DIY、氧化还原（酸性介质）",
  }),
  Object.freeze({
    id: "NH4+",
    formula: "NH4+",
    displayFormula: "NH₄⁺",
    nameZh: "铵根离子",
    nameEn: "Ammonium ion",
    charge: 1,
    kind: "cation",
    typicalUses: "盐构建；与 OH⁻【加热】产 NH₃（离子手册进阶，沉淀窗口可后置）",
  }),
  Object.freeze({
    id: "Na+",
    formula: "Na+",
    displayFormula: "Na⁺",
    nameZh: "钠离子",
    nameEn: "Sodium ion",
    charge: 1,
    kind: "cation",
    typicalUses: "可溶性盐、碱",
  }),
  Object.freeze({
    id: "K+",
    formula: "K+",
    displayFormula: "K⁺",
    nameZh: "钾离子",
    nameEn: "Potassium ion",
    charge: 1,
    kind: "cation",
    typicalUses: "可溶性盐、碱",
  }),
  Object.freeze({
    id: "Ca2+",
    formula: "Ca2+",
    displayFormula: "Ca²⁺",
    nameZh: "钙离子",
    nameEn: "Calcium ion",
    charge: 2,
    kind: "cation",
    typicalUses: "盐、石灰水、碳酸钙沉淀链",
  }),
  Object.freeze({
    id: "Mg2+",
    formula: "Mg2+",
    displayFormula: "Mg²⁺",
    nameZh: "镁离子",
    nameEn: "Magnesium ion",
    charge: 2,
    kind: "cation",
    typicalUses: "金属置换、盐构建",
  }),
  Object.freeze({
    id: "Ba2+",
    formula: "Ba2+",
    displayFormula: "Ba²⁺",
    nameZh: "钡离子",
    nameEn: "Barium ion",
    charge: 2,
    kind: "cation",
    typicalUses: "硫酸根 / 碳酸根沉淀、盐构建",
  }),
  Object.freeze({
    id: "Al3+",
    formula: "Al3+",
    displayFormula: "Al³⁺",
    nameZh: "铝离子",
    nameEn: "Aluminium ion",
    charge: 3,
    kind: "cation",
    typicalUses: "盐、两性氢氧化物链（过量碱溶解可后置）",
  }),
  Object.freeze({
    id: "Fe2+",
    formula: "Fe2+",
    displayFormula: "Fe²⁺",
    nameZh: "亚铁离子",
    nameEn: "Ferrous ion",
    charge: 2,
    kind: "cation",
    typicalUses: "盐、氢氧化物沉淀、氧化还原",
  }),
  Object.freeze({
    id: "Fe3+",
    formula: "Fe3+",
    displayFormula: "Fe³⁺",
    nameZh: "铁离子",
    nameEn: "Ferric ion",
    charge: 3,
    kind: "cation",
    typicalUses: "盐、氢氧化物沉淀、氧化还原",
  }),
  Object.freeze({
    id: "Zn2+",
    formula: "Zn2+",
    displayFormula: "Zn²⁺",
    nameZh: "锌离子",
    nameEn: "Zinc ion",
    charge: 2,
    kind: "cation",
    typicalUses: "盐、置换、氢氧化物",
  }),
  Object.freeze({
    id: "Cu2+",
    formula: "Cu2+",
    displayFormula: "Cu²⁺",
    nameZh: "铜离子",
    nameEn: "Copper(II) ion",
    charge: 2,
    kind: "cation",
    typicalUses: "盐、置换、氢氧化物",
  }),
  Object.freeze({
    id: "Ag+",
    formula: "Ag+",
    displayFormula: "Ag⁺",
    nameZh: "银离子",
    nameEn: "Silver ion",
    charge: 1,
    kind: "cation",
    typicalUses: "盐、卤化物沉淀、硝酸银来源",
  }),
]);

/**
 * 阴离子只读定义列表（8 种，严格对齐 §2.2）
 */
export const B2R1_ANION_DEFINITIONS: readonly B2R1IonDefinition[] = Object.freeze([
  Object.freeze({
    id: "OH-",
    formula: "OH-",
    displayFormula: "OH⁻",
    nameZh: "氢氧根离子",
    nameEn: "Hydroxide ion",
    charge: -1,
    kind: "anion",
    typicalUses: "中和、稀碱 DIY、沉淀、SO₂ 吸收",
  }),
  Object.freeze({
    id: "Cl-",
    formula: "Cl-",
    displayFormula: "Cl⁻",
    nameZh: "氯离子",
    nameEn: "Chloride ion",
    charge: -1,
    kind: "anion",
    typicalUses: "盐、稀 HCl DIY、卤素检验",
    isHalogen: true,
  }),
  Object.freeze({
    id: "NO3-",
    formula: "NO3-",
    displayFormula: "NO₃⁻",
    nameZh: "硝酸根离子",
    nameEn: "Nitrate ion",
    charge: -1,
    kind: "anion",
    typicalUses: "硝酸盐构建；单独不与上表阳离子触发沉淀（离子手册限制）",
  }),
  Object.freeze({
    id: "CO32-",
    formula: "CO3^2-",
    displayFormula: "CO₃²⁻",
    nameZh: "碳酸根离子",
    nameEn: "Carbonate ion",
    charge: -2,
    kind: "anion",
    typicalUses: "碳酸盐、CO₂ 气体链",
  }),
  Object.freeze({
    id: "SO42-",
    formula: "SO4^2-",
    displayFormula: "SO₄²⁻",
    nameZh: "硫酸根离子",
    nameEn: "Sulfate ion",
    charge: -2,
    kind: "anion",
    typicalUses: "硫酸盐、BaSO₄ 沉淀、稀 H₂SO₄ DIY",
  }),
  Object.freeze({
    id: "F-",
    formula: "F-",
    displayFormula: "F⁻",
    nameZh: "氟离子",
    nameEn: "Fluoride ion",
    charge: -1,
    kind: "anion",
    typicalUses: "基础版仅作盐构建与【高危】氟化物牌来源；不与普通 DIY 拼 HF",
    isHalogen: true,
  }),
  Object.freeze({
    id: "Br-",
    formula: "Br-",
    displayFormula: "Br⁻",
    nameZh: "溴离子",
    nameEn: "Bromide ion",
    charge: -1,
    kind: "anion",
    typicalUses: "卤素置换",
    isHalogen: true,
  }),
  Object.freeze({
    id: "I-",
    formula: "I-",
    displayFormula: "I⁻",
    nameZh: "碘离子",
    nameEn: "Iodide ion",
    charge: -1,
    kind: "anion",
    typicalUses: "卤素置换；碘按卤素族系统扩行",
    isHalogen: true,
  }),
]);

/**
 * 全部 B2-R1 离子只读列表
 */
export const B2R1_ALL_ION_DEFINITIONS: readonly B2R1IonDefinition[] = Object.freeze([
  ...B2R1_CATION_DEFINITIONS,
  ...B2R1_ANION_DEFINITIONS,
]);

/**
 * 离子 Map（支持原生 ID，及带 ^ 幂符号的常见别名映射）
 */
const ionMapInternal = new Map<string, B2R1IonDefinition>();

for (const ion of B2R1_ALL_ION_DEFINITIONS) {
  ionMapInternal.set(ion.id, ion);
}

// 别名支持
const ALIAS_MAP: Record<string, B2R1IonId> = {
  "CO3^2-": "CO32-",
  "SO4^2-": "SO42-",
  "CO3²⁻": "CO32-",
  "SO₄²⁻": "SO42-",
  "H⁺": "H+",
  "NH₄⁺": "NH4+",
  "Na⁺": "Na+",
  "K⁺": "K+",
  "Ca²⁺": "Ca2+",
  "Mg²⁺": "Mg2+",
  "Ba²⁺": "Ba2+",
  "Al³⁺": "Al3+",
  "Fe²⁺": "Fe2+",
  "Fe³⁺": "Fe3+",
  "Zn²⁺": "Zn2+",
  "Cu²⁺": "Cu2+",
  "Ag⁺": "Ag+",
  "OH⁻": "OH-",
  "Cl⁻": "Cl-",
  "NO₃⁻": "NO3-",
  "F⁻": "F-",
  "Br⁻": "Br-",
  "I⁻": "I-",
};

/**
 * 标准化离子 ID（例如将 "CO3^2-" 转换为 "CO32-"）
 */
export function normalizeIonId(id: string): B2R1IonId | undefined {
  if (ionMapInternal.has(id)) {
    return id as B2R1IonId;
  }
  return ALIAS_MAP[id];
}

/**
 * 获取离子只读元数据
 */
export function getB2R1Ion(id: string): B2R1IonDefinition | undefined {
  const normalized = normalizeIonId(id);
  if (!normalized) {
    return undefined;
  }
  return ionMapInternal.get(normalized);
}

/**
 * 检查是否为合法的 B2-R1 阳离子
 */
export function isB2R1Cation(id: string): id is B2R1CationId {
  const def = getB2R1Ion(id);
  return def !== undefined && def.kind === "cation";
}

/**
 * 检查是否为合法的 B2-R1 阴离子
 */
export function isB2R1Anion(id: string): id is B2R1AnionId {
  const def = getB2R1Ion(id);
  return def !== undefined && def.kind === "anion";
}
