import type {
  CardInstanceId,
  GameState,
  LaboratoryPreparationSelection,
  PlayerId,
} from "./types";

export const HIDDEN_HAND_PREFIX = "hidden-hand:";
export const HIDDEN_DECK_PREFIX = "hidden-deck:";

export function isHiddenPlayCardId(id: CardInstanceId): boolean {
  return id.startsWith(HIDDEN_HAND_PREFIX) || id.startsWith(HIDDEN_DECK_PREFIX);
}

function hiddenHandId(playerId: PlayerId, index: number): CardInstanceId {
  return `${HIDDEN_HAND_PREFIX}${playerId}:${index}`;
}

function hiddenDeckId(index: number): CardInstanceId {
  return `${HIDDEN_DECK_PREFIX}${index}`;
}

function collectPublicCardInstanceIds(state: GameState): ReadonlySet<CardInstanceId> {
  const ids = new Set<CardInstanceId>();
  if (state.tableReference) {
    ids.add(state.tableReference.cardInstanceId);
  }
  const pendingSource = state.pendingResponse?.sourceEffect.context.source;
  if (pendingSource?.kind === "card") {
    ids.add(pendingSource.cardInstanceId);
  }
  const counterSource = state.pendingExperimentCounterattack?.originalDamageContext.source;
  if (counterSource?.kind === "card") {
    ids.add(counterSource.cardInstanceId);
  }
  return ids;
}

function redactPreparationSelection(
  selection: LaboratoryPreparationSelection,
  hiddenPlayerIds: ReadonlySet<PlayerId>,
): LaboratoryPreparationSelection {
  return {
    playerId: selection.playerId,
    candidateCardInstanceIds: hiddenPlayerIds.has(selection.playerId)
      ? []
      : [...selection.candidateCardInstanceIds],
  };
}

export function projectHumanPlayState(state: GameState, viewerPlayerId: PlayerId): GameState {
  const hiddenPlayerIds = new Set(
    state.players.filter((player) => player.id !== viewerPlayerId).map((player) => player.id),
  );
  const hiddenHandIds = new Set<CardInstanceId>();
  for (const player of state.players) {
    if (!hiddenPlayerIds.has(player.id)) {
      continue;
    }
    for (const id of player.hand) {
      hiddenHandIds.add(id);
    }
  }

  const publicCardIds = collectPublicCardInstanceIds(state);
  const cardInstances = { ...state.cardInstances };
  for (const id of hiddenHandIds) {
    if (!publicCardIds.has(id)) {
      delete cardInstances[id];
    }
  }
  for (const id of state.deck) {
    delete cardInstances[id];
  }

  const players = state.players.map((player) => {
    const hand = hiddenPlayerIds.has(player.id)
      ? player.hand.map((_, index) => hiddenHandId(player.id, index))
      : [...player.hand];
    return {
      ...player,
      hand,
      statuses: player.statuses.map((status) => ({ ...status })),
      characterUsage: {
        perCycle: { ...player.characterUsage.perCycle },
        perRound: { ...player.characterUsage.perRound },
      },
    };
  });

  const pendingLaboratoryPreparation = state.pendingLaboratoryPreparation
    ? {
        ...redactPreparationSelection(state.pendingLaboratoryPreparation, hiddenPlayerIds),
        keepCount: state.pendingLaboratoryPreparation.keepCount,
        remainingSelections: state.pendingLaboratoryPreparation.remainingSelections.map((selection) =>
          redactPreparationSelection(selection, hiddenPlayerIds),
        ),
      }
    : undefined;

  const pendingExperimentCounterattack = state.pendingExperimentCounterattack
    && hiddenPlayerIds.has(state.pendingExperimentCounterattack.responderPlayerId)
    ? {
        ...state.pendingExperimentCounterattack,
        legalMetalCardInstanceIds: [],
        legalPursuitCardInstanceIds: [],
      }
    : state.pendingExperimentCounterattack;

  return {
    ...state,
    players,
    cardInstances,
    deck: state.deck.map((_, index) => hiddenDeckId(index)),
    discardPile: [...state.discardPile],
    tableReference: state.tableReference ? { ...state.tableReference } : undefined,
    pendingLaboratoryPreparation,
    pendingExperimentCounterattack,
    pendingResponse: state.pendingResponse
      ? {
          ...state.pendingResponse,
          effectsAfterPass: [...state.pendingResponse.effectsAfterPass],
        }
      : undefined,
    pendingStatusHandling: state.pendingStatusHandling
      ? { ...state.pendingStatusHandling }
      : undefined,
    effectQueue: [...state.effectQueue],
    log: [...state.log],
  };
}
