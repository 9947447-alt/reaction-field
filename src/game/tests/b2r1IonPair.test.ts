import { describe, expect, it } from "vitest";
import {
  B2R1_ION_PAIR_REACTION_ROWS,
  matchB2R1IonPairReaction,
  normalizeIonId,
} from "../data/b2r1";
import type {
  B2R1IonPairMatchInput,
  B2R1IonPairMatchResult,
} from "../data/b2r1/types";

const EXPECTED_ROWS = [
  {
    rowId: "IP-NEUTRALIZATION-H-OH",
    reactionKind: "neutralization",
    components: [{ identity: "H+", count: 1 }, { identity: "OH-", count: 1 }],
    medium: "water",
    conditions: [],
    equation: "H⁺ + OH⁻ → H₂O",
    resultIdentity: undefined,
    products: [
      { identity: "substance_h2o", identityKind: "definition", formula: "H2O", displayFormula: "H₂O", count: 1, definitionId: "substance_h2o" },
    ],
    legacyReactionDefinitionId: "acid_base_neutralization",
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: ["Phase 22 §2.4 第 1 项", "手册 §三 H⁺ 行 × OH⁻ 列、§四 4.1 OH⁻ 与 4.2 H⁺ 行", "Phase 10 §二"],
  },
  {
    rowId: "IP-GAS-ACID-CARBONATE",
    reactionKind: "gas_evolution",
    components: [{ identity: "H+", count: 2 }, { identity: "CO32-", count: 1 }],
    medium: "water",
    conditions: [],
    equation: "2H⁺ + CO₃²⁻ → CO₂↑ + H₂O",
    resultIdentity: undefined,
    products: [
      { identity: "substance_co2", identityKind: "definition", formula: "CO2", displayFormula: "CO₂", count: 1, definitionId: "substance_co2" },
      { identity: "substance_h2o", identityKind: "definition", formula: "H2O", displayFormula: "H₂O", count: 1, definitionId: "substance_h2o" },
    ],
    legacyReactionDefinitionId: "acid_carbonate_co2",
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: ["Phase 22 §2.4 第 2 项", "手册 §三 H⁺ 行 × CO₃²⁻ 列、§四 4.1 CO₃²⁻ 行", "Phase 10 §三"],
  },
  {
    rowId: "IP-GAS-AMMONIUM-HYDROXIDE-HEAT",
    reactionKind: "gas_evolution",
    components: [{ identity: "NH4+", count: 1 }, { identity: "OH-", count: 1 }],
    medium: "water",
    conditions: ["heating"],
    equation: "NH₄⁺ + OH⁻ —【加热】→ NH₃↑ + H₂O",
    resultIdentity: undefined,
    products: [
      { identity: "substance_nh3", identityKind: "definition", formula: "NH3", displayFormula: "NH₃", count: 1, definitionId: "substance_nh3" },
      { identity: "substance_h2o", identityKind: "definition", formula: "H2O", displayFormula: "H₂O", count: 1, definitionId: "substance_h2o" },
    ],
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: ["OR-NH4-OH-heat"],
    overlapOwner: "ion_pair",
    sources: ["Phase 22 §2.1 NH₄⁺ 用途、§3.7 OR-NH4-OH-heat", "手册 §三 OH⁻ 行 × NH₄⁺ 列、§四 4.2 NH₄⁺ 与 4.6 NH₄⁺ 行", "将此 overlap 纳入 §2.4 是本任务用户裁定"],
  },
  {
    rowId: "IP-ABSORPTION-SO2-OH",
    reactionKind: "absorption",
    components: [{ identity: "SO2", count: 1, definitionId: "substance_so2" }, { identity: "OH-", count: 2 }],
    medium: "water",
    conditions: [],
    equation: "SO₂ + 2OH⁻ → SO₃²⁻ + H₂O",
    resultIdentity: "absorption:so2-alkaline",
    products: [
      { identity: "SO3^2-", identityKind: "display_only_formula", formula: "SO3^2-", displayFormula: "SO₃²⁻", count: 1 },
      { identity: "substance_h2o", identityKind: "definition", formula: "H2O", displayFormula: "H₂O", count: 1, definitionId: "substance_h2o" },
    ],
    legacyReactionDefinitionId: "so2_alkaline_absorption",
    redoxCrossReferences: ["OR-SO2-OH"],
    overlapOwner: "ion_pair",
    sources: ["Phase 22 §2.4 第 3 项、§3.6 OR-SO2-OH", "手册 §四 4.2 SO₂ 行", "Phase 10 §四", "由 §2.4 唯一拥有此 overlap 是本任务用户裁定"],
  },
  {
    rowId: "IP-PRECIPITATION-BASO4",
    reactionKind: "precipitation",
    components: [{ identity: "Ba2+", count: 1 }, { identity: "SO42-", count: 1 }],
    medium: "water",
    conditions: [],
    equation: "Ba²⁺ + SO₄²⁻ → BaSO₄↓",
    resultIdentity: undefined,
    products: [
      { identity: "substance_baso4", identityKind: "definition", formula: "BaSO4", displayFormula: "BaSO₄", count: 1, definitionId: "substance_baso4" },
    ],
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: ["Phase 22 §2.4 第 4 项、§2.3 BaSO₄ 配方", "手册 §三 Ba²⁺ 行 × SO₄²⁻ 列、§四 4.3 Ba²⁺ 行"],
  },
  {
    rowId: "IP-PRECIPITATION-BACO3",
    reactionKind: "precipitation",
    components: [{ identity: "Ba2+", count: 1 }, { identity: "CO32-", count: 1 }],
    medium: "water",
    conditions: [],
    equation: "Ba²⁺ + CO₃²⁻ → BaCO₃↓",
    resultIdentity: undefined,
    products: [
      { identity: "substance_baco3", identityKind: "definition", formula: "BaCO3", displayFormula: "BaCO₃", count: 1, definitionId: "substance_baco3" },
    ],
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: ["Phase 22 §2.1 Ba²⁺ 用途、§2.3 BaCO₃ 配方", "手册 §三 Ba²⁺ 行 × CO₃²⁻ 列、§四 4.4 Ba²⁺ 行"],
  },
  {
    rowId: "IP-PRECIPITATION-CACO3",
    reactionKind: "precipitation",
    components: [{ identity: "Ca2+", count: 1 }, { identity: "CO32-", count: 1 }],
    medium: "water",
    conditions: [],
    equation: "Ca²⁺ + CO₃²⁻ → CaCO₃↓",
    resultIdentity: undefined,
    products: [
      { identity: "substance_caco3", identityKind: "definition", formula: "CaCO3", displayFormula: "CaCO₃", count: 1, definitionId: "substance_caco3" },
    ],
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: ["Phase 22 §2.4 第 4 项、§2.3 CaCO₃ 配方", "手册 §三 Ca²⁺ 行 × CO₃²⁻ 列、§四 4.4 Ca²⁺ 行"],
  },
  {
    rowId: "IP-PRECIPITATION-AGCL",
    reactionKind: "precipitation",
    components: [{ identity: "Ag+", count: 1 }, { identity: "Cl-", count: 1 }],
    medium: "water",
    conditions: [],
    equation: "Ag⁺ + Cl⁻ → AgCl↓",
    resultIdentity: undefined,
    products: [
      { identity: "substance_agcl", identityKind: "definition", formula: "AgCl", displayFormula: "AgCl", count: 1, definitionId: "substance_agcl" },
    ],
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: ["Phase 22 §2.4 第 4 项、§2.3 AgCl 配方", "手册 §三 Ag⁺ 行 × Cl⁻ 列、§四 4.5 Ag⁺ 行"],
  },
  {
    rowId: "IP-PRECIPITATION-AG2CO3",
    reactionKind: "precipitation",
    components: [{ identity: "Ag+", count: 2 }, { identity: "CO32-", count: 1 }],
    medium: "water",
    conditions: [],
    equation: "2Ag⁺ + CO₃²⁻ → Ag₂CO₃↓",
    resultIdentity: undefined,
    products: [
      { identity: "substance_ag2co3", identityKind: "definition", formula: "Ag2CO3", displayFormula: "Ag₂CO₃", count: 1, definitionId: "substance_ag2co3" },
    ],
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: ["Phase 22 §2.3 Ag₂CO₃ 盐配方及‘进阶沉淀’说明", "手册 §三 Ag⁺ 行 × CO₃²⁻ 列、§四 4.4 Ag⁺ 行", "将进阶行授权为 executable v0.1 是本任务用户裁定"],
  },
  {
    rowId: "IP-PRECIPITATION-CUOH2",
    reactionKind: "precipitation",
    components: [{ identity: "Cu2+", count: 1 }, { identity: "OH-", count: 2 }],
    medium: "water",
    conditions: [],
    equation: "Cu²⁺ + 2OH⁻ → Cu(OH)₂↓",
    resultIdentity: "formula:Cu(OH)2",
    products: [
      { identity: "formula:Cu(OH)2", identityKind: "result_only_formula", formula: "Cu(OH)2", displayFormula: "Cu(OH)₂", count: 1 },
    ],
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: ["Phase 22 §2.1 Cu²⁺ 用途", "手册 §三 Cu²⁺ 行 × OH⁻ 列、§四 4.2 Cu²⁺ 行", "result-only identity 是本任务用户裁定"],
  },
  {
    rowId: "IP-PRECIPITATION-FE3OH3",
    reactionKind: "precipitation",
    components: [{ identity: "Fe3+", count: 1 }, { identity: "OH-", count: 3 }],
    medium: "water",
    conditions: [],
    equation: "Fe³⁺ + 3OH⁻ → Fe(OH)₃↓",
    resultIdentity: "formula:Fe(OH)3",
    products: [
      { identity: "formula:Fe(OH)3", identityKind: "result_only_formula", formula: "Fe(OH)3", displayFormula: "Fe(OH)₃", count: 1 },
    ],
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: ["OR-Fe3-OH"],
    overlapOwner: "ion_pair",
    sources: ["Phase 22 §3.5 OR-Fe3-OH", "手册 §三 Fe³⁺ 行 × OH⁻ 列、§四 4.2 Fe³⁺ 行", "由 §2.4 唯一拥有 overlap 及 result-only identity 是本任务用户裁定"],
  },
  {
    rowId: "IP-PRECIPITATION-FE2OH2",
    reactionKind: "precipitation",
    components: [{ identity: "Fe2+", count: 1 }, { identity: "OH-", count: 2 }],
    medium: "water",
    conditions: [],
    equation: "Fe²⁺ + 2OH⁻ → Fe(OH)₂↓",
    resultIdentity: "formula:Fe(OH)2",
    products: [
      { identity: "formula:Fe(OH)2", identityKind: "result_only_formula", formula: "Fe(OH)2", displayFormula: "Fe(OH)₂", count: 1 },
    ],
    legacyReactionDefinitionId: undefined,
    redoxCrossReferences: undefined,
    overlapOwner: undefined,
    sources: ["Phase 22 §2.1 Fe²⁺ 用途", "手册 §三 Fe²⁺ 行 × OH⁻ 列、§四 4.2 Fe²⁺ 行", "result-only identity 是本任务用户裁定"],
  },
] as const;

const ION_ALIASES = [
  ["H+", "H⁺"], ["NH4+", "NH₄⁺"], ["Na+", "Na⁺"], ["K+", "K⁺"],
  ["Ca2+", "Ca²⁺"], ["Mg2+", "Mg²⁺"], ["Ba2+", "Ba²⁺"], ["Al3+", "Al³⁺"],
  ["Fe2+", "Fe²⁺"], ["Fe3+", "Fe³⁺"], ["Zn2+", "Zn²⁺"], ["Cu2+", "Cu²⁺"],
  ["Ag+", "Ag⁺"], ["OH-", "OH⁻"], ["Cl-", "Cl⁻"], ["NO3-", "NO₃⁻"],
  ["CO32-", "CO3^2-"], ["CO32-", "CO3²⁻"], ["CO32-", "CO₃²⁻"],
  ["SO42-", "SO4^2-"], ["SO42-", "SO₄²⁻"], ["F-", "F⁻"],
  ["Br-", "Br⁻"], ["I-", "I⁻"],
] as const;

function expandComponents(components: readonly { readonly identity: string; readonly count: number }[]): string[] {
  return components.flatMap(({ identity, count }) => Array.from({ length: count }, () => identity));
}

function matchUnknown(input: unknown) {
  return matchB2R1IonPairReaction(input as B2R1IonPairMatchInput);
}

function expectRow(
  result: B2R1IonPairMatchResult,
  rowId: string,
): Extract<B2R1IonPairMatchResult, { readonly matched: true }> {
  expect(result.matched).toBe(true);
  if (!result.matched) throw new Error(`Expected ${rowId} to match.`);
  expect(result.rowId).toBe(rowId);
  return result;
}

function isDeeplyFrozen(value: unknown): boolean {
  if (value === null || typeof value !== "object") return true;
  if (!Object.isFrozen(value)) return false;
  return Reflect.ownKeys(value).every((key) =>
    isDeeplyFrozen((value as Record<PropertyKey, unknown>)[key]),
  );
}

describe("B2-R1 ion-pair static rows", () => {
  it("contains exactly the frozen 12 IDs, categories, complete row contracts and source links", () => {
    expect(B2R1_ION_PAIR_REACTION_ROWS).toHaveLength(12);
    expect(B2R1_ION_PAIR_REACTION_ROWS.map(({ rowId }) => rowId)).toEqual(
      EXPECTED_ROWS.map(({ rowId }) => rowId),
    );
    expect(new Set(B2R1_ION_PAIR_REACTION_ROWS.map(({ rowId }) => rowId)).size).toBe(12);
    expect(B2R1_ION_PAIR_REACTION_ROWS).toEqual(EXPECTED_ROWS);

    const counts = B2R1_ION_PAIR_REACTION_ROWS.reduce<Record<string, number>>((total, row) => {
      total[row.reactionKind] = (total[row.reactionKind] ?? 0) + 1;
      return total;
    }, {});
    expect(counts).toEqual({ neutralization: 1, gas_evolution: 2, absorption: 1, precipitation: 8 });
  });

  it("deep-freezes every row and nested input, product, cross-reference and source array", () => {
    expect(Array.isArray(B2R1_ION_PAIR_REACTION_ROWS)).toBe(true);
    expect(isDeeplyFrozen(B2R1_ION_PAIR_REACTION_ROWS)).toBe(true);
  });
});

describe("matchB2R1IonPairReaction", () => {
  it.each(EXPECTED_ROWS)("matches $rowId by identity and reverse component order", (expected) => {
    const components = expandComponents(expected.components);
    const conditions = expected.conditions;
    const forward = matchB2R1IonPairReaction({ components, medium: "water", conditions });
    const reverse = matchB2R1IonPairReaction({
      components: [...components].reverse(),
      medium: "water",
      conditions: [...conditions],
    });

    const forwardSuccess = expectRow(forward, expected.rowId);
    const reverseSuccess = expectRow(reverse, expected.rowId);
    expect(forwardSuccess).toMatchObject({ success: true });
    expect(forwardSuccess.reaction).toBe(B2R1_ION_PAIR_REACTION_ROWS.find(({ rowId }) => rowId === expected.rowId));
    expect(reverseSuccess.reaction).toBe(forwardSuccess.reaction);
  });

  it.each(EXPECTED_ROWS)("requires the complete exact multiset for $rowId", (expected) => {
    const components = expandComponents(expected.components);
    const validOptions = { medium: "water", conditions: expected.conditions };
    const firstIndex = 0;
    const firstIdentity = components[firstIndex];
    const firstIon = expected.components.find(({ identity }) => identity !== "SO2")?.identity;
    const alias = ION_ALIASES.find(([canonical]) => canonical === firstIon)?.[1];
    const aliasMixed = [...components];
    if (firstIon && alias) aliasMixed[aliasMixed.indexOf(firstIon)] = alias;

    const variants: readonly [string, readonly string[]][] = [
      ["one component missing", components.slice(0, -1)],
      ["one repeated component extra", [...components, firstIdentity]],
      ["one extra valid identity", [...components, "Na+"]],
      ["unknown identity replacing a required unit", ["unknown-ion", ...components.slice(1)]],
      ["blank identity replacing a required unit", ["   ", ...components.slice(1)]],
      ["an alias mixed with canonical identities", aliasMixed],
      ["proportionally scaled coefficients", components.flatMap((identity) => [identity, identity])],
    ];

    for (const [label, candidate] of variants) {
      const result = matchB2R1IonPairReaction({ ...validOptions, components: candidate });
      if (label === "an alias mixed with canonical identities") {
        expectRow(result, expected.rowId);
      } else {
        expect(result.matched, `${expected.rowId}: ${label}`).toBe(false);
      }
    }
  });

  it("accepts every declared ion alias without changing its canonical identity", () => {
    for (const [canonical, alias] of ION_ALIASES) {
      expect(normalizeIonId(alias)).toBe(canonical);
      const expected = EXPECTED_ROWS.find((row) => row.components.some(({ identity }) => identity === canonical));
      if (expected) {
        const components = expandComponents(expected.components);
        const canonicalIndex = components.indexOf(canonical);
        components[canonicalIndex] = alias;
        expectRow(matchB2R1IonPairReaction({
          components,
          medium: "water",
          conditions: expected.conditions,
        }), expected.rowId);
      }
    }
  });

  it("accepts only SO2 as the non-ion input formula", () => {
    const valid = [" SO2 ", "OH-", "OH-"];
    expectRow(matchB2R1IonPairReaction({ components: valid }), "IP-ABSORPTION-SO2-OH");

    for (const identity of ["substance_so2", "so2", "SO₂", "二氧化硫"]) {
      const result = matchB2R1IonPairReaction({ components: [identity, "OH-", "OH-"] });
      expect(result.matched, identity).toBe(false);
    }
  });

  it("defaults omitted or undefined medium and conditions and accepts only water aliases", () => {
    for (const expected of EXPECTED_ROWS) {
      const components = expandComponents(expected.components);
      const defaulted = matchB2R1IonPairReaction({
        components,
        ...(expected.conditions.length > 0 ? { conditions: expected.conditions } : {}),
      });
      expectRow(defaulted, expected.rowId);
      expectRow(matchB2R1IonPairReaction({
        components,
        medium: undefined,
        conditions: expected.conditions.length > 0 ? expected.conditions : undefined,
      }), expected.rowId);

      for (const medium of ["water", "水", "H2O", "H₂O", "  水  "]) {
        expectRow(matchB2R1IonPairReaction({ components, medium, conditions: expected.conditions }), expected.rowId);
      }
    }
  });

  it("requires exactly one heating alias only for the ammonium row", () => {
    const components = ["NH4+", "OH-"];
    for (const condition of ["heating", "加热", "heat", " heating "]) {
      expectRow(matchB2R1IonPairReaction({ components, conditions: [condition] }), "IP-GAS-AMMONIUM-HYDROXIDE-HEAT");
    }
    for (const conditions of [
      undefined,
      [],
      ["heating", "heat"],
      ["heating", "ignition"],
      ["high_temperature"],
      ["unknown"],
      [" "],
      ["heating", "toString"],
    ]) {
      expect(matchB2R1IonPairReaction({ components, conditions }).matched).toBe(false);
    }

    const withoutConditions = EXPECTED_ROWS.filter((row) => row.conditions.length === 0);
    for (const expected of withoutConditions) {
      const inputComponents = expandComponents(expected.components);
      for (const conditions of [["heating"], ["ignition"], ["high_temperature"], ["toString"]]) {
        expect(matchB2R1IonPairReaction({ components: inputComponents, conditions }).matched)
          .toBe(false);
      }
    }
  });

  it("rejects malformed, sparse, non-string and prototype-key component inputs as a whole", () => {
    const valid = ["H+", "OH-"];
    const sparse = new Array(2) as string[];
    sparse[1] = "OH-";
    for (const input of [undefined, null, 1, "not an input object", [], Symbol("input"), () => undefined]) {
      expect(matchUnknown(input).matched, String(input)).toBe(false);
    }
    expect(matchUnknown({}).matched).toBe(false);
    expect(matchUnknown({ medium: "water" }).matched).toBe(false);

    for (const candidate of [
      undefined,
      null,
      1,
      "H+",
      [],
      ["H+", ""],
      ["H+", "  "],
      ["H+", 1],
      ["H+", null],
      sparse,
      ["constructor", "OH-"],
      ["__proto__", "OH-"],
      ["toString", "OH-"],
    ]) {
      const result = matchUnknown({ components: candidate });
      expect(result.matched, String(candidate)).toBe(false);
    }
    expectRow(matchB2R1IonPairReaction({ components: valid }), "IP-NEUTRALIZATION-H-OH");
  });

  it("rejects non-water, blank, unknown, null and non-string media, including prototype keys", () => {
    for (const medium of ["", " ", "dil_hno3", "dil_non_oxidizing_acid", "acid", null, 1, "constructor", "__proto__", "toString"]) {
      expect(matchUnknown({ components: ["H+", "OH-"], medium }).matched, String(medium)).toBe(false);
    }
  });

  it("rejects sparse, non-array, blank, unknown, prototype-key and non-string conditions", () => {
    const sparse = new Array(1) as string[];
    for (const conditions of [
      "heating",
      1,
      [""],
      ["  "],
      ["unknown"],
      ["constructor"],
      ["__proto__"],
      ["toString"],
      [1],
      sparse,
    ]) {
      expect(matchUnknown({ components: ["NH4+", "OH-"], conditions }).matched, String(conditions)).toBe(false);
    }
  });

  it("rejects every extra own key, including legacy fields, non-enumerable keys and symbols", () => {
    const base = { components: ["H+", "OH-"] };
    for (const input of [
      { ...base, unexpected: true },
      { ...base, reactants: ["H+", "OH-"] },
      { ...base, solutionIons: ["H+", "OH-"] },
      Object.defineProperty({ ...base }, "hidden", { value: true }),
      Object.defineProperty({ ...base }, Symbol("extra"), { value: true }),
    ]) {
      expect(matchUnknown(input).matched).toBe(false);
    }
  });

  it("rejects missing, empty, non-array, sparse, duplicate and extra condition combinations", () => {
    const validComponents = ["NH4+", "OH-"];
    const sparse = new Array(1) as string[];
    for (const conditions of [
      undefined,
      [],
      ["heating", "heating"],
      ["heating", "heat"],
      ["heating", "high_temperature"],
      ["heating", "unknown"],
      ["heating", " "],
      ["heating", 1],
      sparse,
    ]) {
      expect(matchUnknown({ components: validComponents, conditions }).matched).toBe(false);
    }
  });

  it("does not mutate frozen input and returns the same frozen row for repeated calls", () => {
    const components = Object.freeze(["OH⁻", "H⁺"]);
    const conditions = Object.freeze([] as string[]);
    const input = Object.freeze({ components, medium: "水", conditions });
    const first = matchB2R1IonPairReaction(input);
    const second = matchB2R1IonPairReaction(input);
    const firstSuccess = expectRow(first, "IP-NEUTRALIZATION-H-OH");
    const secondSuccess = expectRow(second, "IP-NEUTRALIZATION-H-OH");
    expect(secondSuccess).toEqual(firstSuccess);
    expect(secondSuccess.reaction).toBe(firstSuccess.reaction);
    expect(components).toEqual(["OH⁻", "H⁺"]);
    expect(conditions).toEqual([]);
    expect(Object.isFrozen(firstSuccess.reaction)).toBe(true);
  });

  it("keeps no-match results free of candidate rows and success/effect data", () => {
    const result = matchB2R1IonPairReaction({ components: ["NH3", "H+"] });
    expect(result).toEqual({ matched: false, success: false });
    expect(Object.keys(result)).toEqual(["matched", "success"]);
  });

  it("does not extend the whitelist to other handbook examples or formula-inferred products", () => {
    const tableExternals = [
      ["NH3", "H+"], ["Zn2+", "OH-", "OH-"], ["Al3+", "OH-", "OH-", "OH-"],
      ["Ca2+", "SO42-"], ["Ag+", "SO42-", "Ag+", "SO42-"],
      ["Mg2+", "CO32-"], ["Zn2+", "CO32-"],
    ];
    for (const components of tableExternals) {
      expect(matchB2R1IonPairReaction({ components }).matched, components.join("+")).toBe(false);
    }
  });
});
