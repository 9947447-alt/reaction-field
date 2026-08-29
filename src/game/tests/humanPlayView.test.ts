import { describe, expect, it } from "vitest";
import { cardDefinitionsById } from "../data/cardDefinitions";
import { identityShuffle } from "../../shared/random";
import { createInitialGame } from "../engine/createInitialGame";
import { engineReducer } from "../engine/reducer";
import {
  isHiddenPlayCardId,
  projectHumanPlayState,
} from "../engine/humanPlayView";
import type { CardInstanceId, GameState, PlayerId } from "../engine/types";
import {
  getOfficialHumanViewerPlayerId,
  getOfficialPlayState,
  getOfficialVisibilityMode,
} from "../../features/local-game/officialPlayView";

function confirmPreparation(state: GameState): GameState {
  const pending = state.pendingLaboratoryPreparation;
  if (!pending) {
    return state;
  }
  return engineReducer(state, {
    type: "CONFIRM_LABORATORY_PREPARATION",
    playerId: pending.playerId,
    keptCardInstanceIds: pending.candidateCardInstanceIds.slice(0, 10),
  });
}

function createReadyMainGameState(): GameState {
  const state = createInitialGame({
    characterIds: ["laboratory_teacher", "acid_king"],
    shuffle: identityShuffle,
  });
  return confirmPreparation(state);
}

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

function findCards(state: GameState, definitionId: string): CardInstanceId[] {
  const ids = Object.keys(state.cardInstances).filter(
    (cardId) => state.cardInstances[cardId].definitionId === definitionId,
  );
  if (ids.length === 0) {
    throw new Error(`Missing card definition ${definitionId}`);
  }
  return ids;
}

function moveAllCopiesToHand(
  state: GameState,
  playerId: PlayerId,
  definitionId: string,
): GameState {
  return findCards(state, definitionId).reduce(
    (current, cardInstanceId) => putCardInHand(current, playerId, cardInstanceId),
    state,
  );
}

describe("Phase 20C — Human Play View projection", () => {
  it("maps exactly one human controller to that viewer and two-player to public-debug", () => {
    expect(getOfficialHumanViewerPlayerId(["human", "ai"])).toBe("player_1");
    expect(getOfficialHumanViewerPlayerId(["ai", "human"])).toBe("player_2");
    expect(getOfficialHumanViewerPlayerId(["human", "human"])).toBeUndefined();
    expect(getOfficialHumanViewerPlayerId(["ai", "ai"])).toBeUndefined();
    expect(getOfficialVisibilityMode(["human", "ai"])).toBe("human-play");
    expect(getOfficialVisibilityMode(["human", "human"])).toBe("public-debug");
  });

  it("keeps the viewer's hand definitions and strips hidden opponent hand definitions", () => {
    let state = createReadyMainGameState();
    state = moveAllCopiesToHand(state, "player_1", "substance_h2so4_dilute");
    state = moveAllCopiesToHand(state, "player_2", "substance_caoh2_limewater");
    const ownCardId = findCards(state, "substance_h2so4_dilute")[0];
    const opponentCardId = findCards(state, "substance_caoh2_limewater")[0];

    const view = projectHumanPlayState(state, "player_1");
    const originalOpponentHand = [...state.players[1].hand];
    const viewSerialized = JSON.stringify(view);

    expect(view.players[0].hand).toEqual(state.players[0].hand);
    expect(view.cardInstances[ownCardId]?.definitionId).toBe("substance_h2so4_dilute");
    expect(view.players[1].hand).toHaveLength(originalOpponentHand.length);
    expect(view.players[1].hand.every(isHiddenPlayCardId)).toBe(true);
    expect(view.cardInstances[opponentCardId]).toBeUndefined();
    expect(viewSerialized).not.toContain("substance_caoh2_limewater");
    expect(viewSerialized).not.toContain(opponentCardId);
    expect(viewSerialized).toContain("substance_h2so4_dilute");
    expect(state.players[1].hand).toEqual(originalOpponentHand);
    expect(state.cardInstances[opponentCardId]?.definitionId).toBe("substance_caoh2_limewater");
  });

  it("preserves public discard definitions and already-recorded log events", () => {
    let state = createReadyMainGameState();
    const discardedId = findCards(state, "substance_na2co3")[0];
    state = {
      ...state,
      deck: state.deck.filter((id) => id !== discardedId),
      discardPile: [discardedId],
      players: state.players.map((player) => ({
        ...player,
        hand: player.hand.filter((id) => id !== discardedId),
      })),
      cardInstances: {
        ...state.cardInstances,
        [discardedId]: {
          ...state.cardInstances[discardedId],
          ownerId: undefined,
          zone: { type: "discard" },
        },
      },
    };

    const view = projectHumanPlayState(state, "player_1");
    expect(view.discardPile).toEqual([discardedId]);
    expect(view.cardInstances[discardedId]?.definitionId).toBe("substance_na2co3");
    expect(view.log).toEqual(state.log);
    expect(view.log.length).toBeGreaterThan(0);
  });

  it("keeps deck length but strips future deck identities and order", () => {
    const state = createReadyMainGameState();
    const view = projectHumanPlayState(state, "player_1");
    const originalDeck = [...state.deck];

    expect(view.deck).toHaveLength(originalDeck.length);
    expect(view.deck.every(isHiddenPlayCardId)).toBe(true);
    expect(view.deck).not.toEqual(originalDeck);
    for (const id of originalDeck) {
      expect(view.cardInstances[id]).toBeUndefined();
    }
    expect(state.deck).toEqual(originalDeck);
  });

  it("hides opponent laboratory preparation candidates while keeping the viewer's", () => {
    const state = createInitialGame({
      characterIds: ["laboratory_teacher", "acid_king"],
      shuffle: identityShuffle,
    });
    const teacherView = projectHumanPlayState(state, "player_1");
    const opponentView = projectHumanPlayState(state, "player_2");

    expect(teacherView.pendingLaboratoryPreparation?.candidateCardInstanceIds).toEqual(
      state.pendingLaboratoryPreparation?.candidateCardInstanceIds,
    );
    expect(opponentView.pendingLaboratoryPreparation?.candidateCardInstanceIds).toEqual([]);
    expect(opponentView.pendingLaboratoryPreparation?.playerId).toBe("player_1");
    expect(opponentView.pendingLaboratoryPreparation?.keepCount).toBe(10);
  });

  it("does not project two-player official play state", () => {
    const state = createReadyMainGameState();
    const playState = getOfficialPlayState(state, ["human", "human"]);
    expect(playState).toBe(state);
    expect(playState.players[1].hand).toEqual(state.players[1].hand);
    expect(
      playState.players[1].hand.every((id) => playState.cardInstances[id]?.definitionId),
    ).toBe(true);
  });

  it("does not expose localized opponent card names through remaining view definitions", () => {
    let state = createReadyMainGameState();
    state = moveAllCopiesToHand(state, "player_2", "substance_caoh2_limewater");
    const opponentCardId = findCards(state, "substance_caoh2_limewater")[0];
    const view = projectHumanPlayState(state, "player_1");
    const limewater = cardDefinitionsById.get("substance_caoh2_limewater");
    const viewSerialized = JSON.stringify(view);

    expect(limewater?.name).toBe("石灰水 Ca(OH)2");
    expect(viewSerialized).not.toContain(limewater!.name);
    expect(viewSerialized).not.toContain(limewater!.rulesText);
    expect(viewSerialized).not.toContain("substance_caoh2_limewater");
    expect(viewSerialized).not.toContain(opponentCardId);
    expect(view.cardInstances[opponentCardId]).toBeUndefined();
  });
});
