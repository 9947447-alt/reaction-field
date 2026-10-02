/**
 * B2-R1 离子与盐静态数据类型定义
 * 依据 docs/PHASE22_B2_R1_RULE_FREEZE.md §2 离子表与盐生成规则
 */

/**
 * B2-R1 规范阳离子标识枚举
 * §2.1 阳离子（共 13 种）
 */
export type B2R1CationId =
  | "H+"
  | "NH4+"
  | "Na+"
  | "K+"
  | "Ca2+"
  | "Mg2+"
  | "Ba2+"
  | "Al3+"
  | "Fe2+"
  | "Fe3+"
  | "Zn2+"
  | "Cu2+"
  | "Ag+";

/**
 * B2-R1 规范阴离子标识枚举
 * §2.2 阴离子与原子团（共 8 种：常规 5 种 + 卤素扩展 3 种）
 */
export type B2R1AnionId =
  | "OH-"
  | "Cl-"
  | "NO3-"
  | "CO32-"
  | "SO42-"
  | "F-"
  | "Br-"
  | "I-";

export type B2R1IonId = B2R1CationId | B2R1AnionId;

export type B2R1IonKind = "cation" | "anion";

/**
 * 离子只读元数据与属性
 */
export interface B2R1IonDefinition {
  readonly id: B2R1IonId;
  readonly formula: string;
  readonly displayFormula: string;
  readonly nameZh: string;
  readonly nameEn: string;
  readonly charge: number;
  readonly kind: B2R1IonKind;
  readonly typicalUses: string;
  readonly isHalogen?: boolean;
}

/**
 * 溶解性类别
 */
export type B2R1Solubility = "soluble" | "slightly_soluble" | "insoluble";

/**
 * 盐物质只读元数据与数据结构
 * §2.3 盐生成规则
 */
export interface B2R1SaltDefinition {
  readonly id: string;
  readonly formula: string;
  readonly displayFormula: string;
  readonly nameZh: string;
  readonly nameEn: string;
  readonly cation: B2R1CationId;
  readonly anion: B2R1AnionId;
  readonly cationCount: number;
  readonly anionCount: number;
  readonly solubility: B2R1Solubility;
  readonly isPrecipitate: boolean;
  readonly tags: readonly string[];
}

/**
 * 盐生成纯函数返回值
 */
export type SaltGenerationResult =
  | {
      readonly success: true;
      readonly salt: B2R1SaltDefinition;
    }
  | {
      readonly success: false;
      readonly reason: string;
    };

/**
 * B2-R1 金属单质标识枚举
 * §3.2, §3.3 至少包含 Cu, Mg, Zn, Fe, Al, Ag
 */
export type B2R1MetalElementId = "Cu" | "Mg" | "Zn" | "Fe" | "Al" | "Ag";

export interface B2R1MetalDefinition {
  readonly id: B2R1MetalElementId;
  readonly symbol: string;
  readonly nameZh: string;
  readonly nameEn: string;
}

/**
 * B2-R1 反应介质标识枚举
 * 至少包含浓 HCl、稀 HNO₃、浓 HNO₃、稀非氧化性酸、水
 */
export type B2R1MediumId =
  | "conc_hcl"
  | "dil_hno3"
  | "conc_hno3"
  | "dil_non_oxidizing_acid"
  | "water";

export interface B2R1MediumDefinition {
  readonly id: B2R1MediumId;
  readonly nameZh: string;
  readonly nameEn: string;
}

/**
 * B2-R1 气体刺激持续状态定义
 * 双语展示名：zh 与 en
 */
export interface B2R1StimulusStatusDefinition {
  readonly id: string;
  readonly nameZh: string;
  readonly nameEn: string;
}

/**
 * B2-R1 金属置换效果标签枚举
 * §3.3 金属置换效果标签
 */
export type B2R1DisplacementEffectTag =
  | "seize_cu2_produce_cu"
  | "silver_mirror_precipitation_entry"
  | "agno3_cl_test_linkage";

export interface B2R1DisplacementEffectTagDefinition {
  readonly id: B2R1DisplacementEffectTag;
  readonly nameZh: string;
  readonly nameEn: string;
}

/**
 * B2-R1 卤素置换产物效果标签枚举
 * §3.4 卤素置换产物标签
 */
export type B2R1HalogenProductTag =
  | "produce_br2_card_or_status"
  | "produce_i2";

export interface B2R1HalogenProductTagDefinition {
  readonly id: B2R1HalogenProductTag;
  readonly nameZh: string;
  readonly nameEn: string;
}

/**
 * 本刀冻结的氧化还原反应行 ID
 * §3.8: OR-KMnO4-HCl-conc
 * §3.7: OR-Cu-HNO3-dil
 * §3.10: OR-Na2FeO4-purify
 * §3.2: OR-Mg-H, OR-Zn-H, OR-Fe-H, OR-Al-H, OR-Cu-H, OR-Ag-H
 * §3.3: OR-Mg-Cu, OR-Zn-Cu, OR-Fe-Cu, OR-Mg-Ag, OR-Zn-Ag, OR-Fe-Ag, OR-Cu-Ag
 * §3.4: OR-Cl2-Br, OR-Cl2-I, OR-Br2-I, OR-Cl2-F
 */
export type B2R1RedoxRowId =
  | "OR-KMnO4-HCl-conc"
  | "OR-Cu-HNO3-dil"
  | "OR-Na2FeO4-purify"
  | "OR-Mg-H"
  | "OR-Zn-H"
  | "OR-Fe-H"
  | "OR-Al-H"
  | "OR-Cu-H"
  | "OR-Ag-H"
  | "OR-Mg-Cu"
  | "OR-Zn-Cu"
  | "OR-Fe-Cu"
  | "OR-Mg-Ag"
  | "OR-Zn-Ag"
  | "OR-Fe-Ag"
  | "OR-Cu-Ag"
  | "OR-Cl2-Br"
  | "OR-Cl2-I"
  | "OR-Br2-I"
  | "OR-Cl2-F";

/**
 * B2-R1 气体标签枚举（§3.2 H₂ 标注可燃气体标签）
 */
export type B2R1GasTag = "flammable_gas";

export interface B2R1GasTagDefinition {
  readonly id: B2R1GasTag;
  readonly nameZh: string;
  readonly nameEn: string;
}

/**
 * B2-R1 反应条件枚举
 * §3.2 本刀仅包含去氧化膜
 */
export type B2R1ReactionCondition = "oxide_film_removed";

/**
 * 氧化还原反应行静态定义
 */
export interface B2R1RedoxReactionDefinition {
  readonly id: B2R1RedoxRowId;
  readonly equation: string;
  readonly medium: B2R1MediumId;
  readonly reactants: readonly string[];
  readonly effectZh: string;
  readonly stimulusStatus?: B2R1StimulusStatusDefinition;
  readonly gasTags?: readonly B2R1GasTag[];
  readonly conditions?: readonly B2R1ReactionCondition[];
  readonly isNoReaction?: boolean;
  readonly solutionIon?: B2R1IonId;
  readonly solutionIons?: readonly B2R1IonId[];
  readonly effectTags?: readonly B2R1DisplacementEffectTag[];
  readonly effectTagZh?: string;
  readonly productTags?: readonly B2R1HalogenProductTag[];
  readonly productTagZh?: string;
}

/**
 * 氧化还原纯函数匹配入参
 */
export interface B2R1RedoxMatchInput {
  readonly reactants?: readonly string[];
  readonly reactant?: string;
  readonly medium?: string;
  readonly conditions?: readonly string[];
  readonly condition?: string;
  readonly solutionIons?: readonly string[];
  readonly solutionIon?: string;
}

/**
 * 氧化还原匹配成功结果
 */
export interface B2R1RedoxMatchSuccess {
  readonly matched: true;
  readonly success: true;
  readonly rowId: B2R1RedoxRowId;
  readonly reaction: B2R1RedoxReactionDefinition;
  readonly stimulusStatus?: B2R1StimulusStatusDefinition;
  readonly statusNameZh?: string;
  readonly statusNameEn?: string;
  readonly statusId?: string;
  readonly effectZh: string;
  readonly gasTags?: readonly B2R1GasTag[];
  readonly isNoReaction?: false;
  readonly solutionIon?: B2R1IonId;
  readonly solutionIons?: readonly B2R1IonId[];
  readonly effectTags?: readonly B2R1DisplacementEffectTag[];
  readonly effectTagZh?: string;
  readonly productTags?: readonly B2R1HalogenProductTag[];
  readonly productTagZh?: string;
}

/**
 * 氧化还原匹配失败或显式不反应结果
 */
export interface B2R1RedoxMatchFailure {
  readonly matched: false;
  readonly success: false;
  readonly rowId?: B2R1RedoxRowId;
  readonly reaction?: B2R1RedoxReactionDefinition;
  readonly stimulusStatus?: undefined;
  readonly statusNameZh?: undefined;
  readonly statusNameEn?: undefined;
  readonly statusId?: undefined;
  readonly effectZh?: string;
  readonly gasTags?: undefined;
  readonly isNoReaction?: boolean;
  readonly reason: string;
  readonly solutionIon?: undefined;
  readonly solutionIons?: undefined;
  readonly effectTags?: undefined;
  readonly effectTagZh?: undefined;
  readonly productTags?: undefined;
  readonly productTagZh?: undefined;
}

export type B2R1RedoxMatchResult = B2R1RedoxMatchSuccess | B2R1RedoxMatchFailure;

