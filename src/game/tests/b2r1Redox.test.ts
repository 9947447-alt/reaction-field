import { describe, expect, it } from "vitest";
import {
  B2R1_CONDITION_OXIDE_FILM_REMOVED,
  B2R1_DISPLACEMENT_EFFECT_TAG_DEFINITIONS,
  B2R1_DISPLACEMENT_EFFECT_TAGS,
  B2R1_EFFECT_TAG_AGNO3_CL_TEST,
  B2R1_EFFECT_TAG_DEFINITION_AGNO3_CL_TEST,
  B2R1_EFFECT_TAG_DEFINITION_SEIZE_CU,
  B2R1_EFFECT_TAG_DEFINITION_SILVER_MIRROR,
  B2R1_EFFECT_TAG_SEIZE_CU,
  B2R1_EFFECT_TAG_SILVER_MIRROR,
  B2R1_GAS_TAG_DEFINITION_FLAMMABLE,
  B2R1_GAS_TAG_DEFINITIONS,
  B2R1_GAS_TAG_FLAMMABLE,
  B2R1_HALOGEN_PRODUCT_TAG_DEFINITIONS,
  B2R1_HALOGEN_PRODUCT_TAGS,
  B2R1_MEDIUM_DEFINITIONS,
  B2R1_MEDIUM_IDS,
  B2R1_METAL_DEFINITIONS,
  B2R1_METAL_ELEMENT_IDS,
  B2R1_PRODUCT_TAG_BR2,
  B2R1_PRODUCT_TAG_DEFINITION_BR2,
  B2R1_PRODUCT_TAG_DEFINITION_I2,
  B2R1_PRODUCT_TAG_I2,
  B2R1_REACTION_CONDITIONS,
  B2R1_REDOX_REACTION_ROWS,
  B2R1_STIMULUS_STATUS_CHLORINE,
  B2R1_STIMULUS_STATUS_NITROGEN_OXIDE,
  B2R1_STIMULUS_STATUSES,
  getB2R1RedoxReaction,
  isB2R1MetalElement,
  matchB2R1RedoxReaction,
  normalizeIonId,
  normalizeMediumId,
  normalizeReactionCondition,
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

  describe("3. 氧化还原反应行、气体状态与可燃标签 (§3.2, §3.3, §3.7, §3.8, §3.10, §3.11)", () => {
    it("恰好收录本刀锁定的二十条反应行（旧十六行 + §3.4 四行卤素置换）", () => {
      expect(B2R1_REDOX_REACTION_ROWS).toHaveLength(20);
      const rowIds = B2R1_REDOX_REACTION_ROWS.map((r) => r.id);
      expect(rowIds).toEqual([
        "OR-KMnO4-HCl-conc",
        "OR-Cu-HNO3-dil",
        "OR-Na2FeO4-purify",
        "OR-Mg-H",
        "OR-Zn-H",
        "OR-Fe-H",
        "OR-Al-H",
        "OR-Cu-H",
        "OR-Ag-H",
        "OR-Mg-Cu",
        "OR-Zn-Cu",
        "OR-Fe-Cu",
        "OR-Mg-Ag",
        "OR-Zn-Ag",
        "OR-Fe-Ag",
        "OR-Cu-Ag",
        "OR-Cl2-Br",
        "OR-Cl2-I",
        "OR-Br2-I",
        "OR-Cl2-F",
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

    it("可燃气体标签定义与反应条件常量冻结", () => {
      expect(B2R1_GAS_TAG_FLAMMABLE).toBe("flammable_gas");
      expect(B2R1_GAS_TAG_DEFINITION_FLAMMABLE.id).toBe("flammable_gas");
      expect(B2R1_GAS_TAG_DEFINITION_FLAMMABLE.nameZh).toBe("可燃气体");
      expect(B2R1_GAS_TAG_DEFINITION_FLAMMABLE.nameEn).toBe("flammable gas");
      expect(Object.isFrozen(B2R1_GAS_TAG_DEFINITION_FLAMMABLE)).toBe(true);
      expect(B2R1_GAS_TAG_DEFINITIONS[B2R1_GAS_TAG_FLAMMABLE]).toBe(B2R1_GAS_TAG_DEFINITION_FLAMMABLE);

      expect(B2R1_CONDITION_OXIDE_FILM_REMOVED).toBe("oxide_film_removed");
      expect(B2R1_REACTION_CONDITIONS).toContain("oxide_film_removed");
      expect(normalizeReactionCondition("去氧化膜")).toBe("oxide_film_removed");
      expect(normalizeReactionCondition("oxide_film_removed")).toBe("oxide_film_removed");
      expect(normalizeReactionCondition("未知条件")).toBeUndefined();
    });

    it("§3.2 产氢行包含可燃标签，且不包含即时伤害数值", () => {
      const h2Rows = ["OR-Mg-H", "OR-Zn-H", "OR-Fe-H", "OR-Al-H"] as const;
      for (const id of h2Rows) {
        const row = getB2R1RedoxReaction(id);
        expect(row).toBeDefined();
        expect(row?.medium).toBe("dil_non_oxidizing_acid");
        expect(row?.gasTags).toContain("flammable_gas");
        // 绝不包含伤害数值字段
        expect((row as unknown as Record<string, unknown>).damage).toBeUndefined();
        expect((row as unknown as Record<string, unknown>).instantDamage).toBeUndefined();
        expect((row as unknown as Record<string, unknown>).duration).toBeUndefined();
      }
    });

    it("§3.2 Cu 与 Ag 行明确定义为不反应", () => {
      const cuRow = getB2R1RedoxReaction("OR-Cu-H");
      expect(cuRow).toBeDefined();
      expect(cuRow?.medium).toBe("dil_non_oxidizing_acid");
      expect(cuRow?.isNoReaction).toBe(true);
      expect(cuRow?.effectZh).toBe("不反应");

      const agRow = getB2R1RedoxReaction("OR-Ag-H");
      expect(agRow).toBeDefined();
      expect(agRow?.medium).toBe("dil_non_oxidizing_acid");
      expect(agRow?.isNoReaction).toBe(true);
      expect(agRow?.effectZh).toBe("不反应");
    });
  });

  describe("4. 纯函数匹配正确识别旧三条与新六行", () => {
    describe("旧三条氧化还原反应保持不变", () => {
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

        const res2 = matchB2R1RedoxReaction("Na₂FeO₄", "水");
        expect(res2.matched).toBe(true);
        expect(res2.rowId).toBe("OR-Na2FeO4-purify");
      });
    });

    describe("§3.2 金属在稀非氧化性酸中产氢与不反应", () => {
      it("Mg 加稀非氧化性酸返回 OR-Mg-H，带可燃气体标签，无伤害数值", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Mg"],
          medium: "dil_non_oxidizing_acid",
        });
        expect(res.matched).toBe(true);
        expect(res.success).toBe(true);
        expect(res.rowId).toBe("OR-Mg-H");
        expect(res.gasTags).toContain("flammable_gas");
        expect((res as unknown as Record<string, unknown>).damage).toBeUndefined();

        const resAlias = matchB2R1RedoxReaction("镁", "稀非氧化性酸");
        expect(resAlias.matched).toBe(true);
        expect(resAlias.rowId).toBe("OR-Mg-H");
      });

      it("Zn 加稀非氧化性酸返回 OR-Zn-H，带可燃气体标签，无伤害数值", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Zn"],
          medium: "dil_non_oxidizing_acid",
        });
        expect(res.matched).toBe(true);
        expect(res.success).toBe(true);
        expect(res.rowId).toBe("OR-Zn-H");
        expect(res.gasTags).toContain("flammable_gas");
        expect((res as unknown as Record<string, unknown>).damage).toBeUndefined();

        const resAlias = matchB2R1RedoxReaction("锌", "稀非氧化性酸");
        expect(resAlias.matched).toBe(true);
        expect(resAlias.rowId).toBe("OR-Zn-H");
      });

      it("Fe 加稀非氧化性酸返回 OR-Fe-H，带可燃气体标签，无伤害数值且不接沉淀链", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Fe"],
          medium: "dil_non_oxidizing_acid",
        });
        expect(res.matched).toBe(true);
        expect(res.success).toBe(true);
        expect(res.rowId).toBe("OR-Fe-H");
        expect(res.gasTags).toContain("flammable_gas");
        expect((res as unknown as Record<string, unknown>).damage).toBeUndefined();

        const resAlias = matchB2R1RedoxReaction("铁", "稀非氧化性酸");
        expect(resAlias.matched).toBe(true);
        expect(resAlias.rowId).toBe("OR-Fe-H");
      });

      it("Al 无去氧化膜返回不反应；有去氧化膜返回 OR-Al-H", () => {
        // 无去氧化膜：不反应
        const resWithoutCondition = matchB2R1RedoxReaction({
          reactants: ["Al"],
          medium: "dil_non_oxidizing_acid",
        });
        expect(resWithoutCondition.matched).toBe(false);
        expect(resWithoutCondition.success).toBe(false);
        expect(resWithoutCondition.rowId).toBe("OR-Al-H");
        expect(resWithoutCondition.isNoReaction).toBe(true);

        // 有去氧化膜：成功匹配 OR-Al-H
        const resWithCondition = matchB2R1RedoxReaction({
          reactants: ["Al"],
          medium: "dil_non_oxidizing_acid",
          conditions: ["oxide_film_removed"],
        });
        expect(resWithCondition.matched).toBe(true);
        expect(resWithCondition.success).toBe(true);
        expect(resWithCondition.rowId).toBe("OR-Al-H");
        expect(resWithCondition.gasTags).toContain("flammable_gas");
        expect((resWithCondition as unknown as Record<string, unknown>).damage).toBeUndefined();

        // 别名调用支持：中文去氧化膜
        const resWithAlias = matchB2R1RedoxReaction("铝", "稀非氧化性酸", "去氧化膜");
        expect(resWithAlias.matched).toBe(true);
        expect(resWithAlias.rowId).toBe("OR-Al-H");
      });

      it("Cu + dil_non_oxidizing_acid 返回 OR-Cu-H，matched 为 false 且显式标记不反应", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Cu"],
          medium: "dil_non_oxidizing_acid",
        });
        expect(res.matched).toBe(false);
        expect(res.success).toBe(false);
        expect(res.rowId).toBe("OR-Cu-H");
        expect(res.isNoReaction).toBe(true);

        const resAlias = matchB2R1RedoxReaction("铜", "稀非氧化性酸");
        expect(resAlias.matched).toBe(false);
        expect(resAlias.rowId).toBe("OR-Cu-H");
        expect(resAlias.isNoReaction).toBe(true);
      });

      it("Ag + dil_non_oxidizing_acid 返回 OR-Ag-H，matched 为 false 且显式标记不反应", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Ag"],
          medium: "dil_non_oxidizing_acid",
        });
        expect(res.matched).toBe(false);
        expect(res.success).toBe(false);
        expect(res.rowId).toBe("OR-Ag-H");
        expect(res.isNoReaction).toBe(true);

        const resAlias = matchB2R1RedoxReaction("银", "稀非氧化性酸");
        expect(resAlias.matched).toBe(false);
        expect(resAlias.rowId).toBe("OR-Ag-H");
        expect(resAlias.isNoReaction).toBe(true);
      });
    });
  });

  describe("5. 介质分叉与严格负例拦截回归测试", () => {
    it("P0: Cu + dil_hno3 仍返回 OR-Cu-HNO3-dil (matched=true, 氮氧化物刺激)，绝不落入 §3.2 或判为不反应", () => {
      const res = matchB2R1RedoxReaction({
        reactants: ["Cu"],
        medium: "dil_hno3",
      });
      expect(res.matched).toBe(true);
      expect(res.rowId).toBe("OR-Cu-HNO3-dil");
      expect(res.statusNameZh).toBe("氮氧化物刺激");
    });

    it("负例 1: KMnO₄ 无浓 HCl（如介质为稀盐酸、水、稀硝酸、稀非氧化性酸）", () => {
      expect(matchB2R1RedoxReaction("KMnO4", "water").matched).toBe(false);
      expect(matchB2R1RedoxReaction("KMnO4", "dil_non_oxidizing_acid").matched).toBe(false);
      expect(matchB2R1RedoxReaction("KMnO4", "dil_hno3").matched).toBe(false);
      expect(matchB2R1RedoxReaction("KMnO4", "conc_hno3").matched).toBe(false);
    });

    it("负例 2: Cu + 浓 HNO₃（本刀只锁 §3.2 与旧三行，不实现 OR-Cu-HNO3-conc）返回未知失败", () => {
      const res = matchB2R1RedoxReaction({
        reactants: ["Cu"],
        medium: "conc_hno3",
      });
      expect(res.matched).toBe(false);
      expect(res.rowId).toBeUndefined();
    });

    it("负例 3: Na₂FeO₄ 无水（如介质非水）", () => {
      expect(matchB2R1RedoxReaction("Na2FeO4", "conc_hcl").matched).toBe(false);
      expect(matchB2R1RedoxReaction("Na2FeO4", "dil_hno3").matched).toBe(false);
      expect(matchB2R1RedoxReaction("Na2FeO4", "dil_non_oxidizing_acid").matched).toBe(false);
    });

    it("负例 4: 未知组合返回 matched=false 且 rowId 为 undefined，与显式不反应（带 rowId）严格区分", () => {
      // 未列出金属与酸
      const resFeHno3 = matchB2R1RedoxReaction("Fe", "dil_hno3");
      expect(resFeHno3.matched).toBe(false);
      expect(resFeHno3.rowId).toBeUndefined();

      const resAlHCl = matchB2R1RedoxReaction("Al", "conc_hcl");
      expect(resAlHCl.matched).toBe(false);
      expect(resAlHCl.rowId).toBeUndefined();

      const resAgHno3 = matchB2R1RedoxReaction("Ag", "dil_hno3");
      expect(resAgHno3.matched).toBe(false);
      expect(resAgHno3.rowId).toBeUndefined();

      // 未收录单质金属（如 Au）在稀非氧化性酸中
      const resAu = matchB2R1RedoxReaction("Au", "dil_non_oxidizing_acid");
      expect(resAu.matched).toBe(false);
      expect(resAu.rowId).toBeUndefined();

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
      const reactants = Object.freeze(["Al"]);
      const conditions = Object.freeze(["oxide_film_removed"]);
      const input = Object.freeze({
        reactants,
        medium: "dil_non_oxidizing_acid",
        conditions,
      });

      const res = matchB2R1RedoxReaction(input);
      expect(res.matched).toBe(true);
      expect(input.reactants).toEqual(["Al"]);
      expect(input.medium).toBe("dil_non_oxidizing_acid");
      expect(input.conditions).toEqual(["oxide_film_removed"]);
    });

    it("传入带 solutionIons 的 Object.freeze 冻结入参不会被篡改", () => {
      const reactants = Object.freeze(["Mg"]);
      const solutionIons = Object.freeze(["Cu2+"]);
      const input = Object.freeze({
        reactants,
        solutionIons,
        medium: "water",
      });

      const res = matchB2R1RedoxReaction(input);
      expect(res.matched).toBe(true);
      expect(res.rowId).toBe("OR-Mg-Cu");
      expect(input.reactants).toEqual(["Mg"]);
      expect(input.solutionIons).toEqual(["Cu2+"]);
      expect(input.medium).toBe("water");
    });
  });

  describe("7. §3.3 金属置换反应、效果标签与严格负例加锁", () => {
    describe("7.1 效果标签定义与反应行只读数据冻结", () => {
      it("收录三个金属置换效果标签定义且均被冻结", () => {
        expect(B2R1_DISPLACEMENT_EFFECT_TAGS).toHaveLength(3);
        expect(B2R1_DISPLACEMENT_EFFECT_TAGS).toEqual([
          "seize_cu2_produce_cu",
          "silver_mirror_precipitation_entry",
          "agno3_cl_test_linkage",
        ]);

        // 夺取 Cu²⁺；生成 Cu 资源/打断
        expect(B2R1_EFFECT_TAG_SEIZE_CU).toBe("seize_cu2_produce_cu");
        expect(B2R1_EFFECT_TAG_DEFINITION_SEIZE_CU.id).toBe("seize_cu2_produce_cu");
        expect(B2R1_EFFECT_TAG_DEFINITION_SEIZE_CU.nameZh).toBe("夺取 Cu²⁺；生成 Cu 资源/打断");
        expect(Object.isFrozen(B2R1_EFFECT_TAG_DEFINITION_SEIZE_CU)).toBe(true);

        // 银镜/沉淀链入口
        expect(B2R1_EFFECT_TAG_SILVER_MIRROR).toBe("silver_mirror_precipitation_entry");
        expect(B2R1_EFFECT_TAG_DEFINITION_SILVER_MIRROR.id).toBe("silver_mirror_precipitation_entry");
        expect(B2R1_EFFECT_TAG_DEFINITION_SILVER_MIRROR.nameZh).toBe("银镜/沉淀链入口");
        expect(Object.isFrozen(B2R1_EFFECT_TAG_DEFINITION_SILVER_MIRROR)).toBe(true);

        // AgNO₃ / Cl⁻ 检验联动
        expect(B2R1_EFFECT_TAG_AGNO3_CL_TEST).toBe("agno3_cl_test_linkage");
        expect(B2R1_EFFECT_TAG_DEFINITION_AGNO3_CL_TEST.id).toBe("agno3_cl_test_linkage");
        expect(B2R1_EFFECT_TAG_DEFINITION_AGNO3_CL_TEST.nameZh).toBe("AgNO₃ / Cl⁻ 检验联动");
        expect(Object.isFrozen(B2R1_EFFECT_TAG_DEFINITION_AGNO3_CL_TEST)).toBe(true);

        expect(Object.isFrozen(B2R1_DISPLACEMENT_EFFECT_TAG_DEFINITIONS)).toBe(true);
      });

      it("§3.3 七条反应行均收录且未收录禁止行（OR-Fe-Cu2, OR-Zn-Cu2, OR-Al-Cu2, OR-Mg-Fe2）", () => {
        const requiredDisplacementRows = [
          "OR-Mg-Cu",
          "OR-Zn-Cu",
          "OR-Fe-Cu",
          "OR-Mg-Ag",
          "OR-Zn-Ag",
          "OR-Fe-Ag",
          "OR-Cu-Ag",
        ] as const;

        for (const id of requiredDisplacementRows) {
          const row = getB2R1RedoxReaction(id);
          expect(row).toBeDefined();
          expect(row?.medium).toBe("water");
          expect(Object.isFrozen(row)).toBe(true);
          // 效果只记标签，不实现演出或打断结算
          expect((row as unknown as Record<string, unknown>).animation).toBeUndefined();
          expect((row as unknown as Record<string, unknown>).interruptEffect).toBeUndefined();
          expect((row as unknown as Record<string, unknown>).resourceGain).toBeUndefined();
        }

        // 禁止新增行验证
        expect(getB2R1RedoxReaction("OR-Fe-Cu2")).toBeUndefined();
        expect(getB2R1RedoxReaction("OR-Zn-Cu2")).toBeUndefined();
        expect(getB2R1RedoxReaction("OR-Al-Cu2")).toBeUndefined();
        expect(getB2R1RedoxReaction("OR-Mg-Fe2")).toBeUndefined();
      });
    });

    describe("7.2 七条金属置换正例匹配与效果标签验证", () => {
      it("1) OR-Mg-Cu: Mg + Cu²⁺ → Mg²⁺ + Cu (标签：夺取 Cu²⁺；生成 Cu 资源/打断)", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Mg"],
          solutionIons: ["Cu2+"],
        });
        expect(res.matched).toBe(true);
        expect(res.success).toBe(true);
        expect(res.rowId).toBe("OR-Mg-Cu");
        expect(res.effectTags).toContain("seize_cu2_produce_cu");
        expect(res.effectZh).toBe("夺取 Cu²⁺；生成 Cu 资源/打断");
        expect(res.effectTagZh).toBe("夺取 Cu²⁺；生成 Cu 资源/打断");

        // 支持 Unicode 离子下标与中文反应物别名
        const resAlias = matchB2R1RedoxReaction({
          reactants: ["镁"],
          solutionIons: ["Cu²⁺"],
        });
        expect(resAlias.matched).toBe(true);
        expect(resAlias.rowId).toBe("OR-Mg-Cu");

        // 支持 solutionIon 单数入参
        const resSingleIon = matchB2R1RedoxReaction({
          reactants: ["Mg"],
          solutionIon: "Cu2+",
        });
        expect(resSingleIon.matched).toBe(true);
        expect(resSingleIon.rowId).toBe("OR-Mg-Cu");
      });

      it("2) OR-Zn-Cu: Zn + Cu²⁺ → Zn²⁺ + Cu (标签：夺取 Cu²⁺；生成 Cu 资源/打断)", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Zn"],
          solutionIons: ["Cu2+"],
        });
        expect(res.matched).toBe(true);
        expect(res.success).toBe(true);
        expect(res.rowId).toBe("OR-Zn-Cu");
        expect(res.effectTags).toContain("seize_cu2_produce_cu");
        expect(res.effectZh).toBe("夺取 Cu²⁺；生成 Cu 资源/打断");
      });

      it("3) OR-Fe-Cu: Fe + Cu²⁺ → Fe²⁺ + Cu (标签：夺取 Cu²⁺；生成 Cu 资源/打断，rowId 必为 OR-Fe-Cu)", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Fe"],
          solutionIons: ["Cu2+"],
        });
        expect(res.matched).toBe(true);
        expect(res.success).toBe(true);
        expect(res.rowId).toBe("OR-Fe-Cu");
        expect(res.rowId).not.toBe("OR-Fe-Cu2");
        expect(res.effectTags).toContain("seize_cu2_produce_cu");
        expect(res.effectZh).toBe("夺取 Cu²⁺；生成 Cu 资源/打断");
      });

      it("4) OR-Mg-Ag: Mg + 2Ag⁺ → Mg²⁺ + 2Ag (标签：银镜/沉淀链入口)", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Mg"],
          solutionIons: ["Ag+"],
        });
        expect(res.matched).toBe(true);
        expect(res.success).toBe(true);
        expect(res.rowId).toBe("OR-Mg-Ag");
        expect(res.effectTags).toContain("silver_mirror_precipitation_entry");
        expect(res.effectZh).toBe("银镜/沉淀链入口");
        expect(res.effectTagZh).toBe("银镜/沉淀链入口");
      });

      it("5) OR-Zn-Ag: Zn + 2Ag⁺ → Zn²⁺ + 2Ag (标签：银镜/沉淀链入口)", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Zn"],
          solutionIons: ["Ag+"],
        });
        expect(res.matched).toBe(true);
        expect(res.success).toBe(true);
        expect(res.rowId).toBe("OR-Zn-Ag");
        expect(res.effectTags).toContain("silver_mirror_precipitation_entry");
        expect(res.effectZh).toBe("银镜/沉淀链入口");
      });

      it("6) OR-Fe-Ag: Fe + 2Ag⁺ → Fe²⁺ + 2Ag (标签：银镜/沉淀链入口)", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Fe"],
          solutionIons: ["Ag+"],
        });
        expect(res.matched).toBe(true);
        expect(res.success).toBe(true);
        expect(res.rowId).toBe("OR-Fe-Ag");
        expect(res.effectTags).toContain("silver_mirror_precipitation_entry");
        expect(res.effectZh).toBe("银镜/沉淀链入口");
      });

      it("7) OR-Cu-Ag: Cu + 2Ag⁺ → Cu²⁺ + 2Ag (标签：AgNO₃ / Cl⁻ 检验联动，不实现检验)", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Cu"],
          solutionIons: ["Ag+"],
        });
        expect(res.matched).toBe(true);
        expect(res.success).toBe(true);
        expect(res.rowId).toBe("OR-Cu-Ag");
        expect(res.effectTags).toContain("agno3_cl_test_linkage");
        expect(res.effectZh).toBe("AgNO₃ / Cl⁻ 检验联动");
        expect(res.effectTagZh).toBe("AgNO₃ / Cl⁻ 检验联动");
        // 不实现 Cl- 检验联动逻辑
        expect((res as unknown as Record<string, unknown>).testResult).toBeUndefined();
      });

      it("多参数形式调用 matchB2R1RedoxReaction 也可正确匹配金属置换", () => {
        const res = matchB2R1RedoxReaction("Mg", "water", undefined, "Cu2+");
        expect(res.matched).toBe(true);
        expect(res.rowId).toBe("OR-Mg-Cu");
      });
    });

    describe("7.3 严格负例拦截锁（验收标准要求）", () => {
      it("P1: 完整 solution ion 输入必须属于命中行的白名单", () => {
        expect(
          matchB2R1RedoxReaction({
            reactants: ["Mg"],
            medium: "water",
            solutionIons: ["Cu2+", "Unknown+"],
          }).matched
        ).toBe(false);
        expect(
          matchB2R1RedoxReaction({
            reactants: ["Mg"],
            medium: "water",
            solutionIons: ["Cu2+", ""],
          }).matched
        ).toBe(false);
        expect(
          matchB2R1RedoxReaction({
            reactants: ["Mg"],
            medium: "water",
            solutionIons: ["Cu2+"],
            solutionIon: "Unknown+",
          }).matched
        ).toBe(false);
        expect(
          matchB2R1RedoxReaction({
            reactants: ["Mg"],
            medium: "dil_non_oxidizing_acid",
            solutionIons: ["Cu2+"],
          }).matched
        ).toBe(false);
        expect(
          matchB2R1RedoxReaction({
            reactants: ["Cu"],
            medium: "dil_hno3",
            solutionIons: ["Ag+"],
          }).matched
        ).toBe(false);
        expect(
          matchB2R1RedoxReaction({
            reactants: ["KMnO4"],
            medium: "conc_hcl",
            solutionIons: ["Unknown+"],
          }).matched
        ).toBe(false);

        expect(matchB2R1RedoxReaction({ reactants: ["Mg"], solutionIons: ["Cu2+"] })).toMatchObject({
          matched: true,
          rowId: "OR-Mg-Cu",
        });
        expect(matchB2R1RedoxReaction({ reactants: ["Cu"], medium: "dil_hno3" })).toMatchObject({
          matched: true,
          rowId: "OR-Cu-HNO3-dil",
        });
        expect(
          matchB2R1RedoxReaction({ reactants: ["Mg"], medium: "dil_non_oxidizing_acid" })
        ).toMatchObject({ matched: true, rowId: "OR-Mg-H" });
        expect(matchB2R1RedoxReaction({ reactants: ["KMnO4"], medium: "conc_hcl" })).toMatchObject({
          matched: true,
          rowId: "OR-KMnO4-HCl-conc",
        });
      });

      it("负例 1: 只有金属没有离子，不可靠金属单质自己配对成功", () => {
        // 在水介质中只有金属
        expect(matchB2R1RedoxReaction({ reactants: ["Mg"], medium: "water" }).matched).toBe(false);
        expect(matchB2R1RedoxReaction({ reactants: ["Zn"], medium: "water" }).matched).toBe(false);
        expect(matchB2R1RedoxReaction({ reactants: ["Fe"], medium: "water" }).matched).toBe(false);
        expect(matchB2R1RedoxReaction({ reactants: ["Cu"], medium: "water" }).matched).toBe(false);

        // 未传 medium 且无 solutionIons
        expect(matchB2R1RedoxReaction({ reactants: ["Mg"] }).matched).toBe(false);

        // 两个金属单质放入 reactants，无显式溶液离子入参
        const resTwoMetals = matchB2R1RedoxReaction({
          reactants: ["Mg", "Cu"],
          medium: "water",
        });
        expect(resTwoMetals.matched).toBe(false);
      });

      it("负例 2: Ag 金属置换 Cu²⁺ 判定失败（Ag 活动性低于 Cu）", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Ag"],
          solutionIons: ["Cu2+"],
        });
        expect(res.matched).toBe(false);
        expect(res.success).toBe(false);

        const resAlias = matchB2R1RedoxReaction({
          reactants: ["银"],
          solutionIons: ["Cu²⁺"],
        });
        expect(resAlias.matched).toBe(false);
      });

      it("负例 3: Cu 金属置换 Cu²⁺ 判定失败（同种金属不可置换）", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Cu"],
          solutionIons: ["Cu2+"],
        });
        expect(res.matched).toBe(false);
        expect(res.success).toBe(false);
      });

      it("负例 4: Al 置换 Cu²⁺ 判定失败（OR-Al-Cu2 不在 §3.3 白名单内）", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Al"],
          solutionIons: ["Cu2+"],
        });
        expect(res.matched).toBe(false);
        expect(res.success).toBe(false);
      });

      it("负例 5: 未列组合判定失败（未列出的组合不因现实化学常识成立）", () => {
        // Al 置换 Ag⁺（未列入 §3.3）
        expect(
          matchB2R1RedoxReaction({
            reactants: ["Al"],
            solutionIons: ["Ag+"],
          }).matched
        ).toBe(false);

        // Mg 置换 Fe²⁺（OR-Mg-Fe2 本刀禁止新增）
        expect(
          matchB2R1RedoxReaction({
            reactants: ["Mg"],
            solutionIons: ["Fe2+"],
          }).matched
        ).toBe(false);

        // Zn 置换 Zn²⁺
        expect(
          matchB2R1RedoxReaction({
            reactants: ["Zn"],
            solutionIons: ["Zn2+"],
          }).matched
        ).toBe(false);

        // 未收录单质金属（如 Au）置换 Cu²⁺
        expect(
          matchB2R1RedoxReaction({
            reactants: ["Au"],
            solutionIons: ["Cu2+"],
          }).matched
        ).toBe(false);
      });
    });

    describe("7.4 旧行不回归锁（验收标准要求）", () => {
      it("Cu + dil_hno3 必须仍是 OR-Cu-HNO3-dil (matched=true, 氮氧化物刺激)", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Cu"],
          medium: "dil_hno3",
        });
        expect(res.matched).toBe(true);
        expect(res.success).toBe(true);
        expect(res.rowId).toBe("OR-Cu-HNO3-dil");
        expect(res.statusNameZh).toBe("氮氧化物刺激");
      });

      it("Cu + dil_non_oxidizing_acid 必须仍是 OR-Cu-H 不反应 (matched=false, isNoReaction=true)", () => {
        const res = matchB2R1RedoxReaction({
          reactants: ["Cu"],
          medium: "dil_non_oxidizing_acid",
        });
        expect(res.matched).toBe(false);
        expect(res.success).toBe(false);
        expect(res.rowId).toBe("OR-Cu-H");
        expect(res.isNoReaction).toBe(true);
        expect(res.effectZh).toBe("不反应");
      });
    });
  });

  describe("8. §3.4 卤素置换数据合同", () => {
    it("独立产物标签、定义和嵌套数组均为冻结的静态数据", () => {
      expect(B2R1_HALOGEN_PRODUCT_TAGS).toEqual(["produce_br2_card_or_status", "produce_i2"]);
      expect(B2R1_HALOGEN_PRODUCT_TAGS).toEqual([B2R1_PRODUCT_TAG_BR2, B2R1_PRODUCT_TAG_I2]);
      expect(Object.isFrozen(B2R1_HALOGEN_PRODUCT_TAGS)).toBe(true);
      expect(Object.isFrozen(B2R1_HALOGEN_PRODUCT_TAG_DEFINITIONS)).toBe(true);
      expect(B2R1_HALOGEN_PRODUCT_TAG_DEFINITIONS).toEqual({
        produce_br2_card_or_status: B2R1_PRODUCT_TAG_DEFINITION_BR2,
        produce_i2: B2R1_PRODUCT_TAG_DEFINITION_I2,
      });
      for (const definition of Object.values(B2R1_HALOGEN_PRODUCT_TAG_DEFINITIONS)) {
        expect(Object.isFrozen(definition)).toBe(true);
        expect(definition.nameZh.length).toBeGreaterThan(0);
        expect(definition.nameEn.length).toBeGreaterThan(0);
      }
      expect(Object.isFrozen(B2R1_REDOX_REACTION_ROWS)).toBe(true);
      for (const row of B2R1_REDOX_REACTION_ROWS.slice(16)) {
        expect(Object.isFrozen(row)).toBe(true);
        expect(Object.isFrozen(row.reactants)).toBe(true);
        expect(Object.isFrozen(row.solutionIons)).toBe(true);
        expect(row.medium).toBe("water");
        expect(row.effectTags).toBeUndefined();
        expect(row.effectTagZh).toBeUndefined();
        if (!row.isNoReaction) {
          expect(row.productTags).toHaveLength(1);
          expect(Object.isFrozen(row.productTags)).toBe(true);
        } else {
          expect(row.productTags).toBeUndefined();
        }
        for (const field of ["deck", "drawPile", "hand", "cardInstance", "generateCard", "status"]) {
          expect(row).not.toHaveProperty(field);
        }
      }
    });

    it.each([
      ["Cl2", "Br-", "OR-Cl2-Br", "Cl₂ + 2Br⁻ → 2Cl⁻ + Br₂", "produce_br2_card_or_status", "生成 Br₂ 卡或状态"],
      ["Cl₂", "I⁻", "OR-Cl2-I", "Cl₂ + 2I⁻ → 2Cl⁻ + I₂", "produce_i2", "生成 I₂"],
      ["Br2", "I-", "OR-Br2-I", "Br₂ + 2I⁻ → 2Br⁻ + I₂", "produce_i2", "生成 I₂"],
      ["Br₂", "I⁻", "OR-Br2-I", "Br₂ + 2I⁻ → 2Br⁻ + I₂", "produce_i2", "生成 I₂"],
    ])("%s + %s 只返回静态产物 metadata", (reactant, ion, rowId, equation, tag, label) => {
      const input = Object.freeze({
        reactants: Object.freeze([reactant]),
        medium: "water",
        solutionIons: Object.freeze([ion]),
      });
      const result = matchB2R1RedoxReaction(input);
      expect(result).toMatchObject({
        matched: true, success: true, rowId,
        solutionIon: normalizeIonId(ion), solutionIons: [normalizeIonId(ion)],
        productTags: [tag], productTagZh: label, effectZh: label,
        reaction: { equation },
      });
      expect(result.reaction).toBe(getB2R1RedoxReaction(rowId));
      expect(result.effectTags).toBeUndefined();
      expect(matchB2R1RedoxReaction(reactant, "water", undefined, ion)).toEqual(result);
      expect(matchB2R1RedoxReaction({ reactant, solutionIon: ion })).toEqual(result);
      expect(input.reactants).toEqual([reactant]);
      expect(input.solutionIons).toEqual([ion]);
    });

    it.each(["Cl2", "Cl₂"])("%s + F⁻ 保留显式不反应且 overload 一致", (reactant) => {
      const result = matchB2R1RedoxReaction({ reactant, solutionIon: "F⁻" });
      expect(result).toMatchObject({
        matched: false, success: false, rowId: "OR-Cl2-F", isNoReaction: true,
        reaction: { equation: "Cl₂ + F⁻", solutionIon: "F-", isNoReaction: true },
      });
      expect(result.reaction).toBe(getB2R1RedoxReaction("OR-Cl2-F"));
      expect(matchB2R1RedoxReaction(reactant, "water", undefined, "F-")).toEqual(result);
    });

    it.each([
      ["Cl2", "Cl-"], ["Br2", "Br-"], ["Br2", "F-"], ["Br2", "Cl-"],
      ["I2", "Br-"], ["I2", "Cl-"], ["I2", "F-"], ["I2", "I-"],
      ["F2", "Cl-"], ["F2", "Br-"], ["F2", "I-"], ["F2", "F-"],
      ["Mg", "Br-"], ["Cl-", "Br-"], ["Cl2", "Cu2+"],
    ])("未冻结组合 %s + %s 不得泛化", (reactant, solutionIon) => {
      const result = matchB2R1RedoxReaction({ reactant, solutionIon });
      expect(result).toMatchObject({ matched: false, success: false });
      expect(result.rowId).toBeUndefined();
      expect(result.reaction).toBeUndefined();
    });

    it.each([
      ["Br-", "Unknown+"], ["Br-", ""], ["Br-", "   "],
      ["Br-", "I-"], ["Br-", "Br-"],
    ])("拒绝完整多组件输入 %j / %j", (...solutionIons) => {
      const input = Object.freeze({
        reactant: "Cl2", solutionIons: Object.freeze(solutionIons),
      });
      for (const result of [
        matchB2R1RedoxReaction(input),
        matchB2R1RedoxReaction("Cl2", "water", undefined, solutionIons),
      ]) {
        expect(result).toMatchObject({ matched: false, success: false });
        expect(result.rowId).toBeUndefined();
        expect(result.reaction).toBeUndefined();
      }
    });

    it("同时检查单数和复数离子字段，空数组仍为零额外组件", () => {
      const result = matchB2R1RedoxReaction({
        reactant: "Cl2", solutionIon: "Br-", solutionIons: ["I-"],
      });
      expect(result).toMatchObject({ matched: false, success: false });
      expect(result.rowId).toBeUndefined();
      expect(matchB2R1RedoxReaction({
        reactant: "Cl2", solutionIon: "Br-", solutionIons: [],
      }).rowId).toBe("OR-Cl2-Br");
      expect(matchB2R1RedoxReaction({ reactant: "Cl2", solutionIons: [] }).rowId).toBeUndefined();
    });

    it.each(["Br-", "Br⁻", "I-", "I⁻", "F-", "F⁻"])("复用 normalizeIonId: %s", (ion) => {
      expect(normalizeIonId(ion)).toBe(ion.replace("⁻", "-"));
    });
  });
});
