import type { CardInstanceId } from "../../../game/engine/types";
import {
  DESK_CARD_HEIGHT,
  DESK_CARD_SELECTED_LIFT,
  DESK_CARD_WIDTH,
  type PlayPresentationModel,
  type PresentationCardSlot,
} from "./playPresentationTypes";

export const DESK_SELECTION_LIFT_DURATION_MS = 160;
export const DESK_PLAY_FLY_DURATION_MS = 220;

export type DeskCenterPanelGeometry = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export function getDeskCenterPanelGeometry(width: number, height: number): DeskCenterPanelGeometry {
  const panelWidth = Math.min(width - 24, 420);
  const panelHeight = Math.min(180, height * 0.42);
  return {
    x: (width - panelWidth) / 2,
    y: (height - panelHeight) / 2,
    width: panelWidth,
    height: panelHeight,
  };
}

export function getDeskCenterFlyTarget(width: number, height: number): Readonly<{ x: number; y: number }> {
  const panel = getDeskCenterPanelGeometry(width, height);
  return {
    x: panel.x + panel.width / 2 - DESK_CARD_WIDTH / 2,
    y: panel.y + 52,
  };
}

export function easeOutCubic(progress: number): number {
  const t = Math.min(1, Math.max(0, progress));
  return 1 - (1 - t) ** 3;
}

export function stepToward(
  current: number,
  target: number,
  deltaMs: number,
  durationMs: number,
): number {
  if (current === target) {
    return current;
  }
  const step = (Math.abs(target - current) / durationMs) * deltaMs;
  if (step <= 0) {
    return target;
  }
  if (current < target) {
    return Math.min(target, current + step);
  }
  return Math.max(target, current - step);
}

export function targetLiftForCard(
  cardInstanceId: CardInstanceId,
  selectedCardId: CardInstanceId | undefined,
  selectedCardIds: readonly CardInstanceId[],
): number {
  if (selectedCardId === cardInstanceId || selectedCardIds.includes(cardInstanceId)) {
    return DESK_CARD_SELECTED_LIFT;
  }
  return 0;
}

export function inferSingleOwnHandCardRemoved(
  previous: PlayPresentationModel,
  next: PlayPresentationModel,
): PresentationCardSlot | undefined {
  const nextIds = new Set(next.ownHand.map((card) => card.cardInstanceId));
  const removed = previous.ownHand.filter((card) => !nextIds.has(card.cardInstanceId));
  if (removed.length !== 1) {
    return undefined;
  }
  return removed[0];
}

export type DeskPlayFlyMotion = Readonly<{
  cardInstanceId: CardInstanceId;
  slot: PresentationCardSlot;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startedAtMs: number;
}>;

export function playFlyProgress(nowMs: number, motion: DeskPlayFlyMotion): number {
  return easeOutCubic((nowMs - motion.startedAtMs) / DESK_PLAY_FLY_DURATION_MS);
}

export function isPlayFlyComplete(nowMs: number, motion: DeskPlayFlyMotion): boolean {
  return nowMs - motion.startedAtMs >= DESK_PLAY_FLY_DURATION_MS;
}

export function playFlyPosition(
  motion: DeskPlayFlyMotion,
  progress: number,
): Readonly<{ x: number; y: number }> {
  const t = Math.min(1, Math.max(0, progress));
  return {
    x: motion.fromX + (motion.toX - motion.fromX) * t,
    y: motion.fromY + (motion.toY - motion.fromY) * t,
  };
}
