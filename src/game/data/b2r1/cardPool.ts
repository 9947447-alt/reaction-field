import { B2R1_SALT_CATALOG } from "./salts";
import type {
  B2R1CardPoolCategory,
  B2R1CardPoolCategoryTotal,
  B2R1CardPoolConditionProvider,
  B2R1CardPoolDefinition,
  B2R1CardPoolDeckManifestEntry,
  B2R1CardPoolFormulaProvider,
  B2R1CardPoolIonQuantity,
  B2R1CardPoolIonSource,
  B2R1CardPoolMediumProvider,
  B2R1CardPoolTag,
  B2R1CardPoolTotals,
  B2R1MediumId,
  B2R1ReactionCondition,
  B2R1IonId,
} from "./types";

const CARD_POOL_TAGS: readonly B2R1CardPoolTag[] = Object.freeze([
  "ion_component", "acid", "base", "alkaline-absorb", "carbonate", "halogen", "dual_use", "metal",
  "element_component", "nonmetal", "reaction_condition", "special", "high_risk_candidate", "harmful-gas",
  "flammable_gas", "fire-extinguish", "reagent", "oxide", "strong-acid", "aqueous", "dilute",
  "strong-alkali", "concentrated", "salt", "chloride", "precipitate", "sulfate", "slightly_soluble", "nitrate",
]);

function cardPoolTag(tag: string): B2R1CardPoolTag {
  const knownTag = CARD_POOL_TAGS.find((candidate) => candidate === tag);
  if (knownTag === undefined) throw new Error(`Unknown B2-R1 card-pool tag: ${tag}`);
  return knownTag;
}

function freezeDefinition(definition: B2R1CardPoolDefinition): B2R1CardPoolDefinition {
  Object.freeze(definition.tags);
  if (definition.modes !== undefined) {
    for (const mode of definition.modes) Object.freeze(mode);
    Object.freeze(definition.modes);
  }
  if (definition.ionComposition !== undefined) {
    for (const quantity of definition.ionComposition) Object.freeze(quantity);
    Object.freeze(definition.ionComposition);
  }
  if (definition.diyInputSignature !== undefined) {
    for (const quantity of definition.diyInputSignature) Object.freeze(quantity);
    Object.freeze(definition.diyInputSignature);
  }
  if (definition.conditionRowIds !== undefined) Object.freeze(definition.conditionRowIds);
  return Object.freeze(definition);
}

function ionQuantities(entries: readonly (readonly [B2R1IonId, number])[]): readonly B2R1CardPoolIonQuantity[] {
  return Object.freeze(entries.map(([ionId, count]) => Object.freeze({ ionId, count })));
}

function diluteAcidBase(
  definition: Omit<B2R1CardPoolDefinition, "diyInputSignature"> & {
    readonly category: "dilute_acid_base";
    readonly ionComposition: readonly B2R1CardPoolIonQuantity[];
  }
): B2R1CardPoolDefinition {
  return freezeDefinition({ ...definition, diyInputSignature: definition.ionComposition });
}

const independentIons: readonly B2R1CardPoolDefinition[] = Object.freeze([
  freezeDefinition({ id: "ion_h", nameZh: "氢离子", formula: "H+", displayFormula: "H⁺", count: 10, category: "independent_ion", poolSide: "core", tags: ["ion_component", "acid"], ionProvided: "H+" }),
  freezeDefinition({ id: "ion_nh4", nameZh: "铵根离子", formula: "NH4+", displayFormula: "NH₄⁺", count: 6, category: "independent_ion", poolSide: "core", tags: ["ion_component"], ionProvided: "NH4+" }),
  freezeDefinition({ id: "ion_na", nameZh: "钠离子", formula: "Na+", displayFormula: "Na⁺", count: 8, category: "independent_ion", poolSide: "core", tags: ["ion_component"], ionProvided: "Na+" }),
  freezeDefinition({ id: "ion_k", nameZh: "钾离子", formula: "K+", displayFormula: "K⁺", count: 6, category: "independent_ion", poolSide: "core", tags: ["ion_component"], ionProvided: "K+" }),
  freezeDefinition({ id: "ion_ca", nameZh: "钙离子", formula: "Ca2+", displayFormula: "Ca²⁺", count: 6, category: "independent_ion", poolSide: "core", tags: ["ion_component"], ionProvided: "Ca2+" }),
  freezeDefinition({ id: "ion_ba", nameZh: "钡离子", formula: "Ba2+", displayFormula: "Ba²⁺", count: 4, category: "independent_ion", poolSide: "core", tags: ["ion_component"], ionProvided: "Ba2+" }),
  freezeDefinition({ id: "ion_fe3", nameZh: "铁(III)离子", formula: "Fe3+", displayFormula: "Fe³⁺", count: 6, category: "independent_ion", poolSide: "core", tags: ["ion_component"], ionProvided: "Fe3+" }),
  freezeDefinition({ id: "ion_oh", nameZh: "氢氧根离子", formula: "OH-", displayFormula: "OH⁻", count: 12, category: "independent_ion", poolSide: "core", tags: ["ion_component", "base", "alkaline-absorb"], ionProvided: "OH-" }),
  freezeDefinition({ id: "ion_cl", nameZh: "氯离子", formula: "Cl-", displayFormula: "Cl⁻", count: 10, category: "independent_ion", poolSide: "core", tags: ["ion_component"], ionProvided: "Cl-" }),
  freezeDefinition({ id: "ion_no3", nameZh: "硝酸根离子", formula: "NO3-", displayFormula: "NO₃⁻", count: 8, category: "independent_ion", poolSide: "core", tags: ["ion_component"], ionProvided: "NO3-" }),
  freezeDefinition({ id: "ion_co3", nameZh: "碳酸根离子", formula: "CO32-", displayFormula: "CO₃²⁻", count: 8, category: "independent_ion", poolSide: "core", tags: ["ion_component", "carbonate"], ionProvided: "CO32-" }),
  freezeDefinition({ id: "ion_so4", nameZh: "硫酸根离子", formula: "SO42-", displayFormula: "SO₄²⁻", count: 10, category: "independent_ion", poolSide: "core", tags: ["ion_component"], ionProvided: "SO42-" }),
  freezeDefinition({ id: "ion_f", nameZh: "氟离子", formula: "F-", displayFormula: "F⁻", count: 4, category: "independent_ion", poolSide: "core", tags: ["ion_component", "halogen"], ionProvided: "F-" }),
  freezeDefinition({ id: "ion_br", nameZh: "溴离子", formula: "Br-", displayFormula: "Br⁻", count: 6, category: "independent_ion", poolSide: "core", tags: ["ion_component", "halogen"], ionProvided: "Br-" }),
  freezeDefinition({ id: "ion_i", nameZh: "碘离子", formula: "I-", displayFormula: "I⁻", count: 6, category: "independent_ion", poolSide: "core", tags: ["ion_component", "halogen"], ionProvided: "I-" }),
]);

const dualUseMetals: readonly B2R1CardPoolDefinition[] = Object.freeze([
  freezeDefinition({ id: "element_mg", nameZh: "镁", formula: "Mg", displayFormula: "Mg", count: 8, category: "dual_use_metal", poolSide: "core", tags: ["dual_use", "metal", "ion_component"], modeSelection: "exclusive", modes: [{ mode: "elemental", element: "Mg" }, { mode: "ion_component", ionId: "Mg2+" }] }),
  freezeDefinition({ id: "element_al", nameZh: "铝", formula: "Al", displayFormula: "Al", count: 7, category: "dual_use_metal", poolSide: "core", tags: ["dual_use", "metal", "ion_component"], modeSelection: "exclusive", modes: [{ mode: "elemental", element: "Al" }, { mode: "ion_component", ionId: "Al3+" }] }),
  freezeDefinition({ id: "element_zn", nameZh: "锌", formula: "Zn", displayFormula: "Zn", count: 8, category: "dual_use_metal", poolSide: "core", tags: ["dual_use", "metal", "ion_component"], modeSelection: "exclusive", modes: [{ mode: "elemental", element: "Zn" }, { mode: "ion_component", ionId: "Zn2+" }] }),
  freezeDefinition({ id: "element_fe", nameZh: "铁", formula: "Fe", displayFormula: "Fe", count: 10, category: "dual_use_metal", poolSide: "core", tags: ["dual_use", "metal", "ion_component"], modeSelection: "exclusive", modes: [{ mode: "elemental", element: "Fe" }, { mode: "ion_component", ionId: "Fe2+" }] }),
  freezeDefinition({ id: "element_cu", nameZh: "铜", formula: "Cu", displayFormula: "Cu", count: 10, category: "dual_use_metal", poolSide: "core", tags: ["dual_use", "metal", "ion_component"], modeSelection: "exclusive", modes: [{ mode: "elemental", element: "Cu" }, { mode: "ion_component", ionId: "Cu2+" }] }),
  freezeDefinition({ id: "element_ag", nameZh: "银", formula: "Ag", displayFormula: "Ag", count: 7, category: "dual_use_metal", poolSide: "core", tags: ["dual_use", "metal", "ion_component"], modeSelection: "exclusive", modes: [{ mode: "elemental", element: "Ag" }, { mode: "ion_component", ionId: "Ag+" }] }),
]);

const baseElements: readonly B2R1CardPoolDefinition[] = Object.freeze([
  freezeDefinition({ id: "element_o", nameZh: "氧元素组件", formula: "O", displayFormula: "O", count: 8, category: "base_element", poolSide: "core", tags: ["element_component", "nonmetal"], elementProvided: "O", elementUnitsPerCard: 1 }),
  freezeDefinition({ id: "element_c", nameZh: "碳元素组件", formula: "C", displayFormula: "C", count: 6, category: "base_element", poolSide: "core", tags: ["element_component", "nonmetal"], elementProvided: "C", elementUnitsPerCard: 1 }),
  freezeDefinition({ id: "element_s", nameZh: "硫元素组件", formula: "S", displayFormula: "S", count: 6, category: "base_element", poolSide: "core", tags: ["element_component", "nonmetal"], elementProvided: "S", elementUnitsPerCard: 1 }),
]);

const conditionCards: readonly B2R1CardPoolDefinition[] = Object.freeze([
  freezeDefinition({ id: "condition_ignition", nameZh: "点燃", formula: "ignition", displayFormula: "点燃", count: 5, category: "condition", poolSide: "core", tags: ["reaction_condition"], conditionProvided: "ignition" }),
  freezeDefinition({ id: "condition_heating", nameZh: "加热", formula: "heating", displayFormula: "加热", count: 6, category: "condition", poolSide: "core", tags: ["reaction_condition"], conditionProvided: "heating" }),
  freezeDefinition({ id: "condition_catalysis", nameZh: "催化", formula: "catalysis", displayFormula: "催化", count: 3, category: "condition", poolSide: "core", tags: ["reaction_condition"], conditionProvided: "catalysis" }),
  freezeDefinition({ id: "condition_high_temperature", nameZh: "高温", formula: "high_temperature", displayFormula: "高温", count: 4, category: "condition", poolSide: "core", tags: ["reaction_condition"], conditionProvided: "high_temperature" }),
  freezeDefinition({ id: "condition_oxide_film_removed", nameZh: "去氧化膜", formula: "oxide_film_removed", displayFormula: "去氧化膜", count: 3, category: "condition", poolSide: "core", tags: ["reaction_condition"], conditionProvided: "oxide_film_removed" }),
]);

const halogens: readonly B2R1CardPoolDefinition[] = Object.freeze([
  freezeDefinition({ id: "substance_f2", nameZh: "氟单质", formula: "F2", displayFormula: "F₂", count: 2, category: "halogen_elemental", poolSide: "other", tags: ["halogen", "special", "high_risk_candidate"] }),
  freezeDefinition({ id: "substance_cl2", nameZh: "氯气", formula: "Cl2", displayFormula: "Cl₂", count: 6, category: "halogen_elemental", poolSide: "other", tags: ["halogen", "harmful-gas"] }),
  freezeDefinition({ id: "substance_br2", nameZh: "溴单质", formula: "Br2", displayFormula: "Br₂", count: 5, category: "halogen_elemental", poolSide: "other", tags: ["halogen"] }),
  freezeDefinition({ id: "substance_i2", nameZh: "碘单质", formula: "I2", displayFormula: "I₂", count: 5, category: "halogen_elemental", poolSide: "other", tags: ["halogen"] }),
]);

const baseMoleculesAndGases: readonly B2R1CardPoolDefinition[] = Object.freeze([
  freezeDefinition({ id: "substance_h2", nameZh: "氢气", formula: "H2", displayFormula: "H₂", count: 5, category: "base_molecule_gas", poolSide: "other", tags: ["flammable_gas"] }),
  freezeDefinition({ id: "substance_o2", nameZh: "氧气", formula: "O2", displayFormula: "O₂", count: 6, category: "base_molecule_gas", poolSide: "other", tags: [] }),
  freezeDefinition({ id: "substance_so2", nameZh: "二氧化硫", formula: "SO2", displayFormula: "SO₂", count: 4, category: "base_molecule_gas", poolSide: "other", tags: ["harmful-gas"] }),
  freezeDefinition({ id: "substance_nh3", nameZh: "氨气", formula: "NH3", displayFormula: "NH₃", count: 3, category: "base_molecule_gas", poolSide: "other", tags: [] }),
  freezeDefinition({ id: "substance_h2o", nameZh: "水", formula: "H2O", displayFormula: "H₂O", count: 6, category: "base_molecule_gas", poolSide: "other", tags: ["fire-extinguish"], mediumProvided: "water" }),
  freezeDefinition({ id: "substance_co2", nameZh: "二氧化碳", formula: "CO2", displayFormula: "CO₂", count: 5, category: "base_molecule_gas", poolSide: "other", tags: ["fire-extinguish"] }),
]);

const namedReagentsAndOxides: readonly B2R1CardPoolDefinition[] = Object.freeze([
  freezeDefinition({ id: "substance_h2o2", nameZh: "过氧化氢", formula: "H2O2", displayFormula: "H₂O₂", count: 4, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent"] }),
  freezeDefinition({ id: "substance_kmno4", nameZh: "高锰酸钾", formula: "KMnO4", displayFormula: "KMnO₄", count: 4, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent"] }),
  freezeDefinition({ id: "substance_na2feo4", nameZh: "高铁酸钠", formula: "Na2FeO4", displayFormula: "Na₂FeO₄", count: 2, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent"] }),
  freezeDefinition({ id: "substance_mno2", nameZh: "二氧化锰", formula: "MnO2", displayFormula: "MnO₂", count: 4, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent", "oxide"], conditionProvided: "mno2_catalysis", conditionRowIds: ["OR-KClO3-MnO2"] }),
  freezeDefinition({ id: "substance_naclo", nameZh: "次氯酸钠", formula: "NaClO", displayFormula: "NaClO", count: 4, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent"] }),
  freezeDefinition({ id: "substance_cuo", nameZh: "氧化铜", formula: "CuO", displayFormula: "CuO", count: 4, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent", "oxide"] }),
  freezeDefinition({ id: "substance_co", nameZh: "一氧化碳", formula: "CO", displayFormula: "CO", count: 4, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent"] }),
  freezeDefinition({ id: "substance_fe2o3", nameZh: "氧化铁", formula: "Fe2O3", displayFormula: "Fe₂O₃", count: 4, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent", "oxide"] }),
  freezeDefinition({ id: "substance_na2o2", nameZh: "过氧化钠", formula: "Na2O2", displayFormula: "Na₂O₂", count: 3, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent", "oxide"] }),
  freezeDefinition({ id: "substance_kclo3", nameZh: "氯酸钾", formula: "KClO3", displayFormula: "KClO₃", count: 3, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent"] }),
  freezeDefinition({ id: "substance_na2s2o3", nameZh: "硫代硫酸钠", formula: "Na2S2O3", displayFormula: "Na₂S₂O₃", count: 3, category: "named_reagent_oxide", poolSide: "other", tags: ["reagent"] }),
]);

const diluteAcidsAndBases: readonly B2R1CardPoolDefinition[] = Object.freeze([
  diluteAcidBase({ id: "substance_hcl_dilute", nameZh: "稀盐酸", formula: "HCl", displayFormula: "稀 HCl", count: 3, category: "dilute_acid_base", poolSide: "other", tags: ["acid", "strong-acid", "aqueous", "dilute"], mediumProvided: "dil_non_oxidizing_acid", ionComposition: ionQuantities([["H+", 1], ["Cl-", 1]]) }),
  diluteAcidBase({ id: "substance_h2so4_dilute", nameZh: "稀硫酸", formula: "H2SO4", displayFormula: "稀 H₂SO₄", count: 2, category: "dilute_acid_base", poolSide: "other", tags: ["acid", "strong-acid", "aqueous", "dilute"], mediumProvided: "dil_non_oxidizing_acid", ionComposition: ionQuantities([["H+", 2], ["SO42-", 1]]) }),
  diluteAcidBase({ id: "substance_hno3_dilute", nameZh: "稀硝酸", formula: "HNO3", displayFormula: "稀 HNO₃", count: 2, category: "dilute_acid_base", poolSide: "other", tags: ["acid", "strong-acid", "aqueous", "dilute"], mediumProvided: "dil_hno3", ionComposition: ionQuantities([["H+", 1], ["NO3-", 1]]) }),
  diluteAcidBase({ id: "substance_naoh_dilute", nameZh: "稀氢氧化钠", formula: "NaOH", displayFormula: "稀 NaOH", count: 3, category: "dilute_acid_base", poolSide: "other", tags: ["base", "strong-alkali", "aqueous", "alkaline-absorb", "dilute"], ionComposition: ionQuantities([["Na+", 1], ["OH-", 1]]) }),
  diluteAcidBase({ id: "substance_koh_dilute", nameZh: "稀氢氧化钾", formula: "KOH", displayFormula: "稀 KOH", count: 2, category: "dilute_acid_base", poolSide: "other", tags: ["base", "strong-alkali", "aqueous", "alkaline-absorb", "dilute"], ionComposition: ionQuantities([["K+", 1], ["OH-", 1]]) }),
  diluteAcidBase({ id: "substance_caoh2_limewater", nameZh: "石灰水", formula: "Ca(OH)2", displayFormula: "石灰水 Ca(OH)₂", count: 2, category: "dilute_acid_base", poolSide: "other", tags: ["base", "strong-alkali", "aqueous", "alkaline-absorb", "dilute"], ionComposition: ionQuantities([["Ca2+", 1], ["OH-", 2]]) }),
]);

const concentratedAcids: readonly B2R1CardPoolDefinition[] = Object.freeze([
  freezeDefinition({ id: "substance_hcl_concentrated", nameZh: "浓盐酸", formula: "HCl", displayFormula: "浓 HCl", count: 2, category: "concentrated_acid", poolSide: "other", tags: ["acid", "strong-acid", "aqueous", "concentrated"], mediumProvided: "conc_hcl", ionComposition: ionQuantities([["H+", 1], ["Cl-", 1]]) }),
  freezeDefinition({ id: "substance_hno3_concentrated", nameZh: "浓硝酸", formula: "HNO3", displayFormula: "浓 HNO₃", count: 2, category: "concentrated_acid", poolSide: "other", tags: ["acid", "strong-acid", "aqueous", "concentrated"], mediumProvided: "conc_hno3", ionComposition: ionQuantities([["H+", 1], ["NO3-", 1]]) }),
]);

const saltDefinitions: readonly B2R1CardPoolDefinition[] = Object.freeze(B2R1_SALT_CATALOG.map((salt) => freezeDefinition({
  ...salt,
  tags: Object.freeze(salt.tags.map(cardPoolTag)),
  count: 1,
  category: "salt",
  poolSide: "other",
  diyInputSignature: ionQuantities([[salt.cation, salt.cationCount], [salt.anion, salt.anionCount]]),
})));

/** The sole canonical B2-R1 ordinary-card inventory; counts remain aggregate. */
export const B2R1_CARD_POOL_DEFINITIONS: readonly B2R1CardPoolDefinition[] = Object.freeze([
  ...independentIons,
  ...dualUseMetals,
  ...baseElements,
  ...conditionCards,
  ...halogens,
  ...baseMoleculesAndGases,
  ...namedReagentsAndOxides,
  ...diluteAcidsAndBases,
  ...concentratedAcids,
  ...saltDefinitions,
]);

export const B2R1_CARD_POOL_DECK_MANIFEST: readonly B2R1CardPoolDeckManifestEntry[] = Object.freeze(
  B2R1_CARD_POOL_DEFINITIONS.map(({ id, count }) => Object.freeze({ definitionId: id, count }))
);

const CATEGORY_ORDER: readonly B2R1CardPoolCategory[] = Object.freeze([
  "independent_ion",
  "dual_use_metal",
  "base_element",
  "condition",
  "halogen_elemental",
  "base_molecule_gas",
  "named_reagent_oxide",
  "dilute_acid_base",
  "concentrated_acid",
  "salt",
]);

export const B2R1_CARD_POOL_CATEGORY_TOTALS: readonly B2R1CardPoolCategoryTotal[] = Object.freeze(
  CATEGORY_ORDER.map((category) => {
    const categoryDefinitions = B2R1_CARD_POOL_DEFINITIONS.filter((definition) => definition.category === category);
    let cards = 0;
    let poolSide: "core" | "other" = "other";
    for (const definition of categoryDefinitions) {
      cards += definition.count;
      poolSide = definition.poolSide;
    }
    return Object.freeze({ category, definitions: categoryDefinitions.length, cards, poolSide });
  })
);

export const B2R1_CARD_POOL_TOTALS: B2R1CardPoolTotals = Object.freeze(
  B2R1_CARD_POOL_CATEGORY_TOTALS.reduce<B2R1CardPoolTotals>((totals, categoryTotal) => ({
    definitions: totals.definitions + categoryTotal.definitions,
    cards: totals.cards + categoryTotal.cards,
    coreCards: totals.coreCards + (categoryTotal.poolSide === "core" ? categoryTotal.cards : 0),
    otherCards: totals.otherCards + (categoryTotal.poolSide === "other" ? categoryTotal.cards : 0),
  }), { definitions: 0, cards: 0, coreCards: 0, otherCards: 0 })
);

function groupProviders<K extends string, T>(
  definitions: readonly B2R1CardPoolDefinition[],
  getKey: (definition: B2R1CardPoolDefinition) => K | undefined,
  createProvider: (key: K, definitionIds: readonly string[]) => T
): readonly T[] {
  const grouped = new Map<K, string[]>();
  for (const definition of definitions) {
    const key = getKey(definition);
    if (key === undefined) continue;
    const definitionIds = grouped.get(key);
    if (definitionIds === undefined) grouped.set(key, [definition.id]);
    else definitionIds.push(definition.id);
  }
  return Object.freeze(Array.from(grouped, ([key, definitionIds]) => Object.freeze(
    createProvider(key, Object.freeze(definitionIds))
  )));
}

export const B2R1_CARD_POOL_FORMULA_PROVIDERS: readonly B2R1CardPoolFormulaProvider[] = groupProviders(
  B2R1_CARD_POOL_DEFINITIONS,
  ({ formula }) => formula,
  (formula, definitionIds) => ({ formula, definitionIds })
);

export const B2R1_CARD_POOL_MEDIUM_PROVIDERS: readonly B2R1CardPoolMediumProvider[] = groupProviders<B2R1MediumId, B2R1CardPoolMediumProvider>(
  B2R1_CARD_POOL_DEFINITIONS,
  ({ mediumProvided }) => mediumProvided,
  (medium, definitionIds) => ({ medium, definitionIds })
);

export const B2R1_CARD_POOL_CONDITION_PROVIDERS: readonly B2R1CardPoolConditionProvider[] = groupProviders<B2R1ReactionCondition, B2R1CardPoolConditionProvider>(
  B2R1_CARD_POOL_DEFINITIONS,
  ({ conditionProvided }) => conditionProvided,
  (condition, definitionIds) => ({ condition, definitionIds })
);

const ionSources: B2R1CardPoolIonSource[] = [];
for (const definition of B2R1_CARD_POOL_DEFINITIONS) {
  if (definition.category === "independent_ion" && definition.ionProvided !== undefined) {
    const source: B2R1CardPoolIonSource = {
      ionId: definition.ionProvided,
      definitionId: definition.id,
      sourceKind: "independent_ion",
      unitsPerCard: 1,
    };
    ionSources.push(Object.freeze(source));
  }
  if (definition.category === "dual_use_metal") {
    for (const mode of definition.modes ?? []) {
      if (mode.mode !== "ion_component") continue;
      const source: B2R1CardPoolIonSource = {
        ionId: mode.ionId,
        definitionId: definition.id,
        sourceKind: "metal_ion_component",
        unitsPerCard: 1,
      };
      ionSources.push(Object.freeze(source));
    }
  }
}

export const B2R1_CARD_POOL_ION_SOURCES: readonly B2R1CardPoolIonSource[] = Object.freeze(ionSources);
