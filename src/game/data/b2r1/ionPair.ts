/** Frozen Phase 22 §2.4 ion-pair rows and their independent strict matcher. */

import { B2R1_ALL_ION_DEFINITIONS, normalizeIonId } from "./ions";
import { normalizeMediumId, normalizeReactionCondition } from "./redox";
import type {
  B2R1IonPairMatchInput,
  B2R1IonPairMatchResult,
  B2R1IonPairReactionDefinition,
  B2R1RedoxRowId,
  B2R1ReactionCondition,
} from "./types";

const NO_CONDITIONS: readonly B2R1ReactionCondition[] = Object.freeze([]);
const HEATING_CONDITIONS: readonly B2R1ReactionCondition[] = Object.freeze(["heating"]);
const AMMONIUM_REDOX_CROSS_REFERENCES: readonly B2R1RedoxRowId[] = Object.freeze(["OR-NH4-OH-heat"]);
const SO2_REDOX_CROSS_REFERENCES: readonly B2R1RedoxRowId[] = Object.freeze(["OR-SO2-OH"]);
const FE3_REDOX_CROSS_REFERENCES: readonly B2R1RedoxRowId[] = Object.freeze(["OR-Fe3-OH"]);

export const B2R1_ION_PAIR_REACTION_ROWS: readonly B2R1IonPairReactionDefinition[] = Object.freeze([
  Object.freeze({
    rowId: "IP-NEUTRALIZATION-H-OH",
    reactionKind: "neutralization",
    components: Object.freeze([
      Object.freeze({ identity: "H+", count: 1 }),
      Object.freeze({ identity: "OH-", count: 1 }),
    ]),
    medium: "water",
    conditions: NO_CONDITIONS,
    equation: "H⁺ + OH⁻ → H₂O",
    resultIdentity: undefined,
    products: Object.freeze([
      Object.freeze({
        identity: "substance_h2o",
        identityKind: "definition",
        formula: "H2O",
        displayFormula: "H₂O",
        count: 1,
        definitionId: "substance_h2o",
      }),
    ]),
    legacyReactionDefinitionId: "acid_base_neutralization",
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: Object.freeze([
      "Phase 22 §2.4 第 1 项",
      "手册 §三 H⁺ 行 × OH⁻ 列、§四 4.1 OH⁻ 与 4.2 H⁺ 行",
      "Phase 10 §二",
    ]),
  }),
  Object.freeze({
    rowId: "IP-GAS-ACID-CARBONATE",
    reactionKind: "gas_evolution",
    components: Object.freeze([
      Object.freeze({ identity: "H+", count: 2 }),
      Object.freeze({ identity: "CO32-", count: 1 }),
    ]),
    medium: "water",
    conditions: NO_CONDITIONS,
    equation: "2H⁺ + CO₃²⁻ → CO₂↑ + H₂O",
    resultIdentity: undefined,
    products: Object.freeze([
      Object.freeze({
        identity: "substance_co2",
        identityKind: "definition",
        formula: "CO2",
        displayFormula: "CO₂",
        count: 1,
        definitionId: "substance_co2",
      }),
      Object.freeze({
        identity: "substance_h2o",
        identityKind: "definition",
        formula: "H2O",
        displayFormula: "H₂O",
        count: 1,
        definitionId: "substance_h2o",
      }),
    ]),
    legacyReactionDefinitionId: "acid_carbonate_co2",
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: Object.freeze([
      "Phase 22 §2.4 第 2 项",
      "手册 §三 H⁺ 行 × CO₃²⁻ 列、§四 4.1 CO₃²⁻ 行",
      "Phase 10 §三",
    ]),
  }),
  Object.freeze({
    rowId: "IP-GAS-AMMONIUM-HYDROXIDE-HEAT",
    reactionKind: "gas_evolution",
    components: Object.freeze([
      Object.freeze({ identity: "NH4+", count: 1 }),
      Object.freeze({ identity: "OH-", count: 1 }),
    ]),
    medium: "water",
    conditions: HEATING_CONDITIONS,
    equation: "NH₄⁺ + OH⁻ —【加热】→ NH₃↑ + H₂O",
    resultIdentity: undefined,
    products: Object.freeze([
      Object.freeze({
        identity: "substance_nh3",
        identityKind: "definition",
        formula: "NH3",
        displayFormula: "NH₃",
        count: 1,
        definitionId: "substance_nh3",
      }),
      Object.freeze({
        identity: "substance_h2o",
        identityKind: "definition",
        formula: "H2O",
        displayFormula: "H₂O",
        count: 1,
        definitionId: "substance_h2o",
      }),
    ]),
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: AMMONIUM_REDOX_CROSS_REFERENCES,
    overlapOwner: "ion_pair",
    sources: Object.freeze([
      "Phase 22 §2.1 NH₄⁺ 用途、§3.7 OR-NH4-OH-heat",
      "手册 §三 OH⁻ 行 × NH₄⁺ 列、§四 4.2 NH₄⁺ 与 4.6 NH₄⁺ 行",
      "将此 overlap 纳入 §2.4 是本任务用户裁定",
    ]),
  }),
  Object.freeze({
    rowId: "IP-ABSORPTION-SO2-OH",
    reactionKind: "absorption",
    components: Object.freeze([
      Object.freeze({ identity: "SO2", count: 1, definitionId: "substance_so2" }),
      Object.freeze({ identity: "OH-", count: 2 }),
    ]),
    medium: "water",
    conditions: NO_CONDITIONS,
    equation: "SO₂ + 2OH⁻ → SO₃²⁻ + H₂O",
    resultIdentity: "absorption:so2-alkaline",
    products: Object.freeze([
      Object.freeze({
        identity: "SO3^2-",
        identityKind: "display_only_formula",
        formula: "SO3^2-",
        displayFormula: "SO₃²⁻",
        count: 1,
      }),
      Object.freeze({
        identity: "substance_h2o",
        identityKind: "definition",
        formula: "H2O",
        displayFormula: "H₂O",
        count: 1,
        definitionId: "substance_h2o",
      }),
    ]),
    legacyReactionDefinitionId: "so2_alkaline_absorption",
    redoxCrossReferences: SO2_REDOX_CROSS_REFERENCES,
    overlapOwner: "ion_pair",
    sources: Object.freeze([
      "Phase 22 §2.4 第 3 项、§3.6 OR-SO2-OH",
      "手册 §四 4.2 SO₂ 行",
      "Phase 10 §四",
      "由 §2.4 唯一拥有此 overlap 是本任务用户裁定",
    ]),
  }),
  Object.freeze({
    rowId: "IP-PRECIPITATION-BASO4",
    reactionKind: "precipitation",
    components: Object.freeze([
      Object.freeze({ identity: "Ba2+", count: 1 }),
      Object.freeze({ identity: "SO42-", count: 1 }),
    ]),
    medium: "water",
    conditions: NO_CONDITIONS,
    equation: "Ba²⁺ + SO₄²⁻ → BaSO₄↓",
    resultIdentity: undefined,
    products: Object.freeze([
      Object.freeze({
        identity: "substance_baso4",
        identityKind: "definition",
        formula: "BaSO4",
        displayFormula: "BaSO₄",
        count: 1,
        definitionId: "substance_baso4",
      }),
    ]),
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: Object.freeze([
      "Phase 22 §2.4 第 4 项、§2.3 BaSO₄ 配方",
      "手册 §三 Ba²⁺ 行 × SO₄²⁻ 列、§四 4.3 Ba²⁺ 行",
    ]),
  }),
  Object.freeze({
    rowId: "IP-PRECIPITATION-BACO3",
    reactionKind: "precipitation",
    components: Object.freeze([
      Object.freeze({ identity: "Ba2+", count: 1 }),
      Object.freeze({ identity: "CO32-", count: 1 }),
    ]),
    medium: "water",
    conditions: NO_CONDITIONS,
    equation: "Ba²⁺ + CO₃²⁻ → BaCO₃↓",
    resultIdentity: undefined,
    products: Object.freeze([
      Object.freeze({
        identity: "substance_baco3",
        identityKind: "definition",
        formula: "BaCO3",
        displayFormula: "BaCO₃",
        count: 1,
        definitionId: "substance_baco3",
      }),
    ]),
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: Object.freeze([
      "Phase 22 §2.1 Ba²⁺ 用途、§2.3 BaCO₃ 配方",
      "手册 §三 Ba²⁺ 行 × CO₃²⁻ 列、§四 4.4 Ba²⁺ 行",
    ]),
  }),
  Object.freeze({
    rowId: "IP-PRECIPITATION-CACO3",
    reactionKind: "precipitation",
    components: Object.freeze([
      Object.freeze({ identity: "Ca2+", count: 1 }),
      Object.freeze({ identity: "CO32-", count: 1 }),
    ]),
    medium: "water",
    conditions: NO_CONDITIONS,
    equation: "Ca²⁺ + CO₃²⁻ → CaCO₃↓",
    resultIdentity: undefined,
    products: Object.freeze([
      Object.freeze({
        identity: "substance_caco3",
        identityKind: "definition",
        formula: "CaCO3",
        displayFormula: "CaCO₃",
        count: 1,
        definitionId: "substance_caco3",
      }),
    ]),
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: Object.freeze([
      "Phase 22 §2.4 第 4 项、§2.3 CaCO₃ 配方",
      "手册 §三 Ca²⁺ 行 × CO₃²⁻ 列、§四 4.4 Ca²⁺ 行",
    ]),
  }),
  Object.freeze({
    rowId: "IP-PRECIPITATION-AGCL",
    reactionKind: "precipitation",
    components: Object.freeze([
      Object.freeze({ identity: "Ag+", count: 1 }),
      Object.freeze({ identity: "Cl-", count: 1 }),
    ]),
    medium: "water",
    conditions: NO_CONDITIONS,
    equation: "Ag⁺ + Cl⁻ → AgCl↓",
    resultIdentity: undefined,
    products: Object.freeze([
      Object.freeze({
        identity: "substance_agcl",
        identityKind: "definition",
        formula: "AgCl",
        displayFormula: "AgCl",
        count: 1,
        definitionId: "substance_agcl",
      }),
    ]),
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: Object.freeze([
      "Phase 22 §2.4 第 4 项、§2.3 AgCl 配方",
      "手册 §三 Ag⁺ 行 × Cl⁻ 列、§四 4.5 Ag⁺ 行",
    ]),
  }),
  Object.freeze({
    rowId: "IP-PRECIPITATION-AG2CO3",
    reactionKind: "precipitation",
    components: Object.freeze([
      Object.freeze({ identity: "Ag+", count: 2 }),
      Object.freeze({ identity: "CO32-", count: 1 }),
    ]),
    medium: "water",
    conditions: NO_CONDITIONS,
    equation: "2Ag⁺ + CO₃²⁻ → Ag₂CO₃↓",
    resultIdentity: undefined,
    products: Object.freeze([
      Object.freeze({
        identity: "substance_ag2co3",
        identityKind: "definition",
        formula: "Ag2CO3",
        displayFormula: "Ag₂CO₃",
        count: 1,
        definitionId: "substance_ag2co3",
      }),
    ]),
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: Object.freeze([
      "Phase 22 §2.3 Ag₂CO₃ 盐配方及‘进阶沉淀’说明",
      "手册 §三 Ag⁺ 行 × CO₃²⁻ 列、§四 4.4 Ag⁺ 行",
      "将进阶行授权为 executable v0.1 是本任务用户裁定",
    ]),
  }),
  Object.freeze({
    rowId: "IP-PRECIPITATION-CUOH2",
    reactionKind: "precipitation",
    components: Object.freeze([
      Object.freeze({ identity: "Cu2+", count: 1 }),
      Object.freeze({ identity: "OH-", count: 2 }),
    ]),
    medium: "water",
    conditions: NO_CONDITIONS,
    equation: "Cu²⁺ + 2OH⁻ → Cu(OH)₂↓",
    resultIdentity: "formula:Cu(OH)2",
    products: Object.freeze([
      Object.freeze({
        identity: "formula:Cu(OH)2",
        identityKind: "result_only_formula",
        formula: "Cu(OH)2",
        displayFormula: "Cu(OH)₂",
        count: 1,
      }),
    ]),
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: Object.freeze([
      "Phase 22 §2.1 Cu²⁺ 用途",
      "手册 §三 Cu²⁺ 行 × OH⁻ 列、§四 4.2 Cu²⁺ 行",
      "result-only identity 是本任务用户裁定",
    ]),
  }),
  Object.freeze({
    rowId: "IP-PRECIPITATION-FE3OH3",
    reactionKind: "precipitation",
    components: Object.freeze([
      Object.freeze({ identity: "Fe3+", count: 1 }),
      Object.freeze({ identity: "OH-", count: 3 }),
    ]),
    medium: "water",
    conditions: NO_CONDITIONS,
    equation: "Fe³⁺ + 3OH⁻ → Fe(OH)₃↓",
    resultIdentity: "formula:Fe(OH)3",
    products: Object.freeze([
      Object.freeze({
        identity: "formula:Fe(OH)3",
        identityKind: "result_only_formula",
        formula: "Fe(OH)3",
        displayFormula: "Fe(OH)₃",
        count: 1,
      }),
    ]),
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: FE3_REDOX_CROSS_REFERENCES,
    overlapOwner: "ion_pair",
    sources: Object.freeze([
      "Phase 22 §3.5 OR-Fe3-OH",
      "手册 §三 Fe³⁺ 行 × OH⁻ 列、§四 4.2 Fe³⁺ 行",
      "由 §2.4 唯一拥有 overlap 及 result-only identity 是本任务用户裁定",
    ]),
  }),
  Object.freeze({
    rowId: "IP-PRECIPITATION-FE2OH2",
    reactionKind: "precipitation",
    components: Object.freeze([
      Object.freeze({ identity: "Fe2+", count: 1 }),
      Object.freeze({ identity: "OH-", count: 2 }),
    ]),
    medium: "water",
    conditions: NO_CONDITIONS,
    equation: "Fe²⁺ + 2OH⁻ → Fe(OH)₂↓",
    resultIdentity: "formula:Fe(OH)2",
    products: Object.freeze([
      Object.freeze({
        identity: "formula:Fe(OH)2",
        identityKind: "result_only_formula",
        formula: "Fe(OH)2",
        displayFormula: "Fe(OH)₂",
        count: 1,
      }),
    ]),
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: Object.freeze([
      "Phase 22 §2.1 Fe²⁺ 用途",
      "手册 §三 Fe²⁺ 行 × OH⁻ 列、§四 4.2 Fe²⁺ 行",
      "result-only identity 是本任务用户裁定",
    ]),
  }),
]);

const NO_MATCH: B2R1IonPairMatchResult = Object.freeze({ matched: false, success: false });
const CANONICAL_ION_IDS: ReadonlySet<string> = new Set(
  B2R1_ALL_ION_DEFINITIONS.map(({ id }) => id),
);
const REACTION_CONDITION_IDS: ReadonlySet<string> = new Set([
  "oxide_film_removed",
  "ignition",
  "heating",
  "catalysis",
  "high_temperature",
  "mno2_catalysis",
]);
const ALLOWED_INPUT_KEYS = new Set<PropertyKey>(["components", "medium", "conditions"]);
const OBJECT_PROTOTYPE_BUILTIN_KEYS = new Set<PropertyKey>([
  "constructor",
  "__defineGetter__",
  "__defineSetter__",
  "hasOwnProperty",
  "__lookupGetter__",
  "__lookupSetter__",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "toString",
  "valueOf",
  "__proto__",
  "toLocaleString",
]);
const DEFAULT_OBJECT_CONSTRUCTOR_SOURCE = Function.prototype.toString.call(Object);
const SUCCESS_BY_ROW = new Map(
  B2R1_ION_PAIR_REACTION_ROWS.map((reaction) => [
    reaction.rowId,
    Object.freeze({
      matched: true as const,
      success: true as const,
      rowId: reaction.rowId,
      reaction,
    }),
  ]),
);

function readDenseStringArray(value: unknown, allowEmpty: boolean): string[] | undefined {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) return undefined;

  const strings: string[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor) return undefined;
    const item: unknown = value[index];
    if (typeof item !== "string") return undefined;
    strings.push(item);
  }
  return strings;
}

function normalizeComponentIdentity(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  if (trimmed === "SO2") return "SO2";

  const normalized: unknown = normalizeIonId(trimmed);
  return typeof normalized === "string" && CANONICAL_ION_IDS.has(normalized)
    ? normalized
    : undefined;
}

function exactComponentMultiset(
  actual: readonly string[],
  expected: B2R1IonPairReactionDefinition["components"],
): boolean {
  const expectedLength = expected.reduce((total, component) => total + component.count, 0);
  if (actual.length !== expectedLength) return false;

  const counts = new Map<string, number>();
  for (const identity of actual) counts.set(identity, (counts.get(identity) ?? 0) + 1);
  for (const component of expected) {
    const actualCount = counts.get(component.identity);
    if (actualCount !== component.count) return false;
    counts.delete(component.identity);
  }
  return counts.size === 0;
}

function exactConditions(
  actual: readonly B2R1ReactionCondition[],
  expected: readonly B2R1ReactionCondition[],
): boolean {
  return actual.length === expected.length && expected.every((condition, index) => actual[index] === condition);
}

function isDefaultObjectPrototype(value: object): boolean {
  if (Object.getPrototypeOf(value) !== null) return false;
  const constructorDescriptor = Object.getOwnPropertyDescriptor(value, "constructor");
  if (!constructorDescriptor || !("value" in constructorDescriptor) || typeof constructorDescriptor.value !== "function") {
    return false;
  }
  if (Function.prototype.toString.call(constructorDescriptor.value) !== DEFAULT_OBJECT_CONSTRUCTOR_SOURCE) {
    return false;
  }
  const constructorPrototype = Object.getOwnPropertyDescriptor(constructorDescriptor.value, "prototype");
  if (constructorPrototype?.value !== value) return false;
  for (const key of OBJECT_PROTOTYPE_BUILTIN_KEYS) {
    if (Object.getOwnPropertyDescriptor(value, key) === undefined) return false;
  }
  return true;
}

function isDefaultClassConstructor(prototype: object): boolean {
  const constructorDescriptor = Object.getOwnPropertyDescriptor(prototype, "constructor");
  if (!constructorDescriptor || !("value" in constructorDescriptor) || typeof constructorDescriptor.value !== "function") {
    return false;
  }
  return Object.getOwnPropertyDescriptor(constructorDescriptor.value, "prototype")?.value === prototype;
}

function hasOnlyAllowedInputKeys(input: object): boolean {
  let current: object | null = input;
  let isInput = true;
  const visited = new Set<object>();
  while (current !== null && !visited.has(current)) {
    visited.add(current);
    const isObjectPrototype = !isInput && isDefaultObjectPrototype(current);
    for (const key of Reflect.ownKeys(current)) {
      if (ALLOWED_INPUT_KEYS.has(key)) continue;
      if (isObjectPrototype && OBJECT_PROTOTYPE_BUILTIN_KEYS.has(key)) continue;
      if (!isInput && key === "constructor" && isDefaultClassConstructor(current)) continue;
      return false;
    }
    if (isObjectPrototype) return true;
    isInput = false;
    current = Object.getPrototypeOf(current);
  }
  return true;
}

function normalizeInput(input: unknown): {
  readonly components: readonly string[];
  readonly medium: "water";
  readonly conditions: readonly B2R1ReactionCondition[];
} | undefined {
  try {
    if (input === null || typeof input !== "object" || Array.isArray(input)) return undefined;
    if (!hasOnlyAllowedInputKeys(input)) return undefined;

    const structuralInput = input as {
      readonly components?: unknown;
      readonly medium?: unknown;
      readonly conditions?: unknown;
    };
    const rawComponents = readDenseStringArray(structuralInput.components, false);
    if (!rawComponents) return undefined;

    const components: string[] = [];
    for (const rawComponent of rawComponents) {
      const identity = normalizeComponentIdentity(rawComponent);
      if (identity === undefined) return undefined;
      components.push(identity);
    }

    const mediumValue = structuralInput.medium;
    if (mediumValue !== undefined && typeof mediumValue !== "string") return undefined;
    const medium = mediumValue === undefined ? "water" : normalizeMediumId(mediumValue);
    if (medium !== "water") return undefined;

    const conditionsValue = structuralInput.conditions;
    let rawConditions: string[];
    if (conditionsValue === undefined) {
      rawConditions = [];
    } else {
      const denseConditions = readDenseStringArray(conditionsValue, true);
      if (!denseConditions) return undefined;
      rawConditions = denseConditions;
    }

    const conditions: B2R1ReactionCondition[] = [];
    for (const rawCondition of rawConditions) {
      if (rawCondition.trim() === "") return undefined;
      const normalized: unknown = normalizeReactionCondition(rawCondition);
      if (typeof normalized !== "string" || !REACTION_CONDITION_IDS.has(normalized)) {
        return undefined;
      }
      conditions.push(normalized as B2R1ReactionCondition);
    }

    return { components, medium, conditions };
  } catch {
    return undefined;
  }
}

/** Match one exact Frozen §2.4 row without changing input or invoking another matcher. */
export function matchB2R1IonPairReaction(input: B2R1IonPairMatchInput): B2R1IonPairMatchResult {
  const normalized = normalizeInput(input);
  if (!normalized) return NO_MATCH;

  for (const reaction of B2R1_ION_PAIR_REACTION_ROWS) {
    if (
      reaction.medium === normalized.medium &&
      exactConditions(normalized.conditions, reaction.conditions) &&
      exactComponentMultiset(normalized.components, reaction.components)
    ) {
      return SUCCESS_BY_ROW.get(reaction.rowId)!;
    }
  }
  return NO_MATCH;
}
