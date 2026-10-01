import type { CardInstanceId } from "../../../game/engine/types";

export const DESK_CARD_WIDTH = 108;
export const DESK_CARD_HEIGHT = 160;
export const DESK_CARD_SELECTED_LIFT = 16;

export type DeskHandReveal = "backs" | "faces";

export type PresentationCardSlot = Readonly<{
  cardInstanceId: CardInstanceId;
  displayName: string;
  typeLabel: string;
  isIon: boolean;
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
  interactive: boolean;
}>;

export type PlayPresentationCenter = Readonly<{
  referenceName?: string;
  referenceTypeLabel?: string;
  referenceIsIon?: boolean;
  referenceHeading?: string;
  referenceEmptyLabel: string;
  referenceHintLabel: string;
  cycleRoundLabel?: string;
  recentTitle?: string;
  recentName?: string;
  recentTypeLabel?: string;
  deckLabel: string;
  discardLabel: string;
  deckCount: number;
  discardCount: number;
}>;

export type PlayPresentationModel = Readonly<{
  opponentHand: Readonly<{
    reveal: DeskHandReveal;
    cards: readonly PresentationCardSlot[];
  }>;
  ownHand: readonly PresentationCardSlot[];
  center: PlayPresentationCenter;
}>;

export type DeskCanvasHitRegion = Readonly<{
  cardInstanceId: CardInstanceId;
  zone: "opponent" | "own";
  x: number;
  y: number;
  width: number;
  height: number;
  displayName: string;
  interactive: boolean;
}>;

export type DeskCanvasLayout = Readonly<{
  width: number;
  height: number;
  hitRegions: readonly DeskCanvasHitRegion[];
}>;
