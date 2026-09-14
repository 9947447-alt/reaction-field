// @vitest-environment happy-dom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../app/locale";
import { createInitialGame } from "../../../game/engine/createInitialGame";
import type { GameState } from "../../../game/engine/types";
import { identityShuffle } from "../../../shared/random";
import { DeskActionBar } from "./DeskActionBar";

function publicButtons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll(".desk-action-btn"));
}

function createSkillReadyMainActionGame(): GameState {
  const base = createInitialGame({
    characterIds: ["chemical_factory_ceo", "acid_king"],
    shuffle: identityShuffle,
  });
  const player1 = base.players[0];
  const kept = player1.hand.slice(0, 4);
  const discarded = player1.hand.slice(4);
  return {
    ...base,
    discardPile: [...base.discardPile, ...discarded],
    players: base.players.map((player) =>
      player.id === "player_1" ? { ...player, hand: kept } : player,
    ),
  };
}

function createCounterattackGame(): GameState {
  const base = createInitialGame({
    characterIds: ["clumsy_party_secretary", "chemistry_enthusiast"],
    shuffle: identityShuffle,
  });
  return {
    ...base,
    pendingLaboratoryPreparation: undefined,
    phase: "experimentCounterattackWindow",
    pendingExperimentCounterattack: {
      attackerPlayerId: "player_1",
      continuation: { kind: "single-response" },
      legalMetalCardInstanceIds: [],
      legalOptions: ["recover"],
      legalPursuitCardInstanceIds: [],
      originalDamageContext: {
        baseAmount: 1,
        responsePolicy: "acid-base",
        source: {
          cardDefinitionId: "substance_hcl_dilute",
          cardInstanceId: "substance_hcl_dilute_01",
          kind: "card",
          sourcePlayerId: "player_1",
        },
        tags: [],
        targetPlayerId: "player_2",
      },
      responderPlayerId: "player_1",
      responseType: "acid-base",
    },
  } as GameState;
}

describe("Official desk action bar", () => {
  it("keeps at most 3 main buttons when the character skill is available, including after selecting a hand card", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const game = createSkillReadyMainActionGame();
    const selectedCardId = game.players[0].hand[0];
    expect(game.players[0].hand).toHaveLength(4);

    try {
      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(DeskActionBar, {
              dispatchGameAction: vi.fn(),
              game,
              playerControllers: ["human", "ai"],
            }),
          ),
        );
      });

      expect(container.textContent).toMatch(/应急调货|Emergency Supply/);
      expect(publicButtons(container).length).toBeLessThanOrEqual(3);

      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(DeskActionBar, {
              dispatchGameAction: vi.fn(),
              game,
              playerControllers: ["human", "ai"],
              selectedCardId,
            }),
          ),
        );
      });

      expect(publicButtons(container).length).toBeLessThanOrEqual(3);
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it("does not render a clickable metal counterattack button on the official desk", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const game = createCounterattackGame();
    const dispatchGameAction = vi.fn();

    try {
      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(DeskActionBar, {
              dispatchGameAction,
              game,
              playerControllers: ["human", "human"],
              selectedCardId: game.players[0].hand[0],
            }),
          ),
        );
      });

      const metalButtons = publicButtons(container).filter((button) =>
        /金属反击|Metal Counterattack/u.test(button.textContent ?? ""),
      );
      expect(metalButtons).toHaveLength(0);
      expect(publicButtons(container).some((button) => button.disabled === false && /金属/u.test(button.textContent ?? ""))).toBe(false);
      expect(dispatchGameAction).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});
