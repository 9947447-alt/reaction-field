/**
 * B2-R1 规范盐数据结构与生成纯函数
 * 依据 docs/PHASE22_B2_R1_RULE_FREEZE.md §2.3 盐生成规则
 */

import {
  getB2R1Ion,
  isB2R1Anion,
  isB2R1Cation,
  normalizeIonId,
} from "./ions";
import type {
  B2R1AnionId,
  B2R1CationId,
  B2R1SaltDefinition,
  SaltGenerationResult,
} from "./types";

/**
 * 计算两个整数的最大公约数 (Greatest Common Divisor)
 */
export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x;
}

/**
 * 根据离子电荷计算盐生成的最小整数化学计量比
 * 满足：阳离子总正电荷 = 阴离子总负电荷
 * cationCount * cationCharge = anionCount * |anionCharge|
 */
export function calculateSaltStoichiometry(
  cationCharge: number,
  anionCharge: number,
): { cationCount: number; anionCount: number } {
  if (cationCharge <= 0) {
    throw new Error(`Cation charge must be positive, got ${cationCharge}`);
  }
  const absAnionCharge = Math.abs(anionCharge);
  if (absAnionCharge === 0) {
    throw new Error(`Anion charge must be non-zero, got ${anionCharge}`);
  }

  const commonDivisor = gcd(cationCharge, absAnionCharge);
  const cationCount = absAnionCharge / commonDivisor;
  const anionCount = cationCharge / commonDivisor;

  return { cationCount, anionCount };
}

/**
 * 39 种白名单盐只读定义表（严格按照 §2.3 阳离子 × 阴离子盐构建表）
 */
export const B2R1_SALT_CATALOG: readonly B2R1SaltDefinition[] = Object.freeze([
  // ----------------- 氯化物 (12 种) -----------------
  Object.freeze({
    id: "substance_nacl",
    formula: "NaCl",
    displayFormula: "NaCl",
    nameZh: "氯化钠",
    nameEn: "Sodium chloride",
    cation: "Na+",
    anion: "Cl-",
    cationCount: 1,
    anionCount: 1,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "chloride"]),
  }),
  Object.freeze({
    id: "substance_kcl",
    formula: "KCl",
    displayFormula: "KCl",
    nameZh: "氯化钾",
    nameEn: "Potassium chloride",
    cation: "K+",
    anion: "Cl-",
    cationCount: 1,
    anionCount: 1,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "chloride"]),
  }),
  Object.freeze({
    id: "substance_agcl",
    formula: "AgCl",
    displayFormula: "AgCl",
    nameZh: "氯化银",
    nameEn: "Silver chloride",
    cation: "Ag+",
    anion: "Cl-",
    cationCount: 1,
    anionCount: 1,
    solubility: "insoluble",
    isPrecipitate: true,
    tags: Object.freeze(["salt", "chloride", "precipitate"]),
  }),
  Object.freeze({
    id: "substance_bacl2",
    formula: "BaCl2",
    displayFormula: "BaCl₂",
    nameZh: "氯化钡",
    nameEn: "Barium chloride",
    cation: "Ba2+",
    anion: "Cl-",
    cationCount: 1,
    anionCount: 2,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "chloride"]),
  }),
  Object.freeze({
    id: "substance_cacl2",
    formula: "CaCl2",
    displayFormula: "CaCl₂",
    nameZh: "氯化钙",
    nameEn: "Calcium chloride",
    cation: "Ca2+",
    anion: "Cl-",
    cationCount: 1,
    anionCount: 2,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "chloride"]),
  }),
  Object.freeze({
    id: "substance_mgcl2",
    formula: "MgCl2",
    displayFormula: "MgCl₂",
    nameZh: "氯化镁",
    nameEn: "Magnesium chloride",
    cation: "Mg2+",
    anion: "Cl-",
    cationCount: 1,
    anionCount: 2,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "chloride"]),
  }),
  Object.freeze({
    id: "substance_zncl2",
    formula: "ZnCl2",
    displayFormula: "ZnCl₂",
    nameZh: "氯化锌",
    nameEn: "Zinc chloride",
    cation: "Zn2+",
    anion: "Cl-",
    cationCount: 1,
    anionCount: 2,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "chloride"]),
  }),
  Object.freeze({
    id: "substance_fecl2",
    formula: "FeCl2",
    displayFormula: "FeCl₂",
    nameZh: "氯化亚铁",
    nameEn: "Ferrous chloride",
    cation: "Fe2+",
    anion: "Cl-",
    cationCount: 1,
    anionCount: 2,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "chloride"]),
  }),
  Object.freeze({
    id: "substance_fecl3",
    formula: "FeCl3",
    displayFormula: "FeCl₃",
    nameZh: "氯化铁",
    nameEn: "Ferric chloride",
    cation: "Fe3+",
    anion: "Cl-",
    cationCount: 1,
    anionCount: 3,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "chloride"]),
  }),
  Object.freeze({
    id: "substance_cucl2",
    formula: "CuCl2",
    displayFormula: "CuCl₂",
    nameZh: "氯化铜",
    nameEn: "Copper(II) chloride",
    cation: "Cu2+",
    anion: "Cl-",
    cationCount: 1,
    anionCount: 2,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "chloride"]),
  }),
  Object.freeze({
    id: "substance_alcl3",
    formula: "AlCl3",
    displayFormula: "AlCl₃",
    nameZh: "氯化铝",
    nameEn: "Aluminium chloride",
    cation: "Al3+",
    anion: "Cl-",
    cationCount: 1,
    anionCount: 3,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "chloride"]),
  }),
  Object.freeze({
    id: "substance_nh4cl",
    formula: "NH4Cl",
    displayFormula: "NH₄Cl",
    nameZh: "氯化铵",
    nameEn: "Ammonium chloride",
    cation: "NH4+",
    anion: "Cl-",
    cationCount: 1,
    anionCount: 1,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "chloride"]),
  }),

  // ----------------- 硫酸盐 (10 种) -----------------
  Object.freeze({
    id: "substance_na2so4",
    formula: "Na2SO4",
    displayFormula: "Na₂SO₄",
    nameZh: "硫酸钠",
    nameEn: "Sodium sulfate",
    cation: "Na+",
    anion: "SO42-",
    cationCount: 2,
    anionCount: 1,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "sulfate"]),
  }),
  Object.freeze({
    id: "substance_k2so4",
    formula: "K2SO4",
    displayFormula: "K₂SO₄",
    nameZh: "硫酸钾",
    nameEn: "Potassium sulfate",
    cation: "K+",
    anion: "SO42-",
    cationCount: 2,
    anionCount: 1,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "sulfate"]),
  }),
  Object.freeze({
    id: "substance_baso4",
    formula: "BaSO4",
    displayFormula: "BaSO₄",
    nameZh: "硫酸钡",
    nameEn: "Barium sulfate",
    cation: "Ba2+",
    anion: "SO42-",
    cationCount: 1,
    anionCount: 1,
    solubility: "insoluble",
    isPrecipitate: true,
    tags: Object.freeze(["salt", "sulfate", "precipitate"]),
  }),
  Object.freeze({
    id: "substance_caso4",
    formula: "CaSO4",
    displayFormula: "CaSO₄",
    nameZh: "硫酸钙",
    nameEn: "Calcium sulfate",
    cation: "Ca2+",
    anion: "SO42-",
    cationCount: 1,
    anionCount: 1,
    solubility: "slightly_soluble",
    isPrecipitate: true,
    tags: Object.freeze(["salt", "sulfate", "precipitate"]),
  }),
  Object.freeze({
    id: "substance_mgso4",
    formula: "MgSO4",
    displayFormula: "MgSO₄",
    nameZh: "硫酸镁",
    nameEn: "Magnesium sulfate",
    cation: "Mg2+",
    anion: "SO42-",
    cationCount: 1,
    anionCount: 1,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "sulfate"]),
  }),
  Object.freeze({
    id: "substance_znso4",
    formula: "ZnSO4",
    displayFormula: "ZnSO₄",
    nameZh: "硫酸锌",
    nameEn: "Zinc sulfate",
    cation: "Zn2+",
    anion: "SO42-",
    cationCount: 1,
    anionCount: 1,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "sulfate"]),
  }),
  Object.freeze({
    id: "substance_feso4",
    formula: "FeSO4",
    displayFormula: "FeSO₄",
    nameZh: "硫酸亚铁",
    nameEn: "Ferrous sulfate",
    cation: "Fe2+",
    anion: "SO42-",
    cationCount: 1,
    anionCount: 1,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "sulfate"]),
  }),
  Object.freeze({
    id: "substance_cuso4",
    formula: "CuSO4",
    displayFormula: "CuSO₄",
    nameZh: "硫酸铜",
    nameEn: "Copper(II) sulfate",
    cation: "Cu2+",
    anion: "SO42-",
    cationCount: 1,
    anionCount: 1,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "sulfate"]),
  }),
  Object.freeze({
    id: "substance_al2_so4_3",
    formula: "Al2(SO4)3",
    displayFormula: "Al₂(SO₄)₃",
    nameZh: "硫酸铝",
    nameEn: "Aluminium sulfate",
    cation: "Al3+",
    anion: "SO42-",
    cationCount: 2,
    anionCount: 3,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "sulfate"]),
  }),
  // 硫酸银（强制纳入）：2Ag⁺ + SO₄²⁻ ⇒ Ag₂SO₄（微溶，仍生成盐卡）
  Object.freeze({
    id: "substance_ag2so4",
    formula: "Ag2SO4",
    displayFormula: "Ag₂SO₄",
    nameZh: "硫酸银",
    nameEn: "Silver sulfate",
    cation: "Ag+",
    anion: "SO42-",
    cationCount: 2,
    anionCount: 1,
    solubility: "slightly_soluble",
    isPrecipitate: true,
    tags: Object.freeze(["salt", "sulfate", "slightly_soluble"]),
  }),

  // ----------------- 碳酸盐 (7 种) -----------------
  Object.freeze({
    id: "substance_na2co3",
    formula: "Na2CO3",
    displayFormula: "Na₂CO₃",
    nameZh: "碳酸钠",
    nameEn: "Sodium carbonate",
    cation: "Na+",
    anion: "CO32-",
    cationCount: 2,
    anionCount: 1,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "carbonate"]),
  }),
  Object.freeze({
    id: "substance_k2co3",
    formula: "K2CO3",
    displayFormula: "K₂CO₃",
    nameZh: "碳酸钾",
    nameEn: "Potassium carbonate",
    cation: "K+",
    anion: "CO32-",
    cationCount: 2,
    anionCount: 1,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "carbonate"]),
  }),
  Object.freeze({
    id: "substance_caco3",
    formula: "CaCO3",
    displayFormula: "CaCO₃",
    nameZh: "碳酸钙",
    nameEn: "Calcium carbonate",
    cation: "Ca2+",
    anion: "CO32-",
    cationCount: 1,
    anionCount: 1,
    solubility: "insoluble",
    isPrecipitate: true,
    tags: Object.freeze(["salt", "carbonate", "precipitate"]),
  }),
  Object.freeze({
    id: "substance_baco3",
    formula: "BaCO3",
    displayFormula: "BaCO₃",
    nameZh: "碳酸钡",
    nameEn: "Barium carbonate",
    cation: "Ba2+",
    anion: "CO32-",
    cationCount: 1,
    anionCount: 1,
    solubility: "insoluble",
    isPrecipitate: true,
    tags: Object.freeze(["salt", "carbonate", "precipitate"]),
  }),
  Object.freeze({
    id: "substance_mgco3",
    formula: "MgCO3",
    displayFormula: "MgCO₃",
    nameZh: "碳酸镁",
    nameEn: "Magnesium carbonate",
    cation: "Mg2+",
    anion: "CO32-",
    cationCount: 1,
    anionCount: 1,
    solubility: "slightly_soluble",
    isPrecipitate: true,
    tags: Object.freeze(["salt", "carbonate", "precipitate"]),
  }),
  Object.freeze({
    id: "substance_znco3",
    formula: "ZnCO3",
    displayFormula: "ZnCO₃",
    nameZh: "碳酸锌",
    nameEn: "Zinc carbonate",
    cation: "Zn2+",
    anion: "CO32-",
    cationCount: 1,
    anionCount: 1,
    solubility: "insoluble",
    isPrecipitate: true,
    tags: Object.freeze(["salt", "carbonate", "precipitate"]),
  }),
  Object.freeze({
    id: "substance_ag2co3",
    formula: "Ag2CO3",
    displayFormula: "Ag₂CO₃",
    nameZh: "碳酸银",
    nameEn: "Silver carbonate",
    cation: "Ag+",
    anion: "CO32-",
    cationCount: 2,
    anionCount: 1,
    solubility: "insoluble",
    isPrecipitate: true,
    tags: Object.freeze(["salt", "carbonate", "precipitate"]),
  }),

  // ----------------- 硝酸盐 (10 种) -----------------
  Object.freeze({
    id: "substance_nano3",
    formula: "NaNO3",
    displayFormula: "NaNO₃",
    nameZh: "硝酸钠",
    nameEn: "Sodium nitrate",
    cation: "Na+",
    anion: "NO3-",
    cationCount: 1,
    anionCount: 1,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "nitrate"]),
  }),
  Object.freeze({
    id: "substance_kno3",
    formula: "KNO3",
    displayFormula: "KNO₃",
    nameZh: "硝酸钾",
    nameEn: "Potassium nitrate",
    cation: "K+",
    anion: "NO3-",
    cationCount: 1,
    anionCount: 1,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "nitrate"]),
  }),
  Object.freeze({
    id: "substance_agno3",
    formula: "AgNO3",
    displayFormula: "AgNO₃",
    nameZh: "硝酸银",
    nameEn: "Silver nitrate",
    cation: "Ag+",
    anion: "NO3-",
    cationCount: 1,
    anionCount: 1,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "nitrate"]),
  }),
  Object.freeze({
    id: "substance_ca_no3_2",
    formula: "Ca(NO3)2",
    displayFormula: "Ca(NO₃)₂",
    nameZh: "硝酸钙",
    nameEn: "Calcium nitrate",
    cation: "Ca2+",
    anion: "NO3-",
    cationCount: 1,
    anionCount: 2,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "nitrate"]),
  }),
  Object.freeze({
    id: "substance_mg_no3_2",
    formula: "Mg(NO3)2",
    displayFormula: "Mg(NO₃)₂",
    nameZh: "硝酸镁",
    nameEn: "Magnesium nitrate",
    cation: "Mg2+",
    anion: "NO3-",
    cationCount: 1,
    anionCount: 2,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "nitrate"]),
  }),
  Object.freeze({
    id: "substance_zn_no3_2",
    formula: "Zn(NO3)2",
    displayFormula: "Zn(NO₃)₂",
    nameZh: "硝酸锌",
    nameEn: "Zinc nitrate",
    cation: "Zn2+",
    anion: "NO3-",
    cationCount: 1,
    anionCount: 2,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "nitrate"]),
  }),
  Object.freeze({
    id: "substance_fe_no3_2",
    formula: "Fe(NO3)2",
    displayFormula: "Fe(NO₃)₂",
    nameZh: "硝酸亚铁",
    nameEn: "Ferrous nitrate",
    cation: "Fe2+",
    anion: "NO3-",
    cationCount: 1,
    anionCount: 2,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "nitrate"]),
  }),
  Object.freeze({
    id: "substance_fe_no3_3",
    formula: "Fe(NO3)3",
    displayFormula: "Fe(NO₃)₃",
    nameZh: "硝酸铁",
    nameEn: "Ferric nitrate",
    cation: "Fe3+",
    anion: "NO3-",
    cationCount: 1,
    anionCount: 3,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "nitrate"]),
  }),
  Object.freeze({
    id: "substance_cu_no3_2",
    formula: "Cu(NO3)2",
    displayFormula: "Cu(NO₃)₂",
    nameZh: "硝酸铜",
    nameEn: "Copper(II) nitrate",
    cation: "Cu2+",
    anion: "NO3-",
    cationCount: 1,
    anionCount: 2,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "nitrate"]),
  }),
  Object.freeze({
    id: "substance_nh4no3",
    formula: "NH4NO3",
    displayFormula: "NH₄NO₃",
    nameZh: "硝酸铵",
    nameEn: "Ammonium nitrate",
    cation: "NH4+",
    anion: "NO3-",
    cationCount: 1,
    anionCount: 1,
    solubility: "soluble",
    isPrecipitate: false,
    tags: Object.freeze(["salt", "nitrate"]),
  }),
]);

/**
 * 盐索引 Map：由 `cation:anion` 作为复合键
 */
const saltPairMap = new Map<string, B2R1SaltDefinition>();
const saltFormulaMap = new Map<string, B2R1SaltDefinition>();

for (const salt of B2R1_SALT_CATALOG) {
  saltPairMap.set(`${salt.cation}:${salt.anion}`, salt);
  saltFormulaMap.set(salt.formula, salt);
  saltFormulaMap.set(salt.displayFormula, salt);
  saltFormulaMap.set(salt.id, salt);
}

/**
 * 根据化学式或 ID 查找盐定义
 */
export function getB2R1SaltByFormula(formulaOrId: string): B2R1SaltDefinition | undefined {
  return saltFormulaMap.get(formulaOrId);
}

/**
 * 盐生成纯函数（由阳离子与阴离子生成盐）
 * 包含：
 * 1. 拦截酸（H⁺ 作为阳离子被拒绝，应走酸 DIY）
 * 2. 拦截碱（OH⁻ 作为阴离子被拒绝，应走碱 DIY）
 * 3. 拦截未列入白名单的非法/未收录配对（如 Fe³⁺ + CO₃²⁻、F⁻ 等）
 * 4. 强制生成 Ag2SO4 微溶物及其他 39 种白名单盐
 */
export function generateSalt(
  cationInput: string,
  anionInput: string,
): SaltGenerationResult {
  const normCation = normalizeIonId(cationInput);
  const normAnion = normalizeIonId(anionInput);

  if (!normCation) {
    return {
      success: false,
      reason: `未知或非法的阳离子输入: "${cationInput}"`,
    };
  }

  if (!normAnion) {
    return {
      success: false,
      reason: `未知或非法的阴离子输入: "${anionInput}"`,
    };
  }

  // 1. 校验极性与酸碱特例拦截
  if (normCation === "H+") {
    return {
      success: false,
      reason: "H+ 为酸性介质核心，与阴离子反应生成酸溶液，不可作为盐构建阳离子",
    };
  }

  if (normAnion === "OH-") {
    return {
      success: false,
      reason: "OH- 为碱性介质核心，与阳离子反应生成碱或难溶沉淀，不可作为盐构建阴离子",
    };
  }

  // 2. 检查离子类别
  if (!isB2R1Cation(normCation)) {
    return {
      success: false,
      reason: `"${cationInput}" 不是合法的阳离子`,
    };
  }

  if (!isB2R1Anion(normAnion)) {
    return {
      success: false,
      reason: `"${anionInput}" 不是合法的阴离子`,
    };
  }

  // 3. 查询白名单配对
  const pairKey = `${normCation}:${normAnion}`;
  const salt = saltPairMap.get(pairKey);

  if (!salt) {
    return {
      success: false,
      reason: `配对 [${normCation} + ${normAnion}] 不在 B2-R1 §2.3 盐构建白名单表中`,
    };
  }

  return {
    success: true,
    salt,
  };
}

/**
 * 严谨组件配平盐生成纯函数
 * 传入阳离子、阳离子张数、阴离子、阴离子张数进行配平与白名单核验
 */
export function validateAndGenerateSalt(params: {
  cationId: string;
  cationCount: number;
  anionId: string;
  anionCount: number;
}): SaltGenerationResult {
  const { cationId, cationCount, anionId, anionCount } = params;

  if (cationCount <= 0 || !Number.isInteger(cationCount)) {
    return {
      success: false,
      reason: `阳离子数量必须为正整数，收到: ${cationCount}`,
    };
  }

  if (anionCount <= 0 || !Number.isInteger(anionCount)) {
    return {
      success: false,
      reason: `阴离子数量必须为正整数，收到: ${anionCount}`,
    };
  }

  const genResult = generateSalt(cationId, anionId);
  if (!genResult.success) {
    return genResult;
  }

  const { salt } = genResult;

  // 检查化学计量比是否精确吻合
  if (salt.cationCount !== cationCount || salt.anionCount !== anionCount) {
    return {
      success: false,
      reason: `化学计量比不匹配: 生成 ${salt.formula} 需要 ${salt.cationCount} 个 ${salt.cation} 和 ${salt.anionCount} 个 ${salt.anion}，但提供了 ${cationCount} 和 ${anionCount}`,
    };
  }

  return {
    success: true,
    salt,
  };
}
