import type { DisplayLocale } from "../../app/locale";
import { cardDefinitionsById } from "../../game/data/cardDefinitions";
import type {
  CardDefinitionId,
  GameLogEntry,
  GameState,
  PlayerId,
} from "../../game/engine/types";
import {
  getCardDisplayName,
  getCardTypeDisplayName,
  getDiyRecipeDisplayName,
  getDiyVirtualProductDisplayName,
} from "./presentationLocale";

export type PublicRecentActionKind = "card-play" | "response" | "status-handling" | "diy";

export type PublicRecentAction = Readonly<{
  actorId: PlayerId;
  kind: PublicRecentActionKind;
  definitionId?: CardDefinitionId;
  recipeId?: string;
  productKey?: "CO2" | "H2O" | "SO2";
}>;

export type PublicRecentActionView = Readonly<{
  actorId: PlayerId;
  kind: PublicRecentActionKind;
  name: string;
  typeLabel: string;
}>;

function cardAction(
  actorId: PlayerId,
  kind: PublicRecentActionKind,
  definitionId: CardDefinitionId,
): PublicRecentAction {
  return { actorId, kind, definitionId };
}

function fromPendingResponse(state: GameState): PublicRecentAction | undefined {
  const source = state.pendingResponse?.sourceEffect.context.source;
  if (!source) {
    return undefined;
  }
  if (source.kind === "card") {
    return cardAction(source.sourcePlayerId, "card-play", source.cardDefinitionId);
  }
  if (source.kind === "diy") {
    return { actorId: source.sourcePlayerId, kind: "diy", recipeId: source.recipeId };
  }
  return undefined;
}

function fromLogEntry(entry: GameLogEntry): PublicRecentAction | undefined {
  switch (entry.eventKey) {
    case "card_play_attack":
    case "card_play_reference":
      return cardAction(entry.params.actorId, "card-play", entry.params.cardDefinitionId);
    case "card_play_so2":
      return cardAction(entry.params.actorId, "card-play", "substance_so2");
    case "card_play_o2":
      return cardAction(entry.params.actorId, "card-play", "substance_o2");
    case "status_handled_fire":
      return cardAction(entry.params.playerId, "status-handling", entry.params.cardDefinitionId);
    case "skill_alkali_recovery":
      return cardAction(entry.params.playerId, "card-play", entry.params.cardDefinitionId);
    case "counterattack_pursuit":
      return cardAction(entry.params.playerId, "card-play", entry.params.cardDefinitionId);
    case "diy_virtual_attack":
      return { actorId: entry.params.playerId, kind: "diy", recipeId: entry.params.recipeId };
    case "diy_co2_remove_fire":
      return { actorId: entry.params.playerId, kind: "diy", recipeId: "diy_co2_from_c_o_o", productKey: "CO2" };
    case "diy_h2o_remove_fire":
      return { actorId: entry.params.playerId, kind: "diy", recipeId: "diy_h2o_from_h_oh", productKey: "H2O" };
    case "diy_so2_apply_leak":
      return { actorId: entry.params.actorId, kind: "diy", recipeId: "diy_so2_from_s_o_o", productKey: "SO2" };
    case "reaction": {
      const cards = entry.reaction.participants.filter((participant) => participant.kind === "card");
      const revealing =
        cards.find((participant) => participant.role === "responder" || participant.role === "status-handler") ??
        cards.find((participant) => participant.role === "attacker");
      if (!revealing || revealing.kind !== "card") {
        const diy = entry.reaction.participants.find((participant) => participant.kind === "diy");
        if (diy && diy.kind === "diy") {
          return { actorId: diy.playerId, kind: "diy", recipeId: diy.recipeId };
        }
        return undefined;
      }
      return cardAction(
        revealing.playerId,
        revealing.role === "responder" ? "response" : revealing.role === "status-handler" ? "status-handling" : "card-play",
        revealing.cardDefinitionId,
      );
    }
    default:
      return undefined;
  }
}

export function getPublicRecentAction(state: GameState): PublicRecentAction | undefined {
  const pending = fromPendingResponse(state);
  if (pending) {
    return pending;
  }
  for (let index = state.log.length - 1; index >= 0; index -= 1) {
    const recent = fromLogEntry(state.log[index]);
    if (recent) {
      return recent;
    }
  }
  return undefined;
}

function diyResultName(action: PublicRecentAction, locale: DisplayLocale): string {
  if (action.productKey) {
    return action.productKey;
  }
  if (!action.recipeId) {
    return "DIY";
  }
  const product = getDiyVirtualProductDisplayName(action.recipeId, locale);
  return product === action.recipeId
    ? getDiyRecipeDisplayName(action.recipeId, action.recipeId, locale)
    : product;
}

export function formatPublicRecentAction(
  action: PublicRecentAction,
  locale: DisplayLocale,
): PublicRecentActionView {
  if (action.kind === "diy") {
    return {
      actorId: action.actorId,
      kind: action.kind,
      name: diyResultName(action, locale),
      typeLabel: "DIY",
    };
  }

  const definition = action.definitionId ? cardDefinitionsById.get(action.definitionId) : undefined;
  return {
    actorId: action.actorId,
    kind: action.kind,
    name: definition
      ? getCardDisplayName(definition.id, definition.name, locale)
      : (action.definitionId ?? ""),
    typeLabel: definition ? getCardTypeDisplayName(definition.type, locale) : "",
  };
}

export function describeIncomingResponseAnnouncement(
  state: GameState,
  locale: DisplayLocale,
  viewerPlayerId?: PlayerId,
): string | undefined {
  if (state.phase !== "responseWindow" || !state.pendingResponse) {
    return undefined;
  }
  const source = state.pendingResponse.sourceEffect.context.source;
  const sourcePlayerId = source.kind === "card" || source.kind === "diy" || source.kind === "character-skill"
    ? source.sourcePlayerId
    : undefined;
  const asOpponent = sourcePlayerId
    ? sourcePlayerId !== (viewerPlayerId ?? state.pendingResponse.responderId)
    : false;
  const isEnglish = locale === "en";
  if (source.kind === "card") {
    const definition = cardDefinitionsById.get(source.cardDefinitionId);
    const name = definition
      ? getCardDisplayName(definition.id, definition.name, locale)
      : source.cardDefinitionId;
    const typeLabel = definition ? getCardTypeDisplayName(definition.type, locale) : "";
    if (isEnglish) {
      return asOpponent ? `Opponent played ${name} (${typeLabel})` : `You played ${name} (${typeLabel})`;
    }
    return asOpponent ? `对方打出 ${name}（${typeLabel}）` : `你打出 ${name}（${typeLabel}）`;
  }
  if (source.kind === "diy") {
    const name = getDiyVirtualProductDisplayName(source.recipeId, locale);
    if (isEnglish) {
      return asOpponent
        ? `Opponent used DIY to produce ${name} (DIY)`
        : `You used DIY to produce ${name} (DIY)`;
    }
    return asOpponent ? `对方主动 DIY 生成 ${name}（DIY）` : `你主动 DIY 生成 ${name}（DIY）`;
  }
  return undefined;
}
