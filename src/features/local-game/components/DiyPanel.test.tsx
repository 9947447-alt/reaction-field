// @vitest-environment happy-dom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider, LocaleSwitch } from "../../../app/locale";
import type { GameAction } from "../../../game/engine/actions";
import { createInitialGame } from "../../../game/engine/createInitialGame";
import type { CardInstance, GameState } from "../../../game/engine/types";
import { identityShuffle } from "../../../shared/random";
import { DiyPanel } from "./DiyPanel";

function createTestGame(): GameState {
  const base = createInitialGame({
    characterIds: ["chemical_factory_ceo", "acid_king"],
    shuffle: identityShuffle,
  });

  const cardInstances: Record<string, CardInstance> = {
    ...base.cardInstances,
    c_card_1: {
      id: "c_card_1",
      definitionId: "element_c",
      ownerId: "player_1",
      zone: { type: "hand", playerId: "player_1" },
    },
    o_card_1: {
      id: "o_card_1",
      definitionId: "element_o",
      ownerId: "player_1",
      zone: { type: "hand", playerId: "player_1" },
    },
    o_card_2: {
      id: "o_card_2",
      definitionId: "element_o",
      ownerId: "player_1",
      zone: { type: "hand", playerId: "player_1" },
    },
    h_card_1: {
      id: "h_card_1",
      definitionId: "ion_h",
      ownerId: "player_1",
      zone: { type: "hand", playerId: "player_1" },
    },
    cl_card_1: {
      id: "cl_card_1",
      definitionId: "ion_cl",
      ownerId: "player_1",
      zone: { type: "hand", playerId: "player_1" },
    },
    substance_card_1: {
      id: "substance_card_1",
      definitionId: "substance_hcl_dilute",
      ownerId: "player_1",
      zone: { type: "hand", playerId: "player_1" },
    },
  };

  const players = base.players.map((p) => {
    if (p.id === "player_1") {
      return {
        ...p,
        hand: [
          "h_card_1",
          "cl_card_1",
          "c_card_1",
          "o_card_1",
          "o_card_2",
          "substance_card_1",
        ],
      };
    }
    return p;
  });

  return {
    ...base,
    cardInstances,
    players,
    phase: "mainAction",
    activePlayerId: "player_1",
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis.navigator, "language", {
    configurable: true,
    value: "zh-CN",
  });
  Object.defineProperty(globalThis.navigator, "languages", {
    configurable: true,
    value: ["zh-CN"],
  });
});

describe("Selection-First DiyPanel Component", () => {
  it("renders only diy-component cards and excludes ordinary substance cards", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const game = createTestGame();
    const dispatch = vi.fn();

    try {
      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(DiyPanel, { game, dispatchGameAction: dispatch }),
          ),
        );
      });

      const candidateCards = container.querySelectorAll(".candidate-card");
      // h, cl, c, o1, o2 are diy-components (5 cards), substance_hcl_dilute is not
      expect(candidateCards.length).toBe(5);
      const submitButton = container.querySelector('button.primary-button') as HTMLButtonElement;
      expect(submitButton).not.toBeNull();
      expect(submitButton.disabled).toBe(true);
      expect(container.textContent).toContain("请在下方点选手牌中的组件卡牌组合出牌。");
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it("handles multi-selection, toggling, and clear selection", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const game = createTestGame();
    const dispatch = vi.fn();

    try {
      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(DiyPanel, { game, dispatchGameAction: dispatch }),
          ),
        );
      });

      const buttons = Array.from(
        container.querySelectorAll(".candidate-card"),
      ) as HTMLButtonElement[];
      const hButton = buttons.find((b) => b.textContent?.includes("h_card_1"));
      const clButton = buttons.find((b) => b.textContent?.includes("cl_card_1"));
      expect(hButton).toBeDefined();
      expect(clButton).toBeDefined();

      // Click H+
      await act(async () => {
        hButton?.click();
      });
      expect(hButton?.getAttribute("aria-pressed")).toBe("true");
      expect(hButton?.classList.contains("is-selected")).toBe(true);
      expect(container.textContent).toContain("当前所选组合暂无可执行 DIY 配方。");

      // Click Cl- -> matches dilute HCl
      await act(async () => {
        clButton?.click();
      });
      expect(clButton?.getAttribute("aria-pressed")).toBe("true");
      expect(container.textContent).toContain("匹配配方：");
      expect(container.textContent).toContain("生成虚拟产品 稀 HCl");
      expect(container.textContent).toContain("对 玩家 B 造成 1 点酸性伤害（等待响应）");

      const submitButton = container.querySelector("button.primary-button") as HTMLButtonElement;
      expect(submitButton.disabled).toBe(false);

      // Unselect Cl-
      await act(async () => {
        clButton?.click();
      });
      expect(clButton?.getAttribute("aria-pressed")).toBe("false");
      expect(submitButton.disabled).toBe(true);

      // Clear selection
      const clearButton = Array.from(
        container.querySelectorAll("button"),
      ).find((b) => b.textContent?.includes("清空选择"));
      expect(clearButton).toBeDefined();
      await act(async () => {
        clearButton?.click();
      });
      expect(hButton?.getAttribute("aria-pressed")).toBe("false");
      expect(container.textContent).toContain("请在下方点选手牌中的组件卡牌组合出牌。");
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it("submits PLAY_DIY_SELECTION action without recipeId and clears selection on success", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const game = createTestGame();
    const actions: GameAction[] = [];
    const dispatch = vi.fn((action: GameAction) => {
      actions.push(action);
    });

    try {
      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(DiyPanel, { game, dispatchGameAction: dispatch }),
          ),
        );
      });

      const buttons = Array.from(
        container.querySelectorAll(".candidate-card"),
      ) as HTMLButtonElement[];
      const hButton = buttons.find((b) => b.textContent?.includes("h_card_1"));
      const clButton = buttons.find((b) => b.textContent?.includes("cl_card_1"));

      await act(async () => {
        hButton?.click();
        clButton?.click();
      });

      const submitButton = container.querySelector("button.primary-button") as HTMLButtonElement;
      expect(submitButton.disabled).toBe(false);

      await act(async () => {
        submitButton.click();
      });

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(actions[0]).toEqual({
        type: "PLAY_DIY_SELECTION",
        playerId: "player_1",
        componentCardInstanceIds: ["h_card_1", "cl_card_1"],
        targetPlayerId: "player_2",
      });
      // Verification: recipeId must not be present in formal action
      expect("recipeId" in (actions[0] as unknown as Record<string, unknown>)).toBe(false);

      // Selection state should be reset
      expect(hButton?.getAttribute("aria-pressed")).toBe("false");
      expect(clButton?.getAttribute("aria-pressed")).toBe("false");
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it("handles Fire extinction recipes correctly: blocked when no fire, executable when player has fire", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const gameWithoutFire = createTestGame();
    const gameWithFire: GameState = {
      ...gameWithoutFire,
      players: gameWithoutFire.players.map((p) =>
        p.id === "player_1"
          ? {
              ...p,
              statuses: [
                {
                  id: "fire_1",
                  statusId: "FIRE" as const,
                  createdAt: 1,
                },
              ],
            }
          : p,
      ),
    };
    const dispatch = vi.fn();

    try {
      // 1. Without FIRE: C + O + O matches CO2 but is blocked with OWN_FIRE_REQUIRED
      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(DiyPanel, { game: gameWithoutFire, dispatchGameAction: dispatch }),
          ),
        );
      });

      const buttons = Array.from(
        container.querySelectorAll(".candidate-card"),
      ) as HTMLButtonElement[];
      const cButton = buttons.find((b) => b.textContent?.includes("c_card_1"));
      const o1Button = buttons.find((b) => b.textContent?.includes("o_card_1"));
      const o2Button = buttons.find((b) => b.textContent?.includes("o_card_2"));

      await act(async () => {
        cButton?.click();
        o1Button?.click();
        o2Button?.click();
      });

      expect(container.textContent).toContain("匹配配方：");
      expect(container.textContent).toContain("需自身处于火情状态方可灭火");
      expect(container.textContent).toContain("此配方不需要选择目标。");
      const submitButton = container.querySelector("button.primary-button") as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);

      // 2. With FIRE: C + O + O is EXECUTABLE
      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(DiyPanel, { game: gameWithFire, dispatchGameAction: dispatch }),
          ),
        );
      });

      // Since cards are already selected, it should immediately be EXECUTABLE upon receiving gameWithFire
      expect(container.textContent).toContain("执行效果：移除自身火情状态 (CO2)");
      const submitButtonFire = container.querySelector("button.primary-button") as HTMLButtonElement;
      expect(submitButtonFire.disabled).toBe(false);
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });


  it("disables all controls during AI turn", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const game = createTestGame();
    const dispatch = vi.fn();

    try {
      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(DiyPanel, {
              game,
              playerControllers: ["ai", "human"],
              dispatchGameAction: dispatch,
            }),
          ),
        );
      });

      const candidateCards = Array.from(
        container.querySelectorAll(".candidate-card"),
      ) as HTMLButtonElement[];
      for (const btn of candidateCards) {
        expect(btn.disabled).toBe(true);
      }

      const submitButton = container.querySelector("button.primary-button") as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it("supports dynamic in-place bilingual switching", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const game = createTestGame();
    const dispatch = vi.fn();

    try {
      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(LocaleSwitch),
            createElement(DiyPanel, { game, dispatchGameAction: dispatch }),
          ),
        );
      });

      expect(container.textContent).toContain("主动 DIY");
      expect(container.textContent).toContain("手牌组件卡");
      expect(container.textContent).toContain("执行主动 DIY");

      const englishButton = Array.from(
        container.querySelectorAll(".locale-switch__button"),
      ).find((b) => b.textContent === "English") as HTMLButtonElement;
      expect(englishButton).toBeDefined();

      await act(async () => {
        englishButton.click();
      });

      expect(container.textContent).toContain("Active DIY");
      expect(container.textContent).toContain("Hand component cards");
      expect(container.textContent).toContain("Run active DIY");
      expect(container.textContent).toContain("Select component cards from your hand to craft.");
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});
