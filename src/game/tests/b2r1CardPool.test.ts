import { describe, expect, it } from "vitest";
import {
  B2R1_ALL_ION_DEFINITIONS,
  B2R1_ANION_DEFINITIONS,
  B2R1_CATION_DEFINITIONS,
  B2R1_REDOX_REACTION_ROWS,
  B2R1_SALT_CATALOG,
  B2R1_CARD_POOL_CATEGORY_TOTALS,
  B2R1_CARD_POOL_CONDITION_PROVIDERS,
  B2R1_CARD_POOL_DECK_MANIFEST,
  B2R1_CARD_POOL_DEFINITIONS,
  B2R1_CARD_POOL_FORMULA_PROVIDERS,
  B2R1_CARD_POOL_ION_SOURCES,
  B2R1_CARD_POOL_MEDIUM_PROVIDERS,
  B2R1_CARD_POOL_TOTALS,
} from "../data/b2r1";
import { starterDeckSize } from "../data/starterDeck";

const EXPECTED_NON_SALT_DEFINITIONS = [
  { id: "ion_h", nameZh: "氢离子", formula: "H+", displayFormula: "H⁺", count: 10, category: "independent_ion", poolSide: "core", tags: ["ion_component", "acid"] },
  { id: "ion_nh4", nameZh: "铵根离子", formula: "NH4+", displayFormula: "NH₄⁺", count: 6, category: "independent_ion", poolSide: "core", tags: ["ion_component"] },
  { id: "ion_na", nameZh: "钠离子", formula: "Na+", displayFormula: "Na⁺", count: 8, category: "independent_ion", poolSide: "core", tags: ["ion_component"] },
  { id: "ion_k", nameZh: "钾离子", formula: "K+", displayFormula: "K⁺", count: 6, category: "independent_ion", poolSide: "core", tags: ["ion_component"] },
  { id: "ion_ca", nameZh: "钙离子", formula: "Ca2+", displayFormula: "Ca²⁺", count: 6, category: "independent_ion", poolSide: "core", tags: ["ion_component"] },
  { id: "ion_ba", nameZh: "钡离子", formula: "Ba2+", displayFormula: "Ba²⁺", count: 4, category: "independent_ion", poolSide: "core", tags: ["ion_component"] },
  { id: "ion_fe3", nameZh: "铁(III)离子", formula: "Fe3+", displayFormula: "Fe³⁺", count: 6, category: "independent_ion", poolSide: "core", tags: ["ion_component"] },
  { id: "ion_oh", nameZh: "氢氧根离子", formula: "OH-", displayFormula: "OH⁻", count: 12, category: "independent_ion", poolSide: "core", tags: ["ion_component", "base", "alkaline-absorb"] },
  { id: "ion_cl", nameZh: "氯离子", formula: "Cl-", displayFormula: "Cl⁻", count: 10, category: "independent_ion", poolSide: "core", tags: ["ion_component"] },
  { id: "ion_no3", nameZh: "硝酸根离子", formula: "NO3-", displayFormula: "NO₃⁻", count: 8, category: "independent_ion", poolSide: "core", tags: ["ion_component"] },
  { id: "ion_co3", nameZh: "碳酸根离子", formula: "CO32-", displayFormula: "CO₃²⁻", count: 8, category: "independent_ion", poolSide: "core", tags: ["ion_component", "carbonate"] },
  { id: "ion_so4", nameZh: "硫酸根离子", formula: "SO42-", displayFormula: "SO₄²⁻", count: 10, category: "independent_ion", poolSide: "core", tags: ["ion_component"] },
  { id: "ion_f", nameZh: "氟离子", formula: "F-", displayFormula: "F⁻", count: 4, category: "independent_ion", poolSide: "core", tags: ["ion_component", "halogen"] },
  { id: "ion_br", nameZh: "溴离子", formula: "Br-", displayFormula: "Br⁻", count: 6, category: "independent_ion", poolSide: "core", tags: ["ion_component", "halogen"] },
  { id: "ion_i", nameZh: "碘离子", formula: "I-", displayFormula: "I⁻", count: 6, category: "independent_ion", poolSide: "core", tags: ["ion_component", "halogen"] },
  { id: "element_mg", nameZh: "镁", formula: "Mg", displayFormula: "Mg", count: 8, category: "dual_use_metal", poolSide: "core", tags: ["dual_use", "metal", "ion_component"] },
  { id: "element_al", nameZh: "铝", formula: "Al", displayFormula: "Al", count: 7, category: "dual_use_metal", poolSide: "core", tags: ["dual_use", "metal", "ion_component"] },
  { id: "element_zn", nameZh: "锌", formula: "Zn", displayFormula: "Zn", count: 8, category: "dual_use_metal", poolSide: "core", tags: ["dual_use", "metal", "ion_component"] },
  { id: "element_fe", nameZh: "铁", formula: "Fe", displayFormula: "Fe", count: 10, category: "dual_use_metal", poolSide: "core", tags: ["dual_use", "metal", "ion_component"] },
  { id: "element_cu", nameZh: "铜", formula: "Cu", displayFormula: "Cu", count: 10, category: "dual_use_metal", poolSide: "core", tags: ["dual_use", "metal", "ion_component"] },
  { id: "element_ag", nameZh: "银", formula: "Ag", displayFormula: "Ag", count: 7, category: "dual_use_metal", poolSide: "core", tags: ["dual_use", "metal", "ion_component"] },
  { id: "element_o", nameZh: "氧元素组件", formula: "O", displayFormula: "O", count: 8, category: "base_element", poolSide: "core", tags: ["element_component", "nonmetal"] },
  { id: "element_c", nameZh: "碳元素组件", formula: "C", displayFormula: "C", count: 6, category: "base_element", poolSide: "core", tags: ["element_component", "nonmetal"] },
  { id: "element_s", nameZh: "硫元素组件", formula: "S", displayFormula: "S", count: 6, category: "base_element", poolSide: "core", tags: ["element_component", "nonmetal"] },
  { id: "condition_ignition", nameZh: "点燃", formula: "ignition", displayFormula: "点燃", count: 5, category: "condition", poolSide: "core", tags: ["reaction_condition"] },
  { id: "condition_heating", nameZh: "加热", formula: "heating", displayFormula: "加热", count: 6, category: "condition", poolSide: "core", tags: ["reaction_condition"] },
  { id: "condition_catalysis", nameZh: "催化", formula: "catalysis", displayFormula: "催化", count: 3, category: "condition", poolSide: "core", tags: ["reaction_condition"] },
  { id: "condition_high_temperature", nameZh: "高温", formula: "high_temperature", displayFormula: "高温", count: 4, category: "condition", poolSide: "core", tags: ["reaction_condition"] },
  { id: "condition_oxide_film_removed", nameZh: "去氧化膜", formula: "oxide_film_removed", displayFormula: "去氧化膜", count: 3, category: "condition", poolSide: "core", tags: ["reaction_condition"] },
  { id: "substance_f2", nameZh: "氟单质", formula: "F2", displayFormula: "F₂", count: 2, category: "halogen_elemental", poolSide: "other", tags: ["halogen", "special", "high_risk_candidate"] },
  { id: "substance_cl2", nameZh: "氯气", formula: "Cl2", displayFormula: "Cl₂", count: 6, category: "halogen_elemental", poolSide: "other", tags: ["halogen", "harmful-gas"] },
  { id: "substance_br2", nameZh: "溴单质", formula: "Br2", displayFormula: "Br₂", count: 5, category: "halogen_elemental", poolSide: "other", tags: ["halogen"] },
  { id: "substance_i2", nameZh: "碘单质", formula: "I2", displayFormula: "I₂", count: 5, category: "halogen_elemental", poolSide: "other", tags: ["halogen"] },
  { id: "substance_h2", nameZh: "氢气", formula: "H2", displayFormula: "H₂", count: 5, category: "base_molecule_gas", poolSide: "other", tags: ["flammable_gas"] },
  { id: "substance_o2", nameZh: "氧气", formula: "O2", displayFormula: "O₂", count: 6, category: "base_molecule_gas", poolSide: "other", tags: [] },
  { id: "substance_so2", nameZh: "二氧化硫", formula: "SO2", displayFormula: "SO₂", count: 4, category: "base_molecule_gas", poolSide: "other", tags: ["harmful-gas"] },
  { id: "substance_nh3", nameZh: "氨气", formula: "NH3", displayFormula: "NH₃", count: 3, category: "base_molecule_gas", poolSide: "other", tags: [] },
  { id: "substance_h2o", nameZh: "水", formula: "H2O", displayFormula: "H₂O", count: 6, category: "base_molecule_gas", poolSide: "other", tags: ["fire-extinguish"] },
  { id: "substance_co2", nameZh: "二氧化碳", formula: "CO2", displayFormula: "CO₂", count: 5, category: "base_molecule_gas", poolSide: "other", tags: ["fire-extinguish"] },
  { id: "substance_h2o2", nameZh: "过氧化氢", formula: "H2O2", displayFormula: "H₂O₂", count: 4, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent"] },
  { id: "substance_kmno4", nameZh: "高锰酸钾", formula: "KMnO4", displayFormula: "KMnO₄", count: 4, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent"] },
  { id: "substance_na2feo4", nameZh: "高铁酸钠", formula: "Na2FeO4", displayFormula: "Na₂FeO₄", count: 2, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent"] },
  { id: "substance_mno2", nameZh: "二氧化锰", formula: "MnO2", displayFormula: "MnO₂", count: 4, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent", "oxide"] },
  { id: "substance_naclo", nameZh: "次氯酸钠", formula: "NaClO", displayFormula: "NaClO", count: 4, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent"] },
  { id: "substance_cuo", nameZh: "氧化铜", formula: "CuO", displayFormula: "CuO", count: 4, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent", "oxide"] },
  { id: "substance_co", nameZh: "一氧化碳", formula: "CO", displayFormula: "CO", count: 4, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent"] },
  { id: "substance_fe2o3", nameZh: "氧化铁", formula: "Fe2O3", displayFormula: "Fe₂O₃", count: 4, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent", "oxide"] },
  { id: "substance_na2o2", nameZh: "过氧化钠", formula: "Na2O2", displayFormula: "Na₂O₂", count: 3, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent", "oxide"] },
  { id: "substance_kclo3", nameZh: "氯酸钾", formula: "KClO3", displayFormula: "KClO₃", count: 3, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent"] },
  { id: "substance_na2s2o3", nameZh: "硫代硫酸钠", formula: "Na2S2O3", displayFormula: "Na₂S₂O₃", count: 3, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent"] },
  { id: "substance_hcl_dilute", nameZh: "稀盐酸", formula: "HCl", displayFormula: "稀 HCl", count: 3, category: "dilute_acid_base", poolSide: "other", tags: ["acid", "strong-acid", "aqueous", "dilute"] },
  { id: "substance_h2so4_dilute", nameZh: "稀硫酸", formula: "H2SO4", displayFormula: "稀 H₂SO₄", count: 2, category: "dilute_acid_base", poolSide: "other", tags: ["acid", "strong-acid", "aqueous", "dilute"] },
  { id: "substance_hno3_dilute", nameZh: "稀硝酸", formula: "HNO3", displayFormula: "稀 HNO₃", count: 2, category: "dilute_acid_base", poolSide: "other", tags: ["acid", "strong-acid", "aqueous", "dilute"] },
  { id: "substance_naoh_dilute", nameZh: "稀氢氧化钠", formula: "NaOH", displayFormula: "稀 NaOH", count: 3, category: "dilute_acid_base", poolSide: "other", tags: ["base", "strong-alkali", "aqueous", "alkaline-absorb", "dilute"] },
  { id: "substance_koh_dilute", nameZh: "稀氢氧化钾", formula: "KOH", displayFormula: "稀 KOH", count: 2, category: "dilute_acid_base", poolSide: "other", tags: ["base", "strong-alkali", "aqueous", "alkaline-absorb", "dilute"] },
  { id: "substance_caoh2_limewater", nameZh: "石灰水", formula: "Ca(OH)2", displayFormula: "石灰水 Ca(OH)₂", count: 2, category: "dilute_acid_base", poolSide: "other", tags: ["base", "strong-alkali", "aqueous", "alkaline-absorb", "dilute"] },
  { id: "substance_hcl_concentrated", nameZh: "浓盐酸", formula: "HCl", displayFormula: "浓 HCl", count: 2, category: "concentrated_acid", poolSide: "other", tags: ["acid", "strong-acid", "aqueous", "concentrated"] },
  { id: "substance_hno3_concentrated", nameZh: "浓硝酸", formula: "HNO3", displayFormula: "浓 HNO₃", count: 2, category: "concentrated_acid", poolSide: "other", tags: ["acid", "strong-acid", "aqueous", "concentrated"] },
] as const;

const expectedCategoryTotals = [
  { category: "independent_ion", definitions: 15, cards: 110, poolSide: "core" },
  { category: "dual_use_metal", definitions: 6, cards: 50, poolSide: "core" },
  { category: "base_element", definitions: 3, cards: 20, poolSide: "core" },
  { category: "condition", definitions: 5, cards: 21, poolSide: "core" },
  { category: "halogen_elemental", definitions: 4, cards: 18, poolSide: "other" },
  { category: "base_molecule_gas", definitions: 6, cards: 29, poolSide: "other" },
  { category: "named_reagent_oxide", definitions: 11, cards: 39, poolSide: "other" },
  { category: "dilute_acid_base", definitions: 6, cards: 14, poolSide: "other" },
  { category: "concentrated_acid", definitions: 2, cards: 4, poolSide: "other" },
  { category: "salt", definitions: 39, cards: 39, poolSide: "other" },
] as const;

const expectedIonSources = {
  "H+": ["ion_h", "independent_ion", 1],
  "NH4+": ["ion_nh4", "independent_ion", 1],
  "Na+": ["ion_na", "independent_ion", 1],
  "K+": ["ion_k", "independent_ion", 1],
  "Ca2+": ["ion_ca", "independent_ion", 1],
  "Mg2+": ["element_mg", "metal_ion_component", 1],
  "Ba2+": ["ion_ba", "independent_ion", 1],
  "Al3+": ["element_al", "metal_ion_component", 1],
  "Fe2+": ["element_fe", "metal_ion_component", 1],
  "Fe3+": ["ion_fe3", "independent_ion", 1],
  "Zn2+": ["element_zn", "metal_ion_component", 1],
  "Cu2+": ["element_cu", "metal_ion_component", 1],
  "Ag+": ["element_ag", "metal_ion_component", 1],
  "OH-": ["ion_oh", "independent_ion", 1],
  "Cl-": ["ion_cl", "independent_ion", 1],
  "NO3-": ["ion_no3", "independent_ion", 1],
  "CO32-": ["ion_co3", "independent_ion", 1],
  "SO42-": ["ion_so4", "independent_ion", 1],
  "F-": ["ion_f", "independent_ion", 1],
  "Br-": ["ion_br", "independent_ion", 1],
  "I-": ["ion_i", "independent_ion", 1],
} as const;

const toProviderRecord = <K extends string, T extends { readonly definitionIds: readonly string[] }>(
  providers: readonly T[],
  getKey: (provider: T) => K
) => Object.fromEntries(providers.map((provider) => [getKey(provider), provider.definitionIds]));

function expectDeepFrozen(value: unknown): void {
  if (Array.isArray(value)) {
    expect(Object.isFrozen(value)).toBe(true);
    for (const item of value) expectDeepFrozen(item);
    return;
  }
  if (typeof value === "object" && value !== null) {
    expect(Object.isFrozen(value)).toBe(true);
    for (const key of Reflect.ownKeys(value)) expectDeepFrozen(Reflect.get(value, key));
  }
}

describe("Phase 22 B2-R1 普通实体卡池静态数据", () => {
  it("97 个 definitions 与 §2 的每个非盐 ID、字段、分类和 tags 完全一致", () => {
    const nonSaltDefinitions = B2R1_CARD_POOL_DEFINITIONS
      .filter(({ category }) => category !== "salt")
      .map(({ id, nameZh, formula, displayFormula, count, category, poolSide, tags }) => ({
        id, nameZh, formula, displayFormula, count, category, poolSide, tags,
      }));

    expect(nonSaltDefinitions).toEqual(EXPECTED_NON_SALT_DEFINITIONS);
    expect(B2R1_CARD_POOL_DEFINITIONS).toHaveLength(97);
    const ids = B2R1_CARD_POOL_DEFINITIONS.map(({ id }) => id);
    expect(new Set(ids).size).toBe(97);
    expect(B2R1_CARD_POOL_DEFINITIONS.every(({ count }) => Number.isInteger(count) && count > 0)).toBe(true);
    expect(ids).not.toContain("ion_mg");
    expect(ids).not.toContain("ion_al");
    expect(ids).not.toContain("ion_fe2");
    expect(ids).not.toContain("ion_zn");
    expect(ids).not.toContain("ion_cu");
    expect(ids).not.toContain("ion_ag");
    expect(ids).not.toContain("event_lab_fire");
    expect(ids).not.toContain("substance_h2so4_concentrated");
    expect(B2R1_CARD_POOL_DEFINITIONS.some(({ formula }) => formula === "Fe2(SO4)3")).toBe(false);
  });

  it("派生的 deck manifest 与统计严格为 344、97、core 201、other 143", () => {
    expect(B2R1_CARD_POOL_DECK_MANIFEST).toHaveLength(97);
    expect(new Set(B2R1_CARD_POOL_DECK_MANIFEST.map(({ definitionId }) => definitionId)).size).toBe(97);
    expect(B2R1_CARD_POOL_DECK_MANIFEST.every(({ count }) => Number.isInteger(count) && count > 0)).toBe(true);
    expect(B2R1_CARD_POOL_DECK_MANIFEST.map(({ definitionId, count }) => ({ definitionId, count })))
      .toEqual(B2R1_CARD_POOL_DEFINITIONS.map(({ id, count }) => ({ definitionId: id, count })));
    expect(B2R1_CARD_POOL_TOTALS).toEqual({
      definitions: 97,
      cards: 344,
      coreCards: 201,
      otherCards: 143,
    });
    expect(B2R1_CARD_POOL_TOTALS.coreCards).toBeGreaterThan(B2R1_CARD_POOL_TOTALS.otherCards);
    expect(B2R1_CARD_POOL_CATEGORY_TOTALS.map(({ category, definitions, cards, poolSide }) => ({
      category, definitions, cards, poolSide,
    }))).toEqual(expectedCategoryTotals);
    expect(B2R1_CARD_POOL_DECK_MANIFEST.filter(({ definitionId }) => definitionId.startsWith("substance_")))
      .toHaveLength(68);
  });

  it("六种双用途金属恰好只有 elemental 与 ion_component 两个互斥模式", () => {
    const metals = B2R1_CARD_POOL_DEFINITIONS.filter(({ category }) => category === "dual_use_metal");
    expect(metals).toHaveLength(6);
    expect(metals.map(({ id, modes, modeSelection }) => ({ id, modes, modeSelection }))).toEqual([
      { id: "element_mg", modes: [{ mode: "elemental", element: "Mg" }, { mode: "ion_component", ionId: "Mg2+" }], modeSelection: "exclusive" },
      { id: "element_al", modes: [{ mode: "elemental", element: "Al" }, { mode: "ion_component", ionId: "Al3+" }], modeSelection: "exclusive" },
      { id: "element_zn", modes: [{ mode: "elemental", element: "Zn" }, { mode: "ion_component", ionId: "Zn2+" }], modeSelection: "exclusive" },
      { id: "element_fe", modes: [{ mode: "elemental", element: "Fe" }, { mode: "ion_component", ionId: "Fe2+" }], modeSelection: "exclusive" },
      { id: "element_cu", modes: [{ mode: "elemental", element: "Cu" }, { mode: "ion_component", ionId: "Cu2+" }], modeSelection: "exclusive" },
      { id: "element_ag", modes: [{ mode: "elemental", element: "Ag" }, { mode: "ion_component", ionId: "Ag+" }], modeSelection: "exclusive" },
    ]);
    expect(metals.map(({ modes }) => modes?.[1].ionId)).not.toContain("Fe3+");
    expect(B2R1_CARD_POOL_DEFINITIONS.filter(({ category }) => category === "base_element")
      .map(({ id, elementProvided, elementUnitsPerCard }) => [id, elementProvided, elementUnitsPerCard]))
      .toEqual([["element_o", "O", 1], ["element_c", "C", 1], ["element_s", "S", 1]]);
  });

  it("21 个规范离子各有且只有一个实体来源，且均为每张一单位", () => {
    expect(B2R1_CARD_POOL_ION_SOURCES).toHaveLength(21);
    expect(new Set(B2R1_CARD_POOL_ION_SOURCES.map(({ ionId }) => ionId)).size).toBe(21);
    expect(B2R1_CARD_POOL_ION_SOURCES.map(({ ionId }) => ionId).sort()).toEqual(
      [...B2R1_CATION_DEFINITIONS, ...B2R1_ANION_DEFINITIONS].map(({ id }) => id).sort()
    );
    expect(Object.fromEntries(B2R1_CARD_POOL_ION_SOURCES.map(({ ionId, definitionId, sourceKind, unitsPerCard }) => [
      ionId, [definitionId, sourceKind, unitsPerCard],
    ]))).toEqual(expectedIonSources);
    expect(B2R1_CATION_DEFINITIONS).toHaveLength(13);
    expect(B2R1_ANION_DEFINITIONS).toHaveLength(8);
    expect(B2R1_ALL_ION_DEFINITIONS).toHaveLength(21);
    expect(B2R1_SALT_CATALOG).toHaveLength(39);
    expect(B2R1_REDOX_REACTION_ROWS).toHaveLength(49);
    expect(starterDeckSize).toBe(68);
  });

  it("conditions 与 reaction rows 的 provider 能力精确覆盖五类条件及独立 MnO2 催化来源", () => {
    expect(toProviderRecord(B2R1_CARD_POOL_CONDITION_PROVIDERS, ({ condition }) => condition)).toEqual({
      ignition: ["condition_ignition"],
      heating: ["condition_heating"],
      catalysis: ["condition_catalysis"],
      high_temperature: ["condition_high_temperature"],
      oxide_film_removed: ["condition_oxide_film_removed"],
      mno2_catalysis: ["substance_mno2"],
    });
    const conditionCards = B2R1_CARD_POOL_DEFINITIONS.filter(({ category }) => category === "condition");
    expect(conditionCards.map(({ id, conditionProvided }) => [id, conditionProvided])).toEqual([
      ["condition_ignition", "ignition"],
      ["condition_heating", "heating"],
      ["condition_catalysis", "catalysis"],
      ["condition_high_temperature", "high_temperature"],
      ["condition_oxide_film_removed", "oxide_film_removed"],
    ]);
    expect(B2R1_CARD_POOL_DEFINITIONS.filter(({ conditionProvided }) => conditionProvided === "mno2_catalysis")
      .map(({ id, category, conditionRowIds }) => [id, category, conditionRowIds]))
      .toEqual([["substance_mno2", "named_reagent_oxide", ["OR-KClO3-MnO2"]]]);
    expect(B2R1_CARD_POOL_DEFINITIONS.some(({ id }) => id === "condition_mno2_catalysis")).toBe(false);
    const conditionProviders = new Map(B2R1_CARD_POOL_CONDITION_PROVIDERS.map(({ condition, definitionIds }) => [condition, definitionIds]));
    for (const row of B2R1_REDOX_REACTION_ROWS) {
      for (const condition of row.conditions ?? []) {
        expect(conditionProviders.get(condition)?.length, `${row.id}: ${condition}`).toBeGreaterThan(0);
      }
    }
  });

  it("介质 provider 精确关联冻结的五种介质和预印卡", () => {
    expect(toProviderRecord(B2R1_CARD_POOL_MEDIUM_PROVIDERS, ({ medium }) => medium)).toEqual({
      conc_hcl: ["substance_hcl_concentrated"],
      dil_hno3: ["substance_hno3_dilute"],
      conc_hno3: ["substance_hno3_concentrated"],
      dil_non_oxidizing_acid: ["substance_hcl_dilute", "substance_h2so4_dilute"],
      water: ["substance_h2o"],
    });
    const mediumProviders = new Map(B2R1_CARD_POOL_MEDIUM_PROVIDERS.map(({ medium, definitionIds }) => [medium, definitionIds]));
    for (const row of B2R1_REDOX_REACTION_ROWS) {
      if (row.medium !== undefined) {
        expect(mediumProviders.get(row.medium)?.length, `${row.id}: ${row.medium}`).toBeGreaterThan(0);
      }
    }
  });

  it("49 条 redox row 的每个物种、溶液离子、介质和条件均有静态实体来源", () => {
    const definitionsById = new Map(B2R1_CARD_POOL_DEFINITIONS.map((definition) => [definition.id, definition]));
    const formulaProviders = new Map(B2R1_CARD_POOL_FORMULA_PROVIDERS.map(({ formula, definitionIds }) => [formula, definitionIds]));
    const ionSources = new Map(B2R1_CARD_POOL_ION_SOURCES.map(({ ionId, definitionId }) => [ionId, definitionId]));
    const mediumProviders = new Map(B2R1_CARD_POOL_MEDIUM_PROVIDERS.map(({ medium, definitionIds }) => [medium, definitionIds]));
    const conditionProviders = new Map(B2R1_CARD_POOL_CONDITION_PROVIDERS.map(({ condition, definitionIds }) => [condition, definitionIds]));

    expect(B2R1_REDOX_REACTION_ROWS).toHaveLength(49);
    for (const row of B2R1_REDOX_REACTION_ROWS) {
      for (const reactant of row.reactants) {
        const providerIds = formulaProviders.get(reactant);
        expect(providerIds?.length, `${row.id}: reactant ${reactant}`).toBeGreaterThan(0);
        for (const providerId of providerIds ?? []) {
          expect(definitionsById.get(providerId)?.formula).toBe(reactant);
        }
        if (["Mg", "Al", "Zn", "Fe", "Cu", "Ag"].includes(reactant)) {
          expect(providerIds?.some((providerId) => definitionsById.get(providerId)?.modes?.some(
            (mode) => mode.mode === "elemental" && mode.element === reactant
          ))).toBe(true);
        }
      }
      const solutionIons = row.solutionIons ?? (row.solutionIon === undefined ? [] : [row.solutionIon]);
      for (const solutionIon of solutionIons) {
        expect(ionSources.has(solutionIon), `${row.id}: solution ion ${solutionIon}`).toBe(true);
      }
      if (row.solutionIon !== undefined) expect(ionSources.has(row.solutionIon)).toBe(true);
      if (row.medium !== undefined) expect(mediumProviders.get(row.medium)?.length).toBeGreaterThan(0);
      for (const condition of row.conditions ?? []) {
        expect(conditionProviders.get(condition)?.length, `${row.id}: ${condition}`).toBeGreaterThan(0);
      }
    }
    expect(formulaProviders.has("MnO4-")).toBe(false);
    expect(formulaProviders.has("S2O3^2-")).toBe(false);
  });

  it("39 个预印盐的字段和严格 DIY signature 完全派生自 B2R1_SALT_CATALOG", () => {
    const saltDefinitions = B2R1_CARD_POOL_DEFINITIONS.filter(({ category }) => category === "salt");
    expect(saltDefinitions).toHaveLength(39);
    expect(saltDefinitions.map(({ id, formula, displayFormula, nameZh, cation, anion, cationCount, anionCount, solubility, isPrecipitate, tags, count, diyInputSignature }) => ({
      id, formula, displayFormula, nameZh, cation, anion, cationCount, anionCount, solubility,
      isPrecipitate, tags, count, diyInputSignature,
    }))).toEqual(B2R1_SALT_CATALOG.map((salt) => ({
      id: salt.id,
      formula: salt.formula,
      displayFormula: salt.displayFormula,
      nameZh: salt.nameZh,
      cation: salt.cation,
      anion: salt.anion,
      cationCount: salt.cationCount,
      anionCount: salt.anionCount,
      solubility: salt.solubility,
      isPrecipitate: salt.isPrecipitate,
      tags: salt.tags,
      count: 1,
      diyInputSignature: [
        { ionId: salt.cation, count: salt.cationCount },
        { ionId: salt.anion, count: salt.anionCount },
      ],
    })));
    expect({
      chloride: saltDefinitions.filter(({ tags }) => tags.includes("chloride")).length,
      sulfate: saltDefinitions.filter(({ tags }) => tags.includes("sulfate")).length,
      carbonate: saltDefinitions.filter(({ tags }) => tags.includes("carbonate")).length,
      nitrate: saltDefinitions.filter(({ tags }) => tags.includes("nitrate")).length,
    }).toEqual({ chloride: 12, sulfate: 10, carbonate: 7, nitrate: 10 });
    for (const [id, signature] of [
      ["substance_feso4", [{ ionId: "Fe2+", count: 1 }, { ionId: "SO42-", count: 1 }]],
      ["substance_al2_so4_3", [{ ionId: "Al3+", count: 2 }, { ionId: "SO42-", count: 3 }]],
      ["substance_na2so4", [{ ionId: "Na+", count: 2 }, { ionId: "SO42-", count: 1 }]],
      ["substance_cacl2", [{ ionId: "Ca2+", count: 1 }, { ionId: "Cl-", count: 2 }]],
      ["substance_ag2so4", [{ ionId: "Ag+", count: 2 }, { ionId: "SO42-", count: 1 }]],
    ] as const) {
      expect(saltDefinitions.find((salt) => salt.id === id)?.diyInputSignature).toEqual(signature);
    }
    expect(saltDefinitions.some(({ formula }) => formula === "Fe2(SO4)3")).toBe(false);
    expect(saltDefinitions.every(({ count }) => count === 1)).toBe(true);
  });

  it("六种稀酸碱有 identity composition 与精确 DIY 签名，浓酸仅有 composition/medium", () => {
    const diluteDefinitions = B2R1_CARD_POOL_DEFINITIONS.filter(({ category }) => category === "dilute_acid_base");
    expect(diluteDefinitions.map(({ id, formula, displayFormula, nameZh, ionComposition, diyInputSignature, mediumProvided }) => ({
      id, formula, displayFormula, nameZh, ionComposition, diyInputSignature, mediumProvided,
    }))).toEqual([
      { id: "substance_hcl_dilute", formula: "HCl", displayFormula: "稀 HCl", nameZh: "稀盐酸", ionComposition: [{ ionId: "H+", count: 1 }, { ionId: "Cl-", count: 1 }], diyInputSignature: [{ ionId: "H+", count: 1 }, { ionId: "Cl-", count: 1 }], mediumProvided: "dil_non_oxidizing_acid" },
      { id: "substance_h2so4_dilute", formula: "H2SO4", displayFormula: "稀 H₂SO₄", nameZh: "稀硫酸", ionComposition: [{ ionId: "H+", count: 2 }, { ionId: "SO42-", count: 1 }], diyInputSignature: [{ ionId: "H+", count: 2 }, { ionId: "SO42-", count: 1 }], mediumProvided: "dil_non_oxidizing_acid" },
      { id: "substance_hno3_dilute", formula: "HNO3", displayFormula: "稀 HNO₃", nameZh: "稀硝酸", ionComposition: [{ ionId: "H+", count: 1 }, { ionId: "NO3-", count: 1 }], diyInputSignature: [{ ionId: "H+", count: 1 }, { ionId: "NO3-", count: 1 }], mediumProvided: "dil_hno3" },
      { id: "substance_naoh_dilute", formula: "NaOH", displayFormula: "稀 NaOH", nameZh: "稀氢氧化钠", ionComposition: [{ ionId: "Na+", count: 1 }, { ionId: "OH-", count: 1 }], diyInputSignature: [{ ionId: "Na+", count: 1 }, { ionId: "OH-", count: 1 }], mediumProvided: undefined },
      { id: "substance_koh_dilute", formula: "KOH", displayFormula: "稀 KOH", nameZh: "稀氢氧化钾", ionComposition: [{ ionId: "K+", count: 1 }, { ionId: "OH-", count: 1 }], diyInputSignature: [{ ionId: "K+", count: 1 }, { ionId: "OH-", count: 1 }], mediumProvided: undefined },
      { id: "substance_caoh2_limewater", formula: "Ca(OH)2", displayFormula: "石灰水 Ca(OH)₂", nameZh: "石灰水", ionComposition: [{ ionId: "Ca2+", count: 1 }, { ionId: "OH-", count: 2 }], diyInputSignature: [{ ionId: "Ca2+", count: 1 }, { ionId: "OH-", count: 2 }], mediumProvided: undefined },
    ]);
    for (const definition of diluteDefinitions) {
      expect(definition.diyInputSignature).toBe(definition.ionComposition);
    }

    const concentratedDefinitions = B2R1_CARD_POOL_DEFINITIONS.filter(({ category }) => category === "concentrated_acid");
    expect(concentratedDefinitions.map(({ id, formula, displayFormula, nameZh, ionComposition, diyInputSignature, mediumProvided }) => ({
      id, formula, displayFormula, nameZh, ionComposition, diyInputSignature, mediumProvided,
    }))).toEqual([
      { id: "substance_hcl_concentrated", formula: "HCl", displayFormula: "浓 HCl", nameZh: "浓盐酸", ionComposition: [{ ionId: "H+", count: 1 }, { ionId: "Cl-", count: 1 }], diyInputSignature: undefined, mediumProvided: "conc_hcl" },
      { id: "substance_hno3_concentrated", formula: "HNO3", displayFormula: "浓 HNO₃", nameZh: "浓硝酸", ionComposition: [{ ionId: "H+", count: 1 }, { ionId: "NO3-", count: 1 }], diyInputSignature: undefined, mediumProvided: "conc_hno3" },
    ]);
    expect(concentratedDefinitions.every(({ diyInputSignature }) => diyInputSignature === undefined)).toBe(true);
    expect(concentratedDefinitions.some(({ formula }) => formula === "H2SO4")).toBe(false);
  });

  it("卤素单质保持物质身份，不能提供相应阴离子；gas/reagent tags 无效果扩展", () => {
    expect(B2R1_CARD_POOL_DEFINITIONS.filter(({ category }) => category === "halogen_elemental")
      .map(({ id, formula, tags, ionProvided, modes }) => ({ id, formula, tags, ionProvided, modes })))
      .toEqual([
        { id: "substance_f2", formula: "F2", tags: ["halogen", "special", "high_risk_candidate"], ionProvided: undefined, modes: undefined },
        { id: "substance_cl2", formula: "Cl2", tags: ["halogen", "harmful-gas"], ionProvided: undefined, modes: undefined },
        { id: "substance_br2", formula: "Br2", tags: ["halogen"], ionProvided: undefined, modes: undefined },
        { id: "substance_i2", formula: "I2", tags: ["halogen"], ionProvided: undefined, modes: undefined },
      ]);
    expect(B2R1_CARD_POOL_DEFINITIONS.find(({ id }) => id === "substance_mno2")?.conditionProvided).toBe("mno2_catalysis");
    expect(B2R1_CARD_POOL_DEFINITIONS.find(({ id }) => id === "substance_h2")?.tags).toEqual(["flammable_gas"]);
    expect(B2R1_CARD_POOL_DEFINITIONS.find(({ id }) => id === "substance_cl2")?.tags).toContain("harmful-gas");
    expect(B2R1_CARD_POOL_DEFINITIONS.find(({ id }) => id === "substance_so2")?.tags).toContain("harmful-gas");
  });

  it("所有公开静态定义与嵌套数据深层冻结，Reflect.set 无法改动", () => {
    const publicData: readonly unknown[] = [
      B2R1_CARD_POOL_DEFINITIONS,
      B2R1_CARD_POOL_DECK_MANIFEST,
      B2R1_CARD_POOL_CATEGORY_TOTALS,
      B2R1_CARD_POOL_FORMULA_PROVIDERS,
      B2R1_CARD_POOL_ION_SOURCES,
      B2R1_CARD_POOL_MEDIUM_PROVIDERS,
      B2R1_CARD_POOL_CONDITION_PROVIDERS,
      B2R1_CARD_POOL_TOTALS,
    ];
    for (const value of publicData) expectDeepFrozen(value);

    const definition = B2R1_CARD_POOL_DEFINITIONS.find(({ id }) => id === "element_fe");
    const deckEntry = B2R1_CARD_POOL_DECK_MANIFEST[0];
    const salt = B2R1_CARD_POOL_DEFINITIONS.find(({ id }) => id === "substance_al2_so4_3");
    const mno2 = B2R1_CARD_POOL_DEFINITIONS.find(({ id }) => id === "substance_mno2");
    const ionSource = B2R1_CARD_POOL_ION_SOURCES.find(({ ionId }) => ionId === "Fe2+");
    const provider = B2R1_CARD_POOL_MEDIUM_PROVIDERS.find(({ medium }) => medium === "dil_non_oxidizing_acid");
    expect(definition).toBeDefined();
    expect(deckEntry).toBeDefined();
    expect(salt).toBeDefined();
    expect(mno2).toBeDefined();
    expect(ionSource).toBeDefined();
    expect(provider).toBeDefined();
    if (definition && deckEntry && salt && mno2 && ionSource && provider) {
      expect(Reflect.set(definition, "count", 1)).toBe(false);
      expect(Reflect.set(deckEntry, "count", 1)).toBe(false);
      expect(Reflect.set(B2R1_CARD_POOL_DECK_MANIFEST, "0", { definitionId: "changed", count: 1 })).toBe(false);
      expect(Reflect.set(definition.modes?.[0] ?? {}, "element", "Ag")).toBe(false);
      expect(Reflect.set(definition.tags, "0", "mutated")).toBe(false);
      expect(Reflect.set(salt.diyInputSignature?.[0] ?? {}, "count", 1)).toBe(false);
      expect(Reflect.set(ionSource, "definitionId", "ion_fe2")).toBe(false);
      expect(Reflect.set(provider.definitionIds, "0", "substance_hcl_concentrated")).toBe(false);
      expect(Reflect.set(mno2.conditionRowIds ?? [], "0", "OR-MnO2-HCl-conc")).toBe(false);
      expect(definition.count).toBe(10);
      expect(deckEntry).toEqual({ definitionId: "ion_h", count: 10 });
      expect(B2R1_CARD_POOL_DECK_MANIFEST[0]).toBe(deckEntry);
      expect(definition.tags).toEqual(["dual_use", "metal", "ion_component"]);
      expect(salt.diyInputSignature).toEqual([
        { ionId: "Al3+", count: 2 },
        { ionId: "SO42-", count: 3 },
      ]);
      expect(ionSource.definitionId).toBe("element_fe");
      expect(provider.definitionIds).toEqual(["substance_hcl_dilute", "substance_h2so4_dilute"]);
      expect(mno2.conditionRowIds).toEqual(["OR-KClO3-MnO2"]);
    }
  });
});
