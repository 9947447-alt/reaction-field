// @vitest-environment happy-dom

import { StrictMode, act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { LocalGamePage } from "./LocalGamePage";
import { createInitialGame } from "../../game/engine/createInitialGame";
import { identityShuffle } from "../../shared/random";
import type { LocalGameFactory } from "./localGameSession";
import type { NATBAPolicy } from "../../game/natba/types";
import type { AIObservation } from "../../game/engine/aiObservation";
import { LocaleProvider } from "../../app/locale";
import { natba0RandomLegalPolicy } from "../../game/natba/natba0Policy";
import { natba1HeuristicPolicy } from "../../game/natba/natba1HeuristicPolicy";

const deterministicGameFactory: LocalGameFactory = (characterIds) =>
  createInitialGame({
    characterIds: [characterIds[0], characterIds[1]],
    shuffle: identityShuffle,
  });

describe("Phase 19F — Solo vs NATBA-1 Session Integration", () => {
  it("defaults to Human vs NATBA AI in configuration, allows switching to local two-player, and renders lineup summary", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          <StrictMode>
            <LocalGamePage
              createGame={deterministicGameFactory}
              aiDelayMs={0}
            />
          </StrictMode>,
        );
      });

      const controllerSelects = container.querySelectorAll(
        "select[aria-label*='controller'], select[aria-label*='控制方']",
      );
      expect(controllerSelects).toHaveLength(2);

      // Default is Solo vs AI
      expect(container.textContent).toContain("玩家 A (人类)");
      expect(container.textContent).toContain("玩家 B (NATBA AI)");
      expect(container.querySelector("h1")?.textContent).toBe("反应域 · 本地人机角色选择");

      // Switch to local two-player via mode selector
      const modeSelect = container.querySelector(
        "select[aria-label*='mode'], select[aria-label*='模式']",
      ) as HTMLSelectElement;
      expect(modeSelect).toBeDefined();

      await act(async () => {
        modeSelect.value = "two_player";
        modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      });

      expect(container.textContent).toContain("玩家 A (人类)");
      expect(container.textContent).toContain("玩家 B (人类)");
      expect(container.querySelector("h1")?.textContent).toBe("反应域 · 本地双人角色选择");

      // Switch back to Solo vs AI
      await act(async () => {
        modeSelect.value = "solo_ai";
        modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      });

      expect(container.textContent).toContain("玩家 B (NATBA AI)");
      expect(container.querySelector("h1")?.textContent).toBe("反应域 · 本地人机角色选择");
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it("ensures AI decision policy only receives fair AIObservation without opponent hand contents", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    const receivedObservations: AIObservation[] = [];
    const spyPolicy: NATBAPolicy = (observation, context, random) => {
      receivedObservations.push(observation);
      return natba1HeuristicPolicy(observation, context, random);
    };

    try {
      await act(async () => {
        root.render(
          <StrictMode>
            <LocalGamePage
              createGame={deterministicGameFactory}
              policy={spyPolicy}
              aiDelayMs={0}
            />
          </StrictMode>,
        );
      });

      const controllerSelects = container.querySelectorAll(
        "select[aria-label*='controller'], select[aria-label*='控制方']",
      );
      const playerBControllerSelect = controllerSelects[1] as HTMLSelectElement;
      await act(async () => {
        playerBControllerSelect.value = "ai";
        playerBControllerSelect.dispatchEvent(new Event("change", { bubbles: true }));
      });

      const startButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("开始游戏"),
      );

      await act(async () => {
        startButton?.click();
      });

      expect(container.textContent).toContain("实验室老师 · 备课");
      expect(container.textContent).toContain("本地人机公开对局");

      const candidateButtons = container.querySelectorAll(".preparation-candidate-grid button.debug-card__select");
      expect(candidateButtons.length).toBe(20);

      await act(async () => {
        for (let i = 0; i < 10; i += 1) {
          (candidateButtons[i] as HTMLButtonElement).click();
        }
      });

      const confirmPrepButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("确认备课选择"),
      );
      expect(confirmPrepButton).toBeDefined();

      await act(async () => {
        confirmPrepButton?.click();
      });

      const passActionButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("结束本次行动"),
      );
      expect(passActionButton).toBeDefined();

      await act(async () => {
        passActionButton?.click();
      });

      expect(receivedObservations.length).toBeGreaterThan(0);
      for (const obs of receivedObservations) {
        expect(obs.viewerPlayerId).toBe("player_2");
        expect(obs.self.playerId).toBe("player_2");
        expect(obs.self.handCards.length).toBeGreaterThan(0);

        for (const opp of obs.opponents) {
          expect(opp.playerId).toBe("player_1");
          expect(opp.handCount).toBeGreaterThanOrEqual(0);
          expect((opp as any).hand).toBeUndefined();
          expect((opp as any).handCards).toBeUndefined();
        }
      }
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it("defaults to NATBA-1.x policy when no policy prop is provided", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          <StrictMode>
            <LocalGamePage
              createGame={deterministicGameFactory}
              aiDelayMs={0}
            />
          </StrictMode>,
        );
      });

      const controllerSelects = container.querySelectorAll(
        "select[aria-label*='controller'], select[aria-label*='控制方']",
      );
      const playerBControllerSelect = controllerSelects[1] as HTMLSelectElement;
      await act(async () => {
        playerBControllerSelect.value = "ai";
        playerBControllerSelect.dispatchEvent(new Event("change", { bubbles: true }));
      });

      const startButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("开始游戏"),
      );

      await act(async () => {
        startButton?.click();
      });

      const candidateButtons = container.querySelectorAll(".preparation-candidate-grid button.debug-card__select");
      await act(async () => {
        for (let i = 0; i < 10; i += 1) {
          (candidateButtons[i] as HTMLButtonElement).click();
        }
      });

      const confirmPrepButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("确认备课选择"),
      );
      await act(async () => {
        confirmPrepButton?.click();
      });

      // Player A ends turn, Player B (default NATBA-1.x AI) executes automatically
      const passActionButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("结束本次行动"),
      );
      await act(async () => {
        passActionButton?.click();
      });

      // No error banner; game progressed cleanly under NATBA-1.x default
      expect(container.querySelector(".error-banner")).toBeNull();
      expect(container.textContent).toContain("本地人机公开对局");
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it("preserves baseline NATBA-0 random legal policy when explicitly injected", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    let natba0Invoked = 0;
    const injectedNatba0: NATBAPolicy = (observation, context, random) => {
      natba0Invoked += 1;
      return natba0RandomLegalPolicy(observation, context, random);
    };

    try {
      await act(async () => {
        root.render(
          <StrictMode>
            <LocalGamePage
              createGame={deterministicGameFactory}
              policy={injectedNatba0}
              aiDelayMs={0}
            />
          </StrictMode>,
        );
      });

      const controllerSelects = container.querySelectorAll(
        "select[aria-label*='controller'], select[aria-label*='控制方']",
      );
      const playerBControllerSelect = controllerSelects[1] as HTMLSelectElement;
      await act(async () => {
        playerBControllerSelect.value = "ai";
        playerBControllerSelect.dispatchEvent(new Event("change", { bubbles: true }));
      });

      const startButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("开始游戏"),
      );
      await act(async () => {
        startButton?.click();
      });

      const candidateButtons = container.querySelectorAll(".preparation-candidate-grid button.debug-card__select");
      await act(async () => {
        for (let i = 0; i < 10; i += 1) {
          (candidateButtons[i] as HTMLButtonElement).click();
        }
      });
      const confirmPrepButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("确认备课选择"),
      );
      await act(async () => {
        confirmPrepButton?.click();
      });

      const passActionButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("结束本次行动"),
      );
      await act(async () => {
        passActionButton?.click();
      });

      expect(natba0Invoked).toBeGreaterThan(0);
      expect(container.querySelector(".error-banner")).toBeNull();
      expect(container.querySelector("h1")?.textContent).toBe("本地人机公开对局");
      expect(container.querySelector("h1")?.textContent).not.toContain("NATBA-1");
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it("handles AI laboratory preparation automatically when AI is the laboratory teacher", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          <StrictMode>
            <LocalGamePage
              createGame={deterministicGameFactory}
              aiDelayMs={0}
            />
          </StrictMode>,
        );
      });

      const characterSelects = container.querySelectorAll(
        "select[aria-label*='character'], select[aria-label*='角色']",
      );
      const controllerSelects = container.querySelectorAll(
        "select[aria-label*='controller'], select[aria-label*='控制方']",
      );

      await act(async () => {
        const p1Char = characterSelects[0] as HTMLSelectElement;
        p1Char.value = "chemical_factory_ceo";
        p1Char.dispatchEvent(new Event("change", { bubbles: true }));

        const p2Char = characterSelects[1] as HTMLSelectElement;
        p2Char.value = "laboratory_teacher";
        p2Char.dispatchEvent(new Event("change", { bubbles: true }));

        const p2Ctrl = controllerSelects[1] as HTMLSelectElement;
        p2Ctrl.value = "ai";
        p2Ctrl.dispatchEvent(new Event("change", { bubbles: true }));
      });

      const startButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("开始游戏"),
      );

      await act(async () => {
        startButton?.click();
      });

      const mainActionHeading = Array.from(container.querySelectorAll("h2")).find(
        (h) => h.textContent?.includes("主行动"),
      );
      expect(mainActionHeading).toBeDefined();
      expect(container.textContent).toContain("化工厂 CEO");
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it("runs human vs AI actions without deadlock or illegal action errors", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          <StrictMode>
            <LocalGamePage
              createGame={deterministicGameFactory}
              aiDelayMs={0}
            />
          </StrictMode>,
        );
      });

      const controllerSelects = container.querySelectorAll(
        "select[aria-label*='controller'], select[aria-label*='控制方']",
      );
      await act(async () => {
        const p2Ctrl = controllerSelects[1] as HTMLSelectElement;
        p2Ctrl.value = "ai";
        p2Ctrl.dispatchEvent(new Event("change", { bubbles: true }));
      });

      await act(async () => {
        const startButton = Array.from(container.querySelectorAll("button")).find(
          (b) => b.textContent?.includes("开始游戏"),
        );
        startButton?.click();
      });

      const candidateButtons = container.querySelectorAll(
        ".preparation-candidate-grid button.debug-card__select",
      );
      await act(async () => {
        for (let i = 0; i < 10; i += 1) {
          (candidateButtons[i] as HTMLButtonElement).click();
        }
      });
      await act(async () => {
        const confirmPrepButton = Array.from(container.querySelectorAll("button")).find(
          (b) => b.textContent?.includes("确认备课选择"),
        );
        confirmPrepButton?.click();
      });

      for (let step = 0; step < 5; step += 1) {
        const passButton = Array.from(container.querySelectorAll("button")).find(
          (b) =>
            !b.disabled &&
            (b.textContent?.includes("结束本次行动") ||
              b.textContent?.includes("放弃响应") ||
              b.textContent?.includes("放弃处理")),
        );
        if (passButton) {
          await act(async () => {
            passButton.click();
          });
        }
      }

      expect(container.querySelector(".error-banner")).toBeNull();
      expect(container.textContent).not.toContain("操作不合法");
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it("renders bilingual NATBA-1 titles and status notices in Solo vs AI mode", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          <StrictMode>
            <LocaleProvider>
              <LocalGamePage
                createGame={deterministicGameFactory}
                aiDelayMs={10000}
              />
            </LocaleProvider>
          </StrictMode>,
        );
      });

      // Explicitly switch to Chinese first
      const zhButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent === "中文",
      );
      await act(async () => {
        zhButton?.click();
      });

      const controllerSelects = container.querySelectorAll(
        "select[aria-label*='controller'], select[aria-label*='控制方']",
      );
      const playerBControllerSelect = controllerSelects[1] as HTMLSelectElement;
      await act(async () => {
        playerBControllerSelect.value = "ai";
        playerBControllerSelect.dispatchEvent(new Event("change", { bubbles: true }));
      });

      const startButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("开始游戏") || b.textContent?.includes("Start game"),
      );
      await act(async () => {
        startButton?.click();
      });

      // In Chinese mode: check title
      expect(container.querySelector("h1")?.textContent).toBe("本地人机公开对局");

      // Switch to English: check title is Solo vs AI
      const enButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent === "English",
      );
      await act(async () => {
        enButton?.click();
      });

      expect(container.querySelector("h1")?.textContent).toBe("Solo vs AI");
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it("preserves baseline NATBA-1 heuristic policy when explicitly injected as baseline comparator", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    let natba1Invoked = 0;
    const injectedNatba1: NATBAPolicy = (observation, context, random) => {
      natba1Invoked += 1;
      return natba1HeuristicPolicy(observation, context, random);
    };

    try {
      await act(async () => {
        root.render(
          <StrictMode>
            <LocalGamePage
              createGame={deterministicGameFactory}
              policy={injectedNatba1}
              aiDelayMs={0}
            />
          </StrictMode>,
        );
      });

      const controllerSelects = container.querySelectorAll(
        "select[aria-label*='controller'], select[aria-label*='控制方']",
      );
      const playerBControllerSelect = controllerSelects[1] as HTMLSelectElement;
      await act(async () => {
        playerBControllerSelect.value = "ai";
        playerBControllerSelect.dispatchEvent(new Event("change", { bubbles: true }));
      });

      const startButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("开始游戏"),
      );
      await act(async () => {
        startButton?.click();
      });

      const candidateButtons = container.querySelectorAll(".preparation-candidate-grid button.debug-card__select");
      await act(async () => {
        for (let i = 0; i < 10; i += 1) {
          (candidateButtons[i] as HTMLButtonElement).click();
        }
      });
      const confirmPrepButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("确认备课选择"),
      );
      await act(async () => {
        confirmPrepButton?.click();
      });

      const passActionButton = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("结束本次行动"),
      );
      await act(async () => {
        passActionButton?.click();
      });

      expect(natba1Invoked).toBeGreaterThan(0);
      expect(container.querySelector(".error-banner")).toBeNull();
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });
});