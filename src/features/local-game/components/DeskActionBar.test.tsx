// @vitest-environment happy-dom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../app/locale";
import { createInitialGame } from "../../../game/engine/createInitialGame";
import { getLegalCharacterSkillActions } from "../../../game/engine/characterSkills";
import type { CardInstanceId, CharacterId, GameState } from "../../../game/engine/types";
import { identityShuffle } from "../../../shared/random";
import { DeskActionBar } from "./DeskActionBar";

function publicButtons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll(".desk-action-btn"));
}

function emergencySupplyButton(container: HTMLElement): HTMLButtonElement | undefined {
  return publicButtons(container).find((button) =>
    /应急调货|Emergency Supply/u.test(button.textContent ?? ""),
  );
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

function findInstanceId(game: GameState, definitionId: string): CardInstanceId {
  const instance = Object.values(game.cardInstances).find(
    (card) => card.definitionId === definitionId,
  );
  if (!instance) {
    throw new Error(`Missing card instance for ${definitionId}`);
  }
  return instance.id;
}

function withPlayerHand(
  game: GameState,
  playerId: "player_1" | "player_2",
  extraHandIds: readonly CardInstanceId[],
  hp?: number,
): GameState {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new Error(`Missing ${playerId}`);
  }

  const extra = extraHandIds.filter((id) => !player.hand.includes(id));
  const hand = [...player.hand, ...extra];
  const taken = new Set(extra);

  return {
    ...game,
    deck: game.deck.filter((id) => !taken.has(id)),
    discardPile: game.discardPile.filter((id) => !taken.has(id)),
    cardInstances: {
      ...game.cardInstances,
      ...Object.fromEntries(
        extra.map((id) => [
          id,
          {
            ...game.cardInstances[id],
            ownerId: playerId,
            zone: { type: "hand" as const, playerId },
          },
        ]),
      ),
    },
    players: game.players.map((candidate) =>
      candidate.id === playerId
        ? { ...candidate, hand, hp: hp ?? candidate.hp }
        : candidate,
    ),
  };
}

function createMainActionGame(characterIds: [CharacterId, CharacterId]): GameState {
  return createInitialGame({
    characterIds,
    shuffle: identityShuffle,
  });
}

function createCaptainSkillReadyGame(): GameState {
  const base = createMainActionGame(["caustic_soda_captain", "acid_king"]);
  const alkaliId = findInstanceId(base, "substance_naoh_dilute");
  return withPlayerHand(base, "player_1", [alkaliId], base.players[0].maxHp - 1);
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
    const dispatchGameAction = vi.fn();
    expect(game.players[0].hand).toHaveLength(4);

    try {
      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(DeskActionBar, {
              dispatchGameAction,
              game,
              playerControllers: ["human", "ai"],
            }),
          ),
        );
      });

      const skillBeforeSelect = emergencySupplyButton(container);
      expect(skillBeforeSelect).toBeDefined();
      expect(skillBeforeSelect?.disabled).toBe(false);
      expect(publicButtons(container).length).toBeLessThanOrEqual(3);

      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(DeskActionBar, {
              dispatchGameAction,
              game,
              playerControllers: ["human", "ai"],
              selectedCardId,
            }),
          ),
        );
      });

      const skillAfterSelect = emergencySupplyButton(container);
      const labelsAfterSelect = publicButtons(container).map((button) => button.textContent ?? "");
      expect(publicButtons(container).length).toBeLessThanOrEqual(3);
      expect(skillAfterSelect).toBeDefined();
      expect(skillAfterSelect?.disabled).toBe(false);
      expect(labelsAfterSelect.some((label) => /进入主动 DIY|Active DIY/u.test(label))).toBe(false);
      expect(labelsAfterSelect.some((label) => /结束本次行动|End Action/u.test(label))).toBe(true);

      await act(async () => {
        skillAfterSelect?.click();
      });

      expect(dispatchGameAction).toHaveBeenCalledWith({
        playerId: "player_1",
        skillId: "emergency_supply",
        type: "ACTIVATE_CHARACTER_SKILL",
      });
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

  it("renders engine-legal main-action skills for captain, director, and secretary", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const dispatchGameAction = vi.fn();

    try {
      const captainGame = createCaptainSkillReadyGame();
      const alkaliId = findInstanceId(captainGame, "substance_naoh_dilute");
      expect(getLegalCharacterSkillActions(captainGame, "player_1").some((action) => action.skillId === "alkali_recovery")).toBe(true);

      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(DeskActionBar, {
              dispatchGameAction,
              game: captainGame,
              playerControllers: ["human", "ai"],
            }),
          ),
        );
      });

      const alkaliButton = publicButtons(container).find((button) =>
        /碱液回收|Alkali Recovery/u.test(button.textContent ?? ""),
      );
      expect(alkaliButton).toBeDefined();
      expect(publicButtons(container).length).toBeLessThanOrEqual(3);

      await act(async () => {
        alkaliButton?.click();
      });
      expect(dispatchGameAction).toHaveBeenCalledWith({
        cardInstanceId: alkaliId,
        playerId: "player_1",
        skillId: "alkali_recovery",
        type: "ACTIVATE_CHARACTER_SKILL",
      });

      const directorGame = createMainActionGame(["sulfuric_acid_factory_director", "acid_king"]);
      dispatchGameAction.mockClear();
      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(DeskActionBar, {
              dispatchGameAction,
              game: directorGame,
              playerControllers: ["human", "ai"],
            }),
          ),
        );
      });
      const dischargeButton = publicButtons(container).find((button) =>
        /排放尾气|Exhaust Discharge/u.test(button.textContent ?? ""),
      );
      expect(dischargeButton).toBeDefined();
      await act(async () => {
        dischargeButton?.click();
      });
      expect(dispatchGameAction).toHaveBeenCalledWith({
        playerId: "player_1",
        skillId: "exhaust_discharge",
        targetPlayerId: "player_2",
        type: "ACTIVATE_CHARACTER_SKILL",
      });

      const secretaryGame = createMainActionGame(["clumsy_party_secretary", "acid_king"]);
      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(DeskActionBar, {
              dispatchGameAction,
              game: secretaryGame,
              playerControllers: ["human", "ai"],
            }),
          ),
        );
      });
      const secretaryLabels = publicButtons(container).map((button) => button.textContent ?? "");
      expect(secretaryLabels.some((label) => /尾气泄漏|Exhaust Leak/u.test(label))).toBe(true);
      expect(secretaryLabels.some((label) => /实验台起火|Laboratory Bench Fire/u.test(label))).toBe(true);
      expect(secretaryLabels.some((label) => /强放热事故|Exothermic Accident/u.test(label))).toBe(true);
      expect(publicButtons(container).length).toBeLessThanOrEqual(3);
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it("keeps alkali recovery when a hand card is selected and binds the selected strong alkali", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const game = createCaptainSkillReadyGame();
    const alkaliId = findInstanceId(game, "substance_naoh_dilute");
    const otherCardId = game.players[0].hand.find((id) => id !== alkaliId);
    const dispatchGameAction = vi.fn();
    expect(otherCardId).toBeDefined();

    try {
      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(DeskActionBar, {
              dispatchGameAction,
              game,
              playerControllers: ["human", "ai"],
              selectedCardId: otherCardId,
            }),
          ),
        );
      });

      const skillAfterSelect = publicButtons(container).find((button) =>
        /碱液回收|Alkali Recovery/u.test(button.textContent ?? ""),
      );
      expect(publicButtons(container).length).toBeLessThanOrEqual(3);
      expect(skillAfterSelect).toBeDefined();

      await act(async () => {
        skillAfterSelect?.click();
      });
      expect(dispatchGameAction).toHaveBeenCalledWith({
        cardInstanceId: alkaliId,
        playerId: "player_1",
        skillId: "alkali_recovery",
        type: "ACTIVATE_CHARACTER_SKILL",
      });

      dispatchGameAction.mockClear();
      await act(async () => {
        root.render(
          createElement(
            LocaleProvider,
            null,
            createElement(DeskActionBar, {
              dispatchGameAction,
              game,
              playerControllers: ["human", "ai"],
              selectedCardId: alkaliId,
            }),
          ),
        );
      });
      const boundButton = publicButtons(container).find((button) =>
        /碱液回收|Alkali Recovery/u.test(button.textContent ?? ""),
      );
      await act(async () => {
        boundButton?.click();
      });
      expect(dispatchGameAction).toHaveBeenCalledWith({
        cardInstanceId: alkaliId,
        playerId: "player_1",
        skillId: "alkali_recovery",
        type: "ACTIVATE_CHARACTER_SKILL",
      });
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it("does not show a main-action skill button for enthusiast or acid king", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const dispatchGameAction = vi.fn();

    try {
      for (const characterId of ["chemistry_enthusiast", "acid_king"] as const) {
        const game = createMainActionGame([characterId, "laboratory_teacher"]);
        await act(async () => {
          root.render(
            createElement(
              LocaleProvider,
              null,
              createElement(DeskActionBar, {
                dispatchGameAction,
                game,
                playerControllers: ["human", "ai"],
              }),
            ),
          );
        });
        expect(getLegalCharacterSkillActions(game, "player_1")).toEqual([]);
        expect(
          publicButtons(container).some((button) =>
            /发动|Activate Extra Lesson|Activate Emergency Supply|Alkali Recovery|Exhaust Discharge|Exhaust Leak|Laboratory Bench Fire|Exothermic Accident|加课|应急调货|碱液回收|排放尾气|尾气泄漏|实验台起火|强放热事故/u.test(
              button.textContent ?? "",
            ),
          ),
        ).toBe(false);
      }
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});
