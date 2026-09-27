import {
  DESK_CARD_HEIGHT,
  DESK_CARD_SELECTED_LIFT,
  DESK_CARD_WIDTH,
  type DeskCanvasHitRegion,
  type DeskCanvasLayout,
  type PlayPresentationModel,
} from "./playPresentationTypes";

const HAND_GAP = 8;
const ZONE_PADDING = 6;

function layoutHandRow(
  cards: readonly { cardInstanceId: string; selected: boolean; interactive: boolean; displayName: string }[],
  zone: "opponent" | "own",
  y: number,
  width: number,
  align: "start" | "end",
): { height: number; regions: DeskCanvasHitRegion[] } {
  if (cards.length === 0) {
    return { height: 0, regions: [] };
  }

  const totalWidth = cards.length * DESK_CARD_WIDTH + (cards.length - 1) * HAND_GAP;
  const startX = align === "start"
    ? Math.max(ZONE_PADDING, (width - totalWidth) / 2)
    : Math.max(ZONE_PADDING, width - totalWidth - ZONE_PADDING);

  const regions: DeskCanvasHitRegion[] = [];
  let x = startX;
  for (const card of cards) {
    const lift = zone === "own" && card.selected ? DESK_CARD_SELECTED_LIFT : 0;
    const cardY = zone === "own" ? y - lift : y;
    regions.push({
      cardInstanceId: card.cardInstanceId,
      zone,
      x,
      y: cardY,
      width: DESK_CARD_WIDTH,
      height: DESK_CARD_HEIGHT,
      displayName: card.displayName,
      interactive: card.interactive,
    });
    x += DESK_CARD_WIDTH + HAND_GAP;
  }

  const rowHeight = DESK_CARD_HEIGHT + (zone === "own" ? DESK_CARD_SELECTED_LIFT : 0);
  return { height: rowHeight, regions };
}

export function layoutDeskTableSurface(
  model: PlayPresentationModel,
  width: number,
  height: number,
): DeskCanvasLayout {
  const safeWidth = Math.max(1, Math.floor(width));
  const safeHeight = Math.max(1, Math.floor(height));

  const opponentRow = layoutHandRow(
    model.opponentHand.cards,
    "opponent",
    ZONE_PADDING,
    safeWidth,
    "start",
  );

  const ownRow = layoutHandRow(
    model.ownHand,
    "own",
    safeHeight - DESK_CARD_HEIGHT - ZONE_PADDING,
    safeWidth,
    "start",
  );

  return {
    width: safeWidth,
    height: safeHeight,
    hitRegions: [...opponentRow.regions, ...ownRow.regions],
  };
}

export function hitTestDeskTableSurface(
  layout: DeskCanvasLayout,
  x: number,
  y: number,
): DeskCanvasHitRegion | undefined {
  for (let index = layout.hitRegions.length - 1; index >= 0; index -= 1) {
    const region = layout.hitRegions[index];
    if (
      region.interactive &&
      x >= region.x &&
      x <= region.x + region.width &&
      y >= region.y &&
      y <= region.y + region.height
    ) {
      return region;
    }
  }
  return undefined;
}
