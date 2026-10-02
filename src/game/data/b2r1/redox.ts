/**
 * B2-R1 氧化还原静态数据与纯函数匹配模块
 * 依据 docs/PHASE22_B2_R1_RULE_FREEZE.md §3
 */

import type {
  B2R1GasTag,
  B2R1GasTagDefinition,
  B2R1MediumDefinition,
  B2R1MediumId,
  B2R1MetalDefinition,
  B2R1MetalElementId,
  B2R1ReactionCondition,
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
 * 气体标签：可燃气体（§3.2 H₂ 标注）
 */
export const B2R1_GAS_TAG_FLAMMABLE: B2R1GasTag = "flammable_gas";

export const B2R1_GAS_TAG_DEFINITION_FLAMMABLE: B2R1GasTagDefinition = Object.freeze({
  id: "flammable_gas",
  nameZh: "可燃气体",
  nameEn: "flammable gas",
});

export const B2R1_GAS_TAG_DEFINITIONS: Record<B2R1GasTag, B2R1GasTagDefinition> = Object.freeze({
  flammable_gas: B2R1_GAS_TAG_DEFINITION_FLAMMABLE,
});

/**
 * 反应条件：去氧化膜（§3.2 铝产氢条件）
 */
export const B2R1_CONDITION_OXIDE_FILM_REMOVED: B2R1ReactionCondition = "oxide_film_removed";

export const B2R1_REACTION_CONDITIONS: readonly B2R1ReactionCondition[] = Object.freeze([
  B2R1_CONDITION_OXIDE_FILM_REMOVED,
]);

const FLAMMABLE_GAS_TAGS: readonly B2R1GasTag[] = Object.freeze([B2R1_GAS_TAG_FLAMMABLE]);
const OXIDE_FILM_REMOVED_CONDITIONS: readonly B2R1ReactionCondition[] = Object.freeze([
  B2R1_CONDITION_OXIDE_FILM_REMOVED,
]);

export function normalizeReactionCondition(condition: string): B2R1ReactionCondition | undefined {
  const trimmed = condition.trim();
  if (
    trimmed === "oxide_film_removed" ||
    trimmed === "去氧化膜" ||
    trimmed === "remove_oxide_film" ||
    trimmed === "氧化膜已去除"
  ) {
    return "oxide_film_removed";
  }
  return undefined;
}

/**
 * 本刀冻结的氧化还原反应行静态数据
 * §3.8: OR-KMnO4-HCl-conc
 * §3.7: OR-Cu-HNO3-dil
 * §3.10: OR-Na2FeO4-purify
 * §3.2: OR-Mg-H, OR-Zn-H, OR-Fe-H, OR-Al-H, OR-Cu-H, OR-Ag-H
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
  Object.freeze({
    id: "OR-Mg-H",
    equation: "Mg + 2H⁺ → Mg²⁺ + H₂↑",
    medium: "dil_non_oxidizing_acid",
    reactants: Object.freeze(["Mg"]),
    effectZh: "生成 H₂，具有【可燃气体】标签",
    stimulusStatus: undefined,
    gasTags: FLAMMABLE_GAS_TAGS,
  }),
  Object.freeze({
    id: "OR-Zn-H",
    equation: "Zn + 2H⁺ → Zn²⁺ + H₂↑",
    medium: "dil_non_oxidizing_acid",
    reactants: Object.freeze(["Zn"]),
    effectZh: "生成 H₂，具有【可燃气体】标签",
    stimulusStatus: undefined,
    gasTags: FLAMMABLE_GAS_TAGS,
  }),
  Object.freeze({
    id: "OR-Fe-H",
    equation: "Fe + 2H⁺ → Fe²⁺ + H₂↑",
    medium: "dil_non_oxidizing_acid",
    reactants: Object.freeze(["Fe"]),
    effectZh: "生成 H₂，具有【可燃气体】标签",
    stimulusStatus: undefined,
    gasTags: FLAMMABLE_GAS_TAGS,
  }),
  Object.freeze({
    id: "OR-Al-H",
    equation: "2Al + 6H⁺ → 2Al³⁺ + 3H₂↑",
    medium: "dil_non_oxidizing_acid",
    reactants: Object.freeze(["Al"]),
    effectZh: "生成 H₂，具有【可燃气体】标签",
    stimulusStatus: undefined,
    conditions: OXIDE_FILM_REMOVED_CONDITIONS,
    gasTags: FLAMMABLE_GAS_TAGS,
  }),
  Object.freeze({
    id: "OR-Cu-H",
    equation: "Cu + H⁺（稀）",
    medium: "dil_non_oxidizing_acid",
    reactants: Object.freeze(["Cu"]),
    effectZh: "不反应",
    isNoReaction: true,
    stimulusStatus: undefined,
  }),
  Object.freeze({
    id: "OR-Ag-H",
    equation: "Ag + H⁺（稀）",
    medium: "dil_non_oxidizing_acid",
    reactants: Object.freeze(["Ag"]),
    effectZh: "不反应",
    isNoReaction: true,
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
  Mg: "Mg",
  mg: "Mg",
  镁: "Mg",
  Zn: "Zn",
  zn: "Zn",
  锌: "Zn",
  Fe: "Fe",
  fe: "Fe",
  铁: "Fe",
  Al: "Al",
  al: "Al",
  铝: "Al",
  Ag: "Ag",
  ag: "Ag",
  银: "Ag",
};

function normalizeReactantKey(item: string): string {
  const trimmed = item.trim();
  return REACTANT_NORMALIZATION_MAP[trimmed] ?? trimmed;
}

/**
 * 纯函数匹配 B2-R1 氧化还原反应
 * 先看介质分叉，严格遵循白名单表；不修改入参
 */
export function matchB2R1RedoxReaction(input: B2R1RedoxMatchInput): B2R1RedoxMatchResult;
export function matchB2R1RedoxReaction(
  reactants: readonly string[] | string,
  medium: string,
  conditions?: readonly string[] | string
): B2R1RedoxMatchResult;
export function matchB2R1RedoxReaction(
  inputOrReactants: B2R1RedoxMatchInput | readonly string[] | string,
  mediumArg?: string,
  conditionsArg?: readonly string[] | string
): B2R1RedoxMatchResult {
  let rawReactants: readonly string[];
  let rawMedium: string | undefined;
  let rawConditions: readonly string[];

  if (typeof inputOrReactants === "object" && !Array.isArray(inputOrReactants)) {
    const input = inputOrReactants as B2R1RedoxMatchInput;
    rawReactants = input.reactants ?? (input.reactant !== undefined ? [input.reactant] : []);
    rawMedium = input.medium;
    rawConditions = input.conditions ?? (input.condition !== undefined ? [input.condition] : []);
  } else if (typeof inputOrReactants === "string") {
    rawReactants = [inputOrReactants];
    rawMedium = mediumArg;
    rawConditions = Array.isArray(conditionsArg)
      ? conditionsArg
      : conditionsArg !== undefined
      ? [conditionsArg]
      : [];
  } else {
    rawReactants = inputOrReactants;
    rawMedium = mediumArg;
    rawConditions = Array.isArray(conditionsArg)
      ? conditionsArg
      : conditionsArg !== undefined
      ? [conditionsArg]
      : [];
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

  const normalizedConditions = new Set<B2R1ReactionCondition>(
    rawConditions
      .map(normalizeReactionCondition)
      .filter((c): c is B2R1ReactionCondition => c !== undefined)
  );
  const hasOxideFilmRemoved = normalizedConditions.has("oxide_film_removed");

  // 1. 稀硝酸介质分叉 (§3.7)
  if (normalizedMedium === "dil_hno3") {
    if (normalizedReactants.length === 1 && normalizedReactants[0] === "Cu") {
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
      reason: `未收录的稀硝酸氧化还原反应: 反应物 [${normalizedReactants.join(", ")}]`,
    };
  }

  // 2. 浓盐酸介质分叉 (§3.8)
  if (normalizedMedium === "conc_hcl") {
    if (normalizedReactants.length === 1 && normalizedReactants[0] === "KMnO4") {
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
      reason: `未收录的浓盐酸氧化还原反应: 反应物 [${normalizedReactants.join(", ")}]`,
    };
  }

  // 3. 水介质分叉 (§3.10)
  if (normalizedMedium === "water") {
    if (normalizedReactants.length === 1 && normalizedReactants[0] === "Na2FeO4") {
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
      reason: `未收录的水介质反应: 反应物 [${normalizedReactants.join(", ")}]`,
    };
  }

  // 4. 稀非氧化性酸介质分叉 (§3.2 金属在稀非氧化性酸)
  if (normalizedMedium === "dil_non_oxidizing_acid") {
    if (normalizedReactants.length === 1) {
      const reactant = normalizedReactants[0];

      // OR-Mg-H
      if (reactant === "Mg") {
        const reaction = REDOX_ROW_MAP.get("OR-Mg-H")!;
        return {
          matched: true,
          success: true,
          rowId: reaction.id,
          reaction,
          effectZh: reaction.effectZh,
          gasTags: reaction.gasTags,
        };
      }

      // OR-Zn-H
      if (reactant === "Zn") {
        const reaction = REDOX_ROW_MAP.get("OR-Zn-H")!;
        return {
          matched: true,
          success: true,
          rowId: reaction.id,
          reaction,
          effectZh: reaction.effectZh,
          gasTags: reaction.gasTags,
        };
      }

      // OR-Fe-H
      if (reactant === "Fe") {
        const reaction = REDOX_ROW_MAP.get("OR-Fe-H")!;
        return {
          matched: true,
          success: true,
          rowId: reaction.id,
          reaction,
          effectZh: reaction.effectZh,
          gasTags: reaction.gasTags,
        };
      }

      // OR-Al-H: 仅当牌面【去氧化膜】或指定条件牌
      if (reactant === "Al") {
        const reaction = REDOX_ROW_MAP.get("OR-Al-H")!;
        if (hasOxideFilmRemoved) {
          return {
            matched: true,
            success: true,
            rowId: reaction.id,
            reaction,
            effectZh: reaction.effectZh,
            gasTags: reaction.gasTags,
          };
        }
        return {
          matched: false,
          success: false,
          rowId: reaction.id,
          reaction,
          isNoReaction: true,
          effectZh: "不反应（表面存在氧化膜）",
          reason: "Al 表面有致密氧化膜，未满足【去氧化膜】条件，不反应",
        };
      }

      // OR-Cu-H: Cu + 稀非氧化性酸 明确不反应
      if (reactant === "Cu") {
        const reaction = REDOX_ROW_MAP.get("OR-Cu-H")!;
        return {
          matched: false,
          success: false,
          rowId: reaction.id,
          reaction,
          isNoReaction: true,
          effectZh: reaction.effectZh,
          reason: "Cu 与稀非氧化性酸不反应",
        };
      }

      // OR-Ag-H: Ag + 稀非氧化性酸 明确不反应
      if (reactant === "Ag") {
        const reaction = REDOX_ROW_MAP.get("OR-Ag-H")!;
        return {
          matched: false,
          success: false,
          rowId: reaction.id,
          reaction,
          isNoReaction: true,
          effectZh: reaction.effectZh,
          reason: "Ag 与稀非氧化性酸不反应",
        };
      }
    }

    return {
      matched: false,
      success: false,
      reason: `未收录的稀非氧化性酸反应组合: 反应物 [${normalizedReactants.join(", ")}]`,
    };
  }

  // 5. 其他介质下的未收录组合与友好提示
  if (normalizedReactants.length === 1 && normalizedReactants[0] === "KMnO4") {
    return {
      matched: false,
      success: false,
      reason: `KMnO₄ 氧化反应介质必须为浓 HCl，当前介质为 "${rawMedium}"`,
    };
  }
  if (normalizedReactants.length === 1 && normalizedReactants[0] === "Na2FeO4") {
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
