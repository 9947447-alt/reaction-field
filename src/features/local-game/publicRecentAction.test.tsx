import { describe, expect, it } from "vitest";
import { identityShuffle } from "../../shared/random";
import { createInitialGame } from "../../game/engine/createInitialGame";
import { engineReducer } from "../../game/engine/reducer";
import type { CardInstanceId, GameState, PlayerId } from "../../game/engine/types";
import {
  describeIncomingResponseAnnouncement,
  getPublicRecentAction,
} from "./publicRecentAction";

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

function createReadyState(): GameState {
  return createInitialGame({
    characterIds: ["chemical_factory_ceo", "acid_king"],
    shuffle: identityShuffle,
  });
}

describe("public recent action readout", () => {
  it("reads PLAY_CARD attacks from the pending response source", () => {
    let state = createReadyState();
    state = putCardInHand(state, "player_2", "substance_caoh2_limewater_01");
    state = engineReducer(state, { type: "PASS_ACTION", playerId: "player_1" }, identityShuffle);
    state = engineReducer(
      state,
      {
        type: "PLAY_CARD",
        playerId: "player_2",
        cardInstanceId: "substance_caoh2_limewater_01",
        targetPlayerId: "player_1",
      },
      identityShuffle,
    );

    const recent = getPublicRecentAction(state);
    expect(recent).toEqual({
      actorId: "player_2",
      kind: "card-play",
      definitionId: "substance_caoh2_limewater",
    });
    expect(describeIncomingResponseAnnouncement(state, "zh-CN")).toBe(
      "对方打出 石灰水 Ca(OH)2（实体）",
    );
    expect(describeIncomingResponseAnnouncement(state, "en")).toBe(
      "Opponent played Limewater Ca(OH)2 (Substance)",
    );
  });

  it("reads reference plays from the latest log event", () => {
    let state = createReadyState();
    state = putCardInHand(state, "player_1", "ion_ca_01");
    state = engineReducer(
      state,
      {
        type: "PLAY_REFERENCE_CARD",
        playerId: "player_1",
        cardInstanceId: "ion_ca_01",
      },
      identityShuffle,
    );

    expect(getPublicRecentAction(state)).toEqual({
      actorId: "player_1",
      kind: "card-play",
      definitionId: "ion_ca",
    });
  });

  it("reads a successful response card from the reaction log", () => {
    let state = createReadyState();
    state = putCardInHand(state, "player_1", "substance_hcl_dilute_01");
    state = putCardInHand(state, "player_2", "substance_naoh_dilute_01");
    state = engineReducer(
      state,
      {
        type: "PLAY_CARD",
        playerId: "player_1",
        cardInstanceId: "substance_hcl_dilute_01",
        targetPlayerId: "player_2",
      },
      identityShuffle,
    );
    state = engineReducer(
      state,
      {
        type: "RESPOND_WITH_CARD",
        playerId: "player_2",
        cardInstanceId: "substance_naoh_dilute_01",
      },
      identityShuffle,
    );

    expect(getPublicRecentAction(state)).toEqual({
      actorId: "player_2",
      kind: "response",
      definitionId: "substance_naoh_dilute",
    });
  });

  it("reads fire status handling and DIY results from the log", () => {
    let fireState = createReadyState();
    fireState = putCardInHand(fireState, "player_2", "substance_h2o_01");
    fireState = {
      ...fireState,
      activePlayerId: "player_2",
      phase: "statusWindow",
      players: fireState.players.map((player) =>
        player.id === "player_2"
          ? {
              ...player,
              statuses: [
                {
                  id: "status_test_FIRE_1",
                  statusId: "FIRE",
                  sourcePlayerId: "player_1",
                  createdAt: 1,
                },
              ],
            }
          : player,
      ),
      pendingStatusHandling: {
        playerId: "player_2",
        statusInstanceId: "status_test_FIRE_1",
      },
    };
    fireState = engineReducer(
      fireState,
      {
        type: "HANDLE_STATUS_WITH_CARD",
        playerId: "player_2",
        statusInstanceId: "status_test_FIRE_1",
        cardInstanceId: "substance_h2o_01",
      },
      identityShuffle,
    );
    expect(getPublicRecentAction(fireState)).toEqual({
      actorId: "player_2",
      kind: "status-handling",
      definitionId: "substance_h2o",
    });

    const diyState: GameState = {
      ...createReadyState(),
      log: [
        {
          id: "log_diy",
          eventKey: "diy_virtual_attack",
          params: {
            playerId: "player_2",
            recipeId: "diy_hcl_from_h_cl",
            targetId: "player_1",
            damageKind: "acid",
            amount: 1,
          },
        },
      ],
    };
    expect(getPublicRecentAction(diyState)).toEqual({
      actorId: "player_2",
      kind: "diy",
      recipeId: "diy_hcl_from_h_cl",
    });
  });
});
