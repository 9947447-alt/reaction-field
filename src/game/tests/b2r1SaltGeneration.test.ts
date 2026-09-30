import { describe, expect, it } from "vitest";
import {
  B2R1_ALL_ION_DEFINITIONS,
  B2R1_ANION_DEFINITIONS,
  B2R1_CATION_DEFINITIONS,
  B2R1_SALT_CATALOG,
  calculateSaltStoichiometry,
  generateSalt,
  getB2R1Ion,
  getB2R1SaltByFormula,
  isB2R1Anion,
  isB2R1Cation,
  normalizeIonId,
  validateAndGenerateSalt,
} from "../data/b2r1";

describe("Phase 22 B2-R1 离子与盐数据规范及纯函数生成", () => {
  describe("1. 离子表定义与元数据 (§2.1, §2.2)", () => {
    it("阳离子列表恰好包含 13 种，且元数据完整", () => {
      expect(B2R1_CATION_DEFINITIONS).toHaveLength(13);
      const expectedCationIds = [
        "H+",
        "NH4+",
        "Na+",
        "K+",
        "Ca2+",
        "Mg2+",
        "Ba2+",
        "Al3+",
        "Fe2+",
        "Fe3+",
        "Zn2+",
        "Cu2+",
        "Ag+",
      ];
      const actualIds = B2R1_CATION_DEFINITIONS.map((c) => c.id);
      expect(actualIds).toEqual(expectedCationIds);

      for (const cation of B2R1_CATION_DEFINITIONS) {
        expect(cation.kind).toBe("cation");
        expect(cation.charge).toBeGreaterThan(0);
        expect(cation.nameZh.length).toBeGreaterThan(0);
        expect(cation.nameEn.length).toBeGreaterThan(0);
        expect(cation.typicalUses.length).toBeGreaterThan(0);
        expect(isB2R1Cation(cation.id)).toBe(true);
        expect(isB2R1Anion(cation.id)).toBe(false);
      }
    });

    it("阴离子列表恰好包含 8 种（5 种常规 + 3 种卤素扩展）", () => {
      expect(B2R1_ANION_DEFINITIONS).toHaveLength(8);
      const expectedAnionIds = [
        "OH-",
        "Cl-",
        "NO3-",
        "CO32-",
        "SO42-",
        "F-",
        "Br-",
        "I-",
      ];
      const actualIds = B2R1_ANION_DEFINITIONS.map((a) => a.id);
      expect(actualIds).toEqual(expectedAnionIds);

      for (const anion of B2R1_ANION_DEFINITIONS) {
        expect(anion.kind).toBe("anion");
        expect(anion.charge).toBeLessThan(0);
        expect(anion.nameZh.length).toBeGreaterThan(0);
        expect(anion.nameEn.length).toBeGreaterThan(0);
        expect(anion.typicalUses.length).toBeGreaterThan(0);
        expect(isB2R1Anion(anion.id)).toBe(true);
        expect(isB2R1Cation(anion.id)).toBe(false);
      }
    });

    it("离子总表包含全部 21 种离子且 ID 无冲突", () => {
      expect(B2R1_ALL_ION_DEFINITIONS).toHaveLength(21);
      const ids = B2R1_ALL_ION_DEFINITIONS.map((i) => i.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(21);
    });

    it("支持别名和 Unicode 上标形式标准化", () => {
      expect(normalizeIonId("CO3^2-")).toBe("CO32-");
      expect(normalizeIonId("SO4^2-")).toBe("SO42-");
      expect(normalizeIonId("SO₄²⁻")).toBe("SO42-");
      expect(normalizeIonId("Ag⁺")).toBe("Ag+");

      const ion = getB2R1Ion("SO4^2-");
      expect(ion).toBeDefined();
      expect(ion?.id).toBe("SO42-");
      expect(ion?.nameZh).toBe("硫酸根离子");
    });
  });

  describe("2. 化学计量比纯函数 calculateSaltStoichiometry", () => {
    it("正确计算 1:1, 1:2, 2:1, 1:3, 2:3 等经典化学计量比", () => {
      // 1:1 (Na+ + Cl-)
      expect(calculateSaltStoichiometry(1, -1)).toEqual({
        cationCount: 1,
        anionCount: 1,
      });
      // 2:1 (2Ag+ + SO42-)
      expect(calculateSaltStoichiometry(1, -2)).toEqual({
        cationCount: 2,
        anionCount: 1,
      });
      // 1:2 (Ba2+ + 2Cl-)
      expect(calculateSaltStoichiometry(2, -1)).toEqual({
        cationCount: 1,
        anionCount: 2,
      });
      // 1:1 (Ba2+ + SO42-)
      expect(calculateSaltStoichiometry(2, -2)).toEqual({
        cationCount: 1,
        anionCount: 1,
      });
      // 1:3 (Al3+ + 3Cl-)
      expect(calculateSaltStoichiometry(3, -1)).toEqual({
        cationCount: 1,
        anionCount: 3,
      });
      // 2:3 (2Al3+ + 3SO42-)
      expect(calculateSaltStoichiometry(3, -2)).toEqual({
        cationCount: 2,
        anionCount: 3,
      });
    });

    it("对非正阳离子电荷或零阴离子电荷抛出异常", () => {
      expect(() => calculateSaltStoichiometry(0, -1)).toThrow();
      expect(() => calculateSaltStoichiometry(-1, -1)).toThrow();
      expect(() => calculateSaltStoichiometry(1, 0)).toThrow();
    });
  });

  describe("3. 硫酸银 Ag2SO4 强制生成覆盖与规范锁死 (§2.3)", () => {
    it("强制生成微溶物 Ag2SO4 盐卡，化学计量比为 2:1", () => {
      const result = generateSalt("Ag+", "SO42-");
      expect(result.success).toBe(true);
      if (!result.success) return;

      const { salt } = result;
      expect(salt.id).toBe("substance_ag2so4");
      expect(salt.formula).toBe("Ag2SO4");
      expect(salt.displayFormula).toBe("Ag₂SO₄");
      expect(salt.nameZh).toBe("硫酸银");
      expect(salt.nameEn).toBe("Silver sulfate");
      expect(salt.cation).toBe("Ag+");
      expect(salt.anion).toBe("SO42-");
      expect(salt.cationCount).toBe(2);
      expect(salt.anionCount).toBe(1);
      expect(salt.solubility).toBe("slightly_soluble");
      expect(salt.isPrecipitate).toBe(true);
      expect(salt.tags).toContain("slightly_soluble");
    });

    it("支持常见格式别名输入生成 Ag2SO4 (如 Ag⁺ + SO4^2-)", () => {
      const result = generateSalt("Ag⁺", "SO4^2-");
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.salt.formula).toBe("Ag2SO4");
    });

    it("validateAndGenerateSalt 校验准确的 2 张 Ag+ 和 1 张 SO42- 组件", () => {
      const valid = validateAndGenerateSalt({
        cationId: "Ag+",
        cationCount: 2,
        anionId: "SO42-",
        anionCount: 1,
      });
      expect(valid.success).toBe(true);
      if (!valid.success) return;
      expect(valid.salt.formula).toBe("Ag2SO4");
    });

    it("validateAndGenerateSalt 拒绝不满足 2:1 比例的 Ag/SO4 组件", () => {
      const invalidCount1 = validateAndGenerateSalt({
        cationId: "Ag+",
        cationCount: 1,
        anionId: "SO42-",
        anionCount: 1,
      });
      expect(invalidCount1.success).toBe(false);
      if (!invalidCount1.success) {
        expect(invalidCount1.reason).toContain("化学计量比不匹配");
      }

      const invalidCount2 = validateAndGenerateSalt({
        cationId: "Ag+",
        cationCount: 3,
        anionId: "SO42-",
        anionCount: 2,
      });
      expect(invalidCount2.success).toBe(false);
    });
  });

  describe("4. 白名单全部 39 种盐定义及生成覆盖 (§2.3)", () => {
    it("白名单中恰好收录 39 种盐", () => {
      expect(B2R1_SALT_CATALOG).toHaveLength(39);
      const uniqueFormulas = new Set(B2R1_SALT_CATALOG.map((s) => s.formula));
      expect(uniqueFormulas.size).toBe(39);
    });

    it("每一条白名单盐均可通过 generateSalt 纯函数生成", () => {
      for (const salt of B2R1_SALT_CATALOG) {
        const result = generateSalt(salt.cation, salt.anion);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.salt.formula).toBe(salt.formula);
          expect(result.salt.cationCount).toBe(salt.cationCount);
          expect(result.salt.anionCount).toBe(salt.anionCount);
        }
      }
    });

    it("支持根据化学式或 ID 查询盐静态定义", () => {
      expect(getB2R1SaltByFormula("NaCl")?.nameZh).toBe("氯化钠");
      expect(getB2R1SaltByFormula("BaSO₄")?.nameZh).toBe("硫酸钡");
      expect(getB2R1SaltByFormula("substance_al2_so4_3")?.formula).toBe("Al2(SO4)3");
      expect(getB2R1SaltByFormula("Ag2SO4")?.nameZh).toBe("硫酸银");
    });
  });

  describe("5. 非法配对与异常拦截回归测试", () => {
    it("拦截酸介质核心 H+（不可用于盐构建，应走酸 DIY）", () => {
      const result = generateSalt("H+", "Cl-");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toContain("H+ 为酸性介质核心");
      }
    });

    it("拦截碱介质核心 OH-（不可用于盐构建，应走碱 DIY）", () => {
      const result = generateSalt("Na+", "OH-");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toContain("OH- 为碱性介质核心");
      }
    });

    it("拦截同极性配对（两个阳离子或两个阴离子）", () => {
      const twoCations = generateSalt("Na+", "K+");
      expect(twoCations.success).toBe(false);

      const twoAnions = generateSalt("Cl-", "SO42-");
      expect(twoAnions.success).toBe(false);
    });

    it("拦截水溶液双水解/未收录白名单配对（如 Fe3+ + CO32-、Al3+ + CO32-）", () => {
      const fe3Co3 = generateSalt("Fe3+", "CO32-");
      expect(fe3Co3.success).toBe(false);
      if (!fe3Co3.success) {
        expect(fe3Co3.reason).toContain("不在 B2-R1 §2.3 盐构建白名单表中");
      }

      const al3Co3 = generateSalt("Al3+", "CO32-");
      expect(al3Co3.success).toBe(false);
    });

    it("拦截未在首包盐构建白名单开放的卤素配对（如 F-、Br-、I- 构建盐）", () => {
      expect(generateSalt("Na+", "F-").success).toBe(false);
      expect(generateSalt("K+", "Br-").success).toBe(false);
      expect(generateSalt("Ag+", "I-").success).toBe(false);
    });

    it("拦截未知离子符号", () => {
      expect(generateSalt("Unknown+", "Cl-").success).toBe(false);
      expect(generateSalt("Na+", "Invalid-").success).toBe(false);
    });

    it("拦截非正整数的组件张数请求", () => {
      const zeroCation = validateAndGenerateSalt({
        cationId: "Na+",
        cationCount: 0,
        anionId: "Cl-",
        anionCount: 1,
      });
      expect(zeroCation.success).toBe(false);

      const floatAnion = validateAndGenerateSalt({
        cationId: "Na+",
        cationCount: 1,
        anionId: "Cl-",
        anionCount: 1.5,
      });
      expect(floatAnion.success).toBe(false);
    });
  });

  describe("6. 数据结构只读与不可变性保证", () => {
    it("B2R1 静态集合已被冻结，禁止运行时篡改", () => {
      expect(Object.isFrozen(B2R1_CATION_DEFINITIONS)).toBe(true);
      expect(Object.isFrozen(B2R1_ANION_DEFINITIONS)).toBe(true);
      expect(Object.isFrozen(B2R1_SALT_CATALOG)).toBe(true);

      const ag2so4 = getB2R1SaltByFormula("Ag2SO4");
      expect(ag2so4).toBeDefined();
      if (ag2so4) {
        expect(Object.isFrozen(ag2so4)).toBe(true);
        expect(Object.isFrozen(ag2so4.tags)).toBe(true);
      }
    });
  });
});
