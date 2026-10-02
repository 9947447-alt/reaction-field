import { describe, expect, it } from "vitest";
import {
  B2R1_MEDIUM_DEFINITIONS,
  B2R1_MEDIUM_IDS,
  B2R1_METAL_DEFINITIONS,
  B2R1_METAL_ELEMENT_IDS,
  B2R1_REDOX_REACTION_ROWS,
  B2R1_STIMULUS_STATUS_CHLORINE,
  B2R1_STIMULUS_STATUS_NITROGEN_OXIDE,
  B2R1_STIMULUS_STATUSES,
  getB2R1RedoxReaction,
  isB2R1MetalElement,
  matchB2R1RedoxReaction,
  normalizeIonId,
  normalizeMediumId,
} from "../data/b2r1";

describe("Phase 22 B2-R1 氧化还原反应数据与纯函数匹配", () => {
  describe("1. 碳酸根下标与离子别名标准化", () => {
    it("normalizeIonId 正确归一 Unicode 下标形式 CO₃²⁻", () => {
      expect(normalizeIonId("CO₃²⁻")).toBe("CO32-");
    });

    it("normalizeIonId 仍正确归一普通数字形式 CO3²⁻ 和幂形式 CO3^2-", () => {
      expect(normalizeIonId("CO3²⁻")).toBe("CO32-");
      expect(normalizeIonId("CO3^2-")).toBe("CO32-");
    });
  });

  describe("2. 金属单质与介质枚举 (§3.2, §3.3)", () => {
    it("金属单质枚举至少包含 Cu, Mg, Zn, Fe, Al, Ag", () => {
      const requiredMetals = ["Cu", "Mg", "Zn", "Fe", "Al", "Ag"] as const;
      for (const metal of requiredMetals) {
        expect(B2R1_METAL_ELEMENT_IDS).toContain(metal);
        expect(isB2R1MetalElement(metal)).toBe(true);
      }
      expect(isB2R1MetalElement("Au")).toBe(false);

      const metalSymbols = B2R1_METAL_DEFINITIONS.map((m) => m.symbol);
      for (const metal of requiredMetals) {
        expect(metalSymbols).toContain(metal);
      }
    });

    it("介质枚举至少包含浓 HCl、稀 HNO₃、浓 HNO₃、稀非氧化性酸、水", () => {
      const requiredMediums = [
        "conc_hcl",
        "dil_hno3",
        "conc_hno3",
        "dil_non_oxidizing_acid",
        "water",
      ] as const;
      for (const medium of requiredMediums) {
        expect(B2R1_MEDIUM_IDS).toContain(medium);
        expect(B2R1_MEDIUM_DEFINITIONS[medium]).toBeDefined();
        expect(B2R1_MEDIUM_DEFINITIONS[medium].nameZh.length).toBeGreaterThan(0);
        expect(B2R1_MEDIUM_DEFINITIONS[medium].nameEn.length).toBeGreaterThan(0);
      }

      expect(normalizeMediumId("浓 HCl")).toBe("conc_hcl");
      expect(normalizeMediumId("稀 HNO₃")).toBe("dil_hno3");
      expect(normalizeMediumId("浓 HNO₃")).toBe("conc_hno3");
      expect(normalizeMediumId("稀非氧化性酸")).toBe("dil_non_oxidizing_acid");
      expect(normalizeMediumId("水")).toBe("water");
    });

    it("金属与介质列表已被 Object.freeze 冻结", () => {
      expect(Object.isFrozen(B2R1_METAL_ELEMENT_IDS)).toBe(true);
      expect(Object.isFrozen(B2R1_METAL_DEFINITIONS)).toBe(true);
      expect(Object.isFrozen(B2R1_MEDIUM_IDS)).toBe(true);
      expect(Object.isFrozen(B2R1_MEDIUM_DEFINITIONS)).toBe(true);
    });
  });

  describe("3. 三条氧化还原反应行与双语气体刺激状态 (§3.7, §3.8, §3.10, §3.11)", () => {
    it("恰好收录本刀锁定的三条反应行", () => {
      expect(B2R1_REDOX_REACTION_ROWS).toHaveLength(3);
      const rowIds = B2R1_REDOX_REACTION_ROWS.map((r) => r.id);
      expect(rowIds).toEqual([
        "OR-KMnO4-HCl-conc",
        "OR-Cu-HNO3-dil",
        "OR-Na2FeO4-purify",
      ]);
    });

    it("气体刺激状态满足双语与稳定英文键要求", () => {
      expect(B2R1_STIMULUS_STATUSES).toHaveLength(2);

      // 氯气刺激
      expect(B2R1_STIMULUS_STATUS_CHLORINE.id).toBe("chlorine_gas_stimulus");
      expect(B2R1_STIMULUS_STATUS_CHLORINE.nameZh).toBe("氯气刺激");
      expect(B2R1_STIMULUS_STATUS_CHLORINE.nameEn).toBe("chlorine-gas stimulus");

      // 氮氧化物刺激
      expect(B2R1_STIMULUS_STATUS_NITROGEN_OXIDE.id).toBe("nitrogen_oxide_stimulus");
      expect(B2R1_STIMULUS_STATUS_NITROGEN_OXIDE.nameZh).toBe("氮氧化物刺激");
      expect(B2R1_STIMULUS_STATUS_NITROGEN_OXIDE.nameEn).toBe("nitrogen-oxide stimulus");
    });

    it("各反应行包含完整方程式、介质及效果定义", () => {
      const kmno4Row = getB2R1RedoxReaction("OR-KMnO4-HCl-conc");
      expect(kmno4Row).toBeDefined();
      expect(kmno4Row?.medium).toBe("conc_hcl");
      expect(kmno4Row?.stimulusStatus?.nameZh).toBe("氯气刺激");
      expect(kmno4Row?.stimulusStatus?.nameEn).toBe("chlorine-gas stimulus");

      const cuRow = getB2R1RedoxReaction("OR-Cu-HNO3-dil");
      expect(cuRow).toBeDefined();
      expect(cuRow?.medium).toBe("dil_hno3");
      expect(cuRow?.stimulusStatus?.nameZh).toBe("氮氧化物刺激");
      expect(cuRow?.stimulusStatus?.nameEn).toBe("nitrogen-oxide stimulus");

      const purifyRow = getB2R1RedoxReaction("OR-Na2FeO4-purify");
      expect(purifyRow).toBeDefined();
      expect(purifyRow?.medium).toBe("water");
      expect(purifyRow?.stimulusStatus).toBeUndefined();
      expect(purifyRow?.effectZh).toBe("移除一项浑浊/有机污染");
    });
  });

  describe("4. 纯函数匹配正确识别三种完整条件", () => {
    it("1) OR-KMnO4-HCl-conc: 2KMnO₄ + 16HCl → 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O", () => {
      const res1 = matchB2R1RedoxReaction({
        reactants: ["KMnO4"],
        medium: "conc_hcl",
      });
      expect(res1.matched).toBe(true);
      expect(res1.rowId).toBe("OR-KMnO4-HCl-conc");
      expect(res1.statusNameZh).toBe("氯气刺激");
      expect(res1.statusNameEn).toBe("chlorine-gas stimulus");
      expect(res1.statusId).toBe("chlorine_gas_stimulus");

      // 支持双参调用及别名
      const res2 = matchB2R1RedoxReaction("KMnO₄", "浓 HCl");
      expect(res2.matched).toBe(true);
      expect(res2.rowId).toBe("OR-KMnO4-HCl-conc");
      expect(res2.statusNameZh).toBe("氯气刺激");
    });

    it("2) OR-Cu-HNO3-dil: 3Cu + 8H⁺ + 2NO₃⁻ → 3Cu²⁺ + 2NO↑ + 4H₂O", () => {
      const res1 = matchB2R1RedoxReaction({
        reactants: ["Cu"],
        medium: "dil_hno3",
      });
      expect(res1.matched).toBe(true);
      expect(res1.rowId).toBe("OR-Cu-HNO3-dil");
      expect(res1.statusNameZh).toBe("氮氧化物刺激");
      expect(res1.statusNameEn).toBe("nitrogen-oxide stimulus");
      expect(res1.statusId).toBe("nitrogen_oxide_stimulus");

      // 支持双参调用及别名
      const res2 = matchB2R1RedoxReaction("铜", "稀硝酸");
      expect(res2.matched).toBe(true);
      expect(res2.rowId).toBe("OR-Cu-HNO3-dil");
      expect(res2.statusNameZh).toBe("氮氧化物刺激");
    });

    it("3) OR-Na2FeO4-purify: 4Na₂FeO₄ + 10H₂O → 4Fe(OH)₃↓ + 3O₂↑ + 8NaOH", () => {
      const res1 = matchB2R1RedoxReaction({
        reactants: ["Na2FeO4"],
        medium: "water",
      });
      expect(res1.matched).toBe(true);
      expect(res1.rowId).toBe("OR-Na2FeO4-purify");
      expect(res1.stimulusStatus).toBeUndefined();
      expect(res1.statusNameZh).toBeUndefined();
      expect(res1.effectZh).toBe("移除一项浑浊/有机污染");

      // 支持双参调用及别名
      const res2 = matchB2R1RedoxReaction("Na₂FeO₄", "水");
      expect(res2.matched).toBe(true);
      expect(res2.rowId).toBe("OR-Na2FeO4-purify");
    });
  });

  describe("5. 负例拦截回归测试（必须全部失败）", () => {
    it("负例 1: KMnO₄ 无浓 HCl（如介质为稀盐酸、水、稀硝酸、稀非氧化性酸）", () => {
      expect(matchB2R1RedoxReaction("KMnO4", "water").matched).toBe(false);
      expect(matchB2R1RedoxReaction("KMnO4", "dil_non_oxidizing_acid").matched).toBe(false);
      expect(matchB2R1RedoxReaction("KMnO4", "dil_hno3").matched).toBe(false);
      expect(matchB2R1RedoxReaction("KMnO4", "conc_hno3").matched).toBe(false);
    });

    it("负例 2: Cu + 稀非氧化性酸（根据 §3.2 Cu + H⁺ 不反应）", () => {
      const res = matchB2R1RedoxReaction({
        reactants: ["Cu"],
        medium: "dil_non_oxidizing_acid",
      });
      expect(res.matched).toBe(false);
      expect(res.rowId).toBeUndefined();
    });

    it("负例 3: Cu + 浓 HNO₃（本刀只锁三条，不实现 OR-Cu-HNO3-conc）", () => {
      const res = matchB2R1RedoxReaction({
        reactants: ["Cu"],
        medium: "conc_hno3",
      });
      expect(res.matched).toBe(false);
      expect(res.rowId).toBeUndefined();
    });

    it("负例 4: Na₂FeO₄ 无水（如介质非水）", () => {
      expect(matchB2R1RedoxReaction("Na2FeO4", "conc_hcl").matched).toBe(false);
      expect(matchB2R1RedoxReaction("Na2FeO4", "dil_hno3").matched).toBe(false);
      expect(matchB2R1RedoxReaction("Na2FeO4", "dil_non_oxidizing_acid").matched).toBe(false);
    });

    it("负例 5: 任意未列组合（未实现金属、多反应物、未知试剂等）", () => {
      // 未列出金属与酸
      expect(matchB2R1RedoxReaction("Fe", "dil_hno3").matched).toBe(false);
      expect(matchB2R1RedoxReaction("Mg", "dil_non_oxidizing_acid").matched).toBe(false);
      expect(matchB2R1RedoxReaction("Zn", "dil_non_oxidizing_acid").matched).toBe(false);
      expect(matchB2R1RedoxReaction("Al", "conc_hcl").matched).toBe(false);
      expect(matchB2R1RedoxReaction("Ag", "dil_hno3").matched).toBe(false);

      // 杂合多反应物
      expect(matchB2R1RedoxReaction(["Cu", "KMnO4"], "conc_hcl").matched).toBe(false);
      expect(matchB2R1RedoxReaction(["Na2FeO4", "Cu"], "water").matched).toBe(false);

      // 空反应物或未知介质
      expect(matchB2R1RedoxReaction([], "conc_hcl").matched).toBe(false);
      expect(matchB2R1RedoxReaction(["Cu"], "unknown_medium").matched).toBe(false);
    });
  });

  describe("6. 纯函数不修改入参", () => {
    it("传入被 Object.freeze 冻结的对象与数组不会被篡改", () => {
      const reactants = Object.freeze(["Cu"]);
      const input = Object.freeze({
        reactants,
        medium: "dil_hno3",
      });

      const res = matchB2R1RedoxReaction(input);
      expect(res.matched).toBe(true);
      expect(input.reactants).toEqual(["Cu"]);
      expect(input.medium).toBe("dil_hno3");
    });
  });
});
