// @vitest-environment happy-dom

import { StrictMode, act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../app/locale";
import { createInitialGame } from "../../game/engine/createInitialGame";
import type { CardInstanceId, GameState, PlayerId } from "../../game/engine/types";
import { identityShuffle } from "../../shared/random";
import { LocalGamePage } from "./LocalGamePage";
import type { LocalGameFactory } from "./localGameSession";

function putCardInHand(
  state: GameState,
  playerId: PlayerId,
  cardInstanceId: CardInstanceId,
): GameState {
  const card = state.cardInstances[cardInstanceId];
  if (!card) {
    throw new Error(`Missing card ${cardInstanceId}`);
  }
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      hand: player.id === playerId
        ? [...player.hand.filter((id) => id !== cardInstanceId), cardInstanceId]
        : player.hand.filter((id) => id !== cardInstanceId),
    })),
    deck: state.deck.filter((id) => id !== cardInstanceId),
    discardPile: state.discardPile.filter((id) => id !== cardInstanceId),
    cardInstances: {
      ...state.cardInstances,
      [cardInstanceId]: {
        ...card,
        ownerId: playerId,
        zone: { type: "hand", playerId },
      },
    },
  };
}

function moveAllCopiesToHand(
  state: GameState,
  playerId: PlayerId,
  definitionId: string,
): GameState {
  const ids = Object.keys(state.cardInstances).filter(
    (cardId) => state.cardInstances[cardId].definitionId === definitionId,
  );
  return ids.reduce(
    (current, cardInstanceId) => putCardInHand(current, playerId, cardInstanceId),
    state,
  );
}

const privateViewFactory: LocalGameFactory = (characterIds) => {
  let state = createInitialGame({
    characterIds: [characterIds[0], characterIds[1]],
    shuffle: identityShuffle,
  });
  state = moveAllCopiesToHand(state, "player_1", "substance_h2so4_dilute");
  state = moveAllCopiesToHand(state, "player_2", "substance_caoh2_limewater");
  state = moveAllCopiesToHand(state, "player_2", "ion_ca");
  return state;
};

function playerPanel(container: HTMLElement, playerId: "player_1" | "player_2"): HTMLElement {
  const panel = container.querySelector(`[aria-labelledby="${playerId}-title"]`);
  if (!(panel instanceof HTMLElement)) {
    throw new Error(`Missing ${playerId} panel`);
  }
  return panel;
}

async function renderPage() {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <StrictMode>
        <LocaleProvider>
          <LocalGamePage
            createGame={privateViewFactory}
            aiDelayMs={10000}
          />
        </LocaleProvider>
      </StrictMode>,
    );
  });
  const chineseButton = Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent === "中文",
  );
  await act(async () => {
    chineseButton?.click();
  });
  return { container, root };
}

async function selectCharacters(container: HTMLElement) {
  const characterSelects = container.querySelectorAll(
    "select[aria-label*='character'], select[aria-label*='角色']",
  );
  await act(async () => {
    const playerA = characterSelects[0] as HTMLSelectElement;
    playerA.value = "chemical_factory_ceo";
    playerA.dispatchEvent(new Event("change", { bubbles: true }));
    const playerB = characterSelects[1] as HTMLSelectElement;
    playerB.value = "acid_king";
    playerB.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function startGame(container: HTMLElement) {
  const startButton = Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent?.includes("开始游戏") || button.textContent?.includes("Start game"),
  );
  await act(async () => {
    startButton?.click();
  });
}

function assertNoOpponentCardLeak(scope: ParentNode) {
  const text = scope.textContent ?? "";
  expect(text).not.toContain("石灰水");
  expect(text).not.toContain("Limewater");
  expect(text).not.toContain("Ca(OH)2");
  expect(text).not.toContain("substance_caoh2_limewater");
  expect(text).not.toContain("Ca2+");
  expect(text).not.toContain("ion_ca");
  expect(text).not.toContain("MVP 0 中造成 1 点碱性伤害，或响应酸性伤害，或处理 SO2 泄漏。");
  expect(text).not.toContain("Deal 1 alkaline damage");
}

describe("Phase 20C — Solo private human play view", () => {
  it("shows opponent card backs and count, not localized names, rules, or card controls", async () => {
    const { container, root } = await renderPage();
    try {
      await selectCharacters(container);
      await startGame(container);

      expect(container.querySelector("h1")?.textContent).toBe("本地人机对局");
      expect(container.textContent).toContain("己方手牌；对手背面");

      const opponent = playerPanel(container, "player_2");
      const own = playerPanel(container, "player_1");
      const opponentCount = Number(
        opponent.querySelector(".hand-count-pill")?.textContent?.match(/(\d+)/)?.[1],
      );
      expect(opponentCount).toBeGreaterThan(0);
      expect(opponent.querySelectorAll(".card-back")).toHaveLength(opponentCount);
      expect(opponent.querySelectorAll(".debug-card__select")).toHaveLength(0);
      expect(opponent.querySelectorAll("button")).toHaveLength(0);
      expect(opponent.textContent).toContain("牌背");
      expect(opponent.textContent).not.toContain("普通出牌");
      expect(opponent.textContent).not.toContain("执行效果");
      expect(opponent.textContent).not.toContain("可在当前对局中选择");
      expect(opponent.querySelector(".hand-grid")?.textContent).not.toContain("调试详情");
      assertNoOpponentCardLeak(opponent);

      expect(own.textContent).toContain("稀 H2SO4");
      expect(own.querySelectorAll(".card-face")).toHaveLength(own.querySelectorAll(".debug-card").length);

      const actionPanel = container.querySelector(".action-panel");
      expect(actionPanel).not.toBeNull();
      assertNoOpponentCardLeak(actionPanel!);
      expect(actionPanel?.textContent).toContain("稀 H2SO4");

      const enterDiy = Array.from(container.querySelectorAll("button")).find(
        (button) => button.textContent?.includes("进入主动 DIY"),
      );
      await act(async () => {
        enterDiy?.click();
      });
      const diyPanel = container.querySelector(".diy-panel");
      expect(diyPanel).not.toBeNull();
      assertNoOpponentCardLeak(diyPanel!);
      expect(diyPanel?.textContent).not.toContain("Ca2+");
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it("keeps both hands public in local two-player mode", async () => {
    const { container, root } = await renderPage();
    try {
      const modeSelect = container.querySelector(
        "select[aria-label*='mode'], select[aria-label*='模式']",
      ) as HTMLSelectElement;
      await act(async () => {
        modeSelect.value = "two_player";
        modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await selectCharacters(container);
      await startGame(container);

      expect(container.querySelector("h1")?.textContent).toBe("本地双人公开对局");
      expect(container.textContent).toContain("手牌可见");

      const opponent = playerPanel(container, "player_2");
      expect(opponent.textContent).toContain("石灰水 Ca(OH)2");
      expect(opponent.textContent).toContain("Ca2+");
      expect(opponent.querySelectorAll(".card-back")).toHaveLength(0);
      expect(opponent.querySelectorAll(".debug-card__select").length).toBeGreaterThan(0);
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it("hides localized English opponent names after switching locale", async () => {
    const { container, root } = await renderPage();
    try {
      await selectCharacters(container);
      await startGame(container);
      const englishButton = Array.from(container.querySelectorAll("button")).find(
        (button) => button.textContent === "English",
      );
      await act(async () => {
        englishButton?.click();
      });

      expect(container.querySelector("h1")?.textContent).toBe("Solo vs AI");
      const opponent = playerPanel(container, "player_2");
      expect(opponent.textContent).toContain("Face down");
      assertNoOpponentCardLeak(opponent);
      expect(playerPanel(container, "player_1").textContent).toContain("Dilute H2SO4");
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });
});
