import { cardDefinitionsById } from "../../../game/data/cardDefinitions";
import { isHiddenPlayCardId } from "../../../game/engine/humanPlayView";
import type { CardInstanceId, GameState, Player, PlayerId } from "../../../game/engine/types";
import type { DisplayLocale } from "../../../app/locale";
import { getCardDefinition } from "../localGameView";
import {
  formatPublicRecentAction,
  getPublicRecentAction,
} from "../publicRecentAction";
import {
  getCardDisplayName,
  getCardTypeDisplayName,
  getPlayerDisplayNameById,
} from "../presentationLocale";
import type { PlayerControllerSelection } from "../localGameSession";
import {
  getOfficialHumanViewerPlayerId,
  getOfficialPlayState,
} from "../officialPlayView";
import type { DeskHandReveal, PlayPresentationModel, PresentationCardSlot } from "./playPresentationTypes";

export type BuildPlayPresentationModelInput = Readonly<{
  game: GameState;
  playerControllers: PlayerControllerSelection;
  locale: DisplayLocale;
  ownPlayerId: PlayerId;
  opponentPlayerId: PlayerId;
  opponentHandReveal: DeskHandReveal;
  ownHandDisabled: boolean;
  opponentHandDisabled: boolean;
  ownSelectableCardIds?: readonly CardInstanceId[];
  opponentSelectableCardIds?: readonly CardInstanceId[];
  selectedCardId?: CardInstanceId;
  selectedCardIds?: readonly CardInstanceId[];
  highlightCardId?: CardInstanceId;
}>;

function buildHandSlots(
  game: GameState,
  player: Player,
  reveal: DeskHandReveal,
  handDisabled: boolean,
  selectableCardIds: readonly CardInstanceId[] | undefined,
  selectedCardId: CardInstanceId | undefined,
  selectedCardIds: readonly CardInstanceId[] | undefined,
  highlightCardId: CardInstanceId | undefined,
  locale: DisplayLocale,
): PresentationCardSlot[] {
  const isEnglish = locale === "en";
  return player.hand.map((cardInstanceId) => {
    const isSelectable = selectableCardIds ? selectableCardIds.includes(cardInstanceId) : true;
    const disabled = handDisabled || !isSelectable;
    const selected =
      !disabled &&
      (selectedCardId === cardInstanceId || (selectedCardIds?.includes(cardInstanceId) ?? false));
    const highlighted = highlightCardId === cardInstanceId;
    const interactive = !disabled;

    if (reveal === "backs" || isHiddenPlayCardId(cardInstanceId)) {
      return {
        cardInstanceId,
        displayName: "",
        typeLabel: "",
        isIon: false,
        selected: false,
        highlighted: false,
        disabled: true,
        interactive: false,
      };
    }

    const definition = getCardDefinition(game, cardInstanceId);
    if (!definition) {
      return {
        cardInstanceId,
        displayName: isEnglish ? "Unknown" : "未知",
        typeLabel: "",
        isIon: false,
        selected,
        highlighted,
        disabled,
        interactive,
      };
    }

    const isIon = definition.type === "ion";
    return {
      cardInstanceId,
      displayName: getCardDisplayName(definition.id, definition.name, locale),
      typeLabel: getCardTypeDisplayName(definition.type, locale),
      isIon,
      selected,
      highlighted,
      disabled,
      interactive,
    };
  });
}

export function buildPlayPresentationModel(input: BuildPlayPresentationModelInput): PlayPresentationModel {
  const {
    game,
    playerControllers,
    locale,
    ownPlayerId,
    opponentPlayerId,
    opponentHandReveal,
    ownHandDisabled,
    opponentHandDisabled,
    ownSelectableCardIds,
    opponentSelectableCardIds,
    selectedCardId,
    selectedCardIds,
    highlightCardId,
  } = input;

  const playGame = getOfficialPlayState(game, playerControllers);
  const isEnglish = locale === "en";
  const ownPlayer = playGame.players.find((player) => player.id === ownPlayerId);
  const opponentPlayer = playGame.players.find((player) => player.id === opponentPlayerId);
  if (!ownPlayer || !opponentPlayer) {
    throw new Error("Play presentation requires own and opponent players.");
  }

  const viewerId = getOfficialHumanViewerPlayerId(playerControllers);
  const effectiveOpponentReveal: DeskHandReveal =
    viewerId !== undefined && opponentPlayer.id !== viewerId ? "backs" : opponentHandReveal;

  const ref = playGame.tableReference;
  const refDefinition = ref ? cardDefinitionsById.get(ref.definitionId) : undefined;
  const refName = ref
    ? getCardDisplayName(ref.definitionId, ref.displayName, locale)
    : undefined;
  const recent = getPublicRecentAction(playGame);
  const recentView = recent ? formatPublicRecentAction(recent, locale) : undefined;
  const recentKindLabels = {
    "card-play": ["打出", "Played"],
    response: ["响应", "Responded with"],
    "status-handling": ["处理状态", "Handled status with"],
    diy: ["主动 DIY", "Active DIY"],
  } as const;

  return {
    opponentHand: {
      reveal: effectiveOpponentReveal,
      cards: buildHandSlots(
        playGame,
        opponentPlayer,
        effectiveOpponentReveal,
        opponentHandDisabled,
        opponentSelectableCardIds,
        selectedCardId,
        selectedCardIds,
        highlightCardId,
        locale,
      ),
    },
    ownHand: buildHandSlots(
      playGame,
      ownPlayer,
      "faces",
      ownHandDisabled,
      ownSelectableCardIds,
      selectedCardId,
      selectedCardIds,
      highlightCardId,
      locale,
    ),
    center: {
      referenceName: refName,
      referenceTypeLabel: refDefinition
        ? getCardTypeDisplayName(refDefinition.type, locale)
        : undefined,
      referenceIsIon: refDefinition?.type === "ion",
      referenceHeading: isEnglish ? "Table reference" : "场面基准",
      referenceEmptyLabel: isEnglish ? "No reference card yet" : "暂无场面基准牌",
      referenceHintLabel: isEnglish
        ? "Play any eligible card to set the first reference"
        : "可打出任意符合条件的牌建立首张基准",
      cycleRoundLabel:
        ref
          ? isEnglish
            ? `Cycle ${ref.cycle} · Round ${ref.round}`
            : `周期 ${ref.cycle} · 轮次 ${ref.round}`
          : undefined,
      recentTitle: recentView
        ? `${getPlayerDisplayNameById(recentView.actorId, locale, playGame.logPresentationContext)} · ${recentKindLabels[recentView.kind][isEnglish ? 1 : 0]}`
        : undefined,
      recentName: recentView?.name,
      recentTypeLabel: recentView?.typeLabel,
      deckLabel: isEnglish ? "Deck" : "牌堆",
      discardLabel: isEnglish ? "Discard" : "弃牌堆",
      deckCount: playGame.deck.length,
      discardCount: playGame.discardPile.length,
    },
  };
}
