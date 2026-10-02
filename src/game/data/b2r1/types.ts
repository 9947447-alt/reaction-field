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
