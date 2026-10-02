/**
 * B2-R1 氧化还原静态数据与纯函数匹配模块
 * 依据 docs/PHASE22_B2_R1_RULE_FREEZE.md §3
 */

import type {
  B2R1MediumDefinition,
  B2R1MediumId,
  B2R1MetalDefinition,
  B2R1MetalElementId,
  B2R1RedoxMatchInput,
  B2R1RedoxMatchResult,
  B2R1RedoxReactionDefinition,
  B2R1RedoxRowId,
  B2R1StimulusStatusDefinition,
} from "./types";

/**
 * 金属单质枚举标识列表（§3.2, §3.3 至少包含 Cu, Mg, Zn, Fe, Al, Ag）
 */
export const B2R1_METAL_ELEMENT_IDS: readonly B2R1MetalElementId[] = Object.freeze([
  "Cu",
  "Mg",
  "Zn",
  "Fe",
  "Al",
  "Ag",
]);

/**
 * 金属单质只读定义列表
 */
export const B2R1_METAL_DEFINITIONS: readonly B2R1MetalDefinition[] = Object.freeze([
  Object.freeze({ id: "Cu", symbol: "Cu", nameZh: "铜", nameEn: "Copper" }),
  Object.freeze({ id: "Mg", symbol: "Mg", nameZh: "镁", nameEn: "Magnesium" }),
  Object.freeze({ id: "Zn", symbol: "Zn", nameZh: "锌", nameEn: "Zinc" }),
  Object.freeze({ id: "Fe", symbol: "Fe", nameZh: "铁", nameEn: "Iron" }),
  Object.freeze({ id: "Al", symbol: "Al", nameZh: "铝", nameEn: "Aluminium" }),
  Object.freeze({ id: "Ag", symbol: "Ag", nameZh: "银", nameEn: "Silver" }),
]);

const METAL_SET = new Set<string>(B2R1_METAL_ELEMENT_IDS);

export function isB2R1MetalElement(id: string): id is B2R1MetalElementId {
  return METAL_SET.has(id);
}

/**
 * 介质枚举标识列表（至少包含浓 HCl、稀 HNO₃、浓 HNO₃、稀非氧化性酸、水）
 */
export const B2R1_MEDIUM_IDS: readonly B2R1MediumId[] = Object.freeze([
  "conc_hcl",
  "dil_hno3",
  "conc_hno3",
  "dil_non_oxidizing_acid",
  "water",
]);

/**
 * 介质只读定义字典
 */
export const B2R1_MEDIUM_DEFINITIONS: Record<B2R1MediumId, B2R1MediumDefinition> = Object.freeze({
  conc_hcl: Object.freeze({
    id: "conc_hcl",
    nameZh: "浓 HCl",
    nameEn: "concentrated hydrochloric acid",
  }),
  dil_hno3: Object.freeze({
    id: "dil_hno3",
    nameZh: "稀 HNO₃",
    nameEn: "dilute nitric acid",
  }),
  conc_hno3: Object.freeze({
    id: "conc_hno3",
    nameZh: "浓 HNO₃",
    nameEn: "concentrated nitric acid",
  }),
  dil_non_oxidizing_acid: Object.freeze({
    id: "dil_non_oxidizing_acid",
    nameZh: "稀非氧化性酸",
    nameEn: "dilute non-oxidizing acid",
  }),
  water: Object.freeze({
    id: "water",
    nameZh: "水",
    nameEn: "water",
  }),
});

const MEDIUM_ALIAS_MAP: Record<string, B2R1MediumId> = {
  conc_hcl: "conc_hcl",
  "conc_HCl": "conc_hcl",
  "浓 HCl": "conc_hcl",
  "浓HCl": "conc_hcl",
  "浓盐酸": "conc_hcl",
  dil_hno3: "dil_hno3",
  "dil_HNO3": "dil_hno3",
  "稀 HNO₃": "dil_hno3",
  "稀HNO₃": "dil_hno3",
  "稀 HNO3": "dil_hno3",
  "稀HNO3": "dil_hno3",
  "稀硝酸": "dil_hno3",
  conc_hno3: "conc_hno3",
  "conc_HNO3": "conc_hno3",
  "浓 HNO₃": "conc_hno3",
  "浓HNO₃": "conc_hno3",
  "浓 HNO3": "conc_hno3",
  "浓HNO3": "conc_hno3",
  "浓硝酸": "conc_hno3",
  dil_non_oxidizing_acid: "dil_non_oxidizing_acid",
  "稀非氧化性酸": "dil_non_oxidizing_acid",
  water: "water",
  "水": "water",
  H2O: "water",
  "H₂O": "water",
};

/**
 * 标准化介质标识
 */
export function normalizeMediumId(medium: string): B2R1MediumId | undefined {
  return MEDIUM_ALIAS_MAP[medium.trim()];
}

/**
 * 气体刺激状态定义：氯气刺激
 */
export const B2R1_STIMULUS_STATUS_CHLORINE: B2R1StimulusStatusDefinition = Object.freeze({
  id: "chlorine_gas_stimulus",
  nameZh: "氯气刺激",
  nameEn: "chlorine-gas stimulus",
});

/**
 * 气体刺激状态定义：氮氧化物刺激（NO 与 NO₂ 共用）
 */
export const B2R1_STIMULUS_STATUS_NITROGEN_OXIDE: B2R1StimulusStatusDefinition = Object.freeze({
  id: "nitrogen_oxide_stimulus",
  nameZh: "氮氧化物刺激",
  nameEn: "nitrogen-oxide stimulus",
});

/**
 * 气体刺激状态表
 */
export const B2R1_STIMULUS_STATUSES: readonly B2R1StimulusStatusDefinition[] = Object.freeze([
  B2R1_STIMULUS_STATUS_CHLORINE,
  B2R1_STIMULUS_STATUS_NITROGEN_OXIDE,
]);

/**
 * 本刀冻结的三条氧化还原反应行静态数据
 * §3.8: OR-KMnO4-HCl-conc
 * §3.7: OR-Cu-HNO3-dil
 * §3.10: OR-Na2FeO4-purify
 */
export const B2R1_REDOX_REACTION_ROWS: readonly B2R1RedoxReactionDefinition[] = Object.freeze([
  Object.freeze({
    id: "OR-KMnO4-HCl-conc",
    equation: "2KMnO₄ + 16HCl → 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O",
    medium: "conc_hcl",
    reactants: Object.freeze(["KMnO4"]),
    effectZh: "生成 Cl₂，造成【氯气刺激】持续状态",
    stimulusStatus: B2R1_STIMULUS_STATUS_CHLORINE,
  }),
  Object.freeze({
    id: "OR-Cu-HNO3-dil",
    equation: "3Cu + 8H⁺ + 2NO₃⁻ → 3Cu²⁺ + 2NO↑ + 4H₂O",
    medium: "dil_hno3",
    reactants: Object.freeze(["Cu"]),
    effectZh: "生成 NO，造成【氮氧化物刺激】持续状态",
    stimulusStatus: B2R1_STIMULUS_STATUS_NITROGEN_OXIDE,
  }),
  Object.freeze({
    id: "OR-Na2FeO4-purify",
    equation: "4Na₂FeO₄ + 10H₂O → 4Fe(OH)₃↓ + 3O₂↑ + 8NaOH",
    medium: "water",
    reactants: Object.freeze(["Na2FeO4"]),
    effectZh: "移除一项浑浊/有机污染",
    stimulusStatus: undefined,
  }),
]);

const REDOX_ROW_MAP = new Map<B2R1RedoxRowId, B2R1RedoxReactionDefinition>(
  B2R1_REDOX_REACTION_ROWS.map((row) => [row.id, row])
);

/**
 * 按 ID 获取氧化还原反应行
 */
export function getB2R1RedoxReaction(id: string): B2R1RedoxReactionDefinition | undefined {
  return REDOX_ROW_MAP.get(id as B2R1RedoxRowId);
}

const REACTANT_NORMALIZATION_MAP: Record<string, string> = {
  KMnO4: "KMnO4",
  "KMnO₄": "KMnO4",
  kmno4: "KMnO4",
  高锰酸钾: "KMnO4",
  Cu: "Cu",
  cu: "Cu",
  铜: "Cu",
  Na2FeO4: "Na2FeO4",
  "Na₂FeO₄": "Na2FeO4",
  na2feo4: "Na2FeO4",
  高铁酸钠: "Na2FeO4",
};

function normalizeReactantKey(item: string): string {
  const trimmed = item.trim();
  return REACTANT_NORMALIZATION_MAP[trimmed] ?? trimmed;
}

/**
 * 纯函数匹配 B2-R1 氧化还原反应
 * 仅在满足三条冻结完整条件时返回对应 row id 与状态名；不修改入参
 */
export function matchB2R1RedoxReaction(input: B2R1RedoxMatchInput): B2R1RedoxMatchResult;
export function matchB2R1RedoxReaction(
  reactants: readonly string[] | string,
  medium: string
): B2R1RedoxMatchResult;
export function matchB2R1RedoxReaction(
  inputOrReactants: B2R1RedoxMatchInput | readonly string[] | string,
  mediumArg?: string
): B2R1RedoxMatchResult {
  let rawReactants: readonly string[];
  let rawMedium: string | undefined;

  if (typeof inputOrReactants === "object" && !Array.isArray(inputOrReactants)) {
    const input = inputOrReactants as B2R1RedoxMatchInput;
    rawReactants = input.reactants ?? (input.reactant !== undefined ? [input.reactant] : []);
    rawMedium = input.medium;
  } else if (typeof inputOrReactants === "string") {
    rawReactants = [inputOrReactants];
    rawMedium = mediumArg;
  } else {
    rawReactants = inputOrReactants;
    rawMedium = mediumArg;
  }

  if (!rawMedium || typeof rawMedium !== "string") {
    return {
      matched: false,
      success: false,
      reason: "未提供介质或介质无效",
    };
  }

  const normalizedMedium = normalizeMediumId(rawMedium);
  if (!normalizedMedium) {
    return {
      matched: false,
      success: false,
      reason: `未识别的介质: "${rawMedium}"`,
    };
  }

  const normalizedReactants = rawReactants
    .map(normalizeReactantKey)
    .filter((r) => r.length > 0);

  if (normalizedReactants.length === 0) {
    return {
      matched: false,
      success: false,
      reason: "反应物列表为空",
    };
  }

  // 1. OR-KMnO4-HCl-conc: KMnO4 + 浓 HCl
  if (normalizedReactants.length === 1 && normalizedReactants[0] === "KMnO4") {
    if (normalizedMedium === "conc_hcl") {
      const reaction = REDOX_ROW_MAP.get("OR-KMnO4-HCl-conc")!;
      return {
        matched: true,
        success: true,
        rowId: reaction.id,
        reaction,
        stimulusStatus: reaction.stimulusStatus,
        statusNameZh: reaction.stimulusStatus?.nameZh,
        statusNameEn: reaction.stimulusStatus?.nameEn,
        statusId: reaction.stimulusStatus?.id,
        effectZh: reaction.effectZh,
      };
    }
    return {
      matched: false,
      success: false,
      reason: `KMnO₄ 氧化反应介质必须为浓 HCl，当前介质为 "${rawMedium}"`,
    };
  }

  // 2. OR-Cu-HNO3-dil: Cu + 稀 HNO₃
  if (normalizedReactants.length === 1 && normalizedReactants[0] === "Cu") {
    if (normalizedMedium === "dil_hno3") {
      const reaction = REDOX_ROW_MAP.get("OR-Cu-HNO3-dil")!;
      return {
        matched: true,
        success: true,
        rowId: reaction.id,
        reaction,
        stimulusStatus: reaction.stimulusStatus,
        statusNameZh: reaction.stimulusStatus?.nameZh,
        statusNameEn: reaction.stimulusStatus?.nameEn,
        statusId: reaction.stimulusStatus?.id,
        effectZh: reaction.effectZh,
      };
    }
    return {
      matched: false,
      success: false,
      reason: `Cu 与硝酸反应（稀）必须在稀 HNO₃ 介质中，当前介质为 "${rawMedium}"`,
    };
  }

  // 3. OR-Na2FeO4-purify: Na2FeO4 + 水
  if (normalizedReactants.length === 1 && normalizedReactants[0] === "Na2FeO4") {
    if (normalizedMedium === "water") {
      const reaction = REDOX_ROW_MAP.get("OR-Na2FeO4-purify")!;
      return {
        matched: true,
        success: true,
        rowId: reaction.id,
        reaction,
        stimulusStatus: undefined,
        statusNameZh: undefined,
        statusNameEn: undefined,
        statusId: undefined,
        effectZh: reaction.effectZh,
      };
    }
    return {
      matched: false,
      success: false,
      reason: `Na₂FeO₄ 净水反应介质必须为水，当前介质为 "${rawMedium}"`,
    };
  }

  return {
    matched: false,
    success: false,
    reason: `未收录的氧化还原反应组合: 反应物 [${normalizedReactants.join(", ")}], 介质 "${rawMedium}"`,
  };
}
