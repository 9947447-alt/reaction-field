import type { CardInstanceId } from "../../../game/engine/types";
import type { DeskCanvasHitRegion, PlayPresentationCenter } from "./playPresentationTypes";

export function readDeskCanvasCenterSummary(container: ParentNode): PlayPresentationCenter | undefined {
  const canvas = container.querySelector('[data-testid="desk-table-surface-canvas"]');
  if (!canvas || !(canvas instanceof HTMLCanvasElement) || !canvas.dataset.centerSummary) {
    return undefined;
  }
  return JSON.parse(canvas.dataset.centerSummary) as PlayPresentationCenter;
}

export function readDeskCanvasHitRegions(container: ParentNode): DeskCanvasHitRegion[] {
  const canvas = container.querySelector('[data-testid="desk-table-surface-canvas"]');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    return [];
  }
  const raw = canvas.dataset.hitRegions;
  if (!raw) {
    return [];
  }
  return JSON.parse(raw) as DeskCanvasHitRegion[];
}

export function getDeskCanvasSelectedCardId(container: ParentNode): CardInstanceId | undefined {
  const canvas = container.querySelector('[data-testid="desk-table-surface-canvas"]');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    return undefined;
  }
  const value = canvas.dataset.selectedCardId;
  return value ? (value as CardInstanceId) : undefined;
}

export function readDeskCanvasSelectedCardIds(container: ParentNode): CardInstanceId[] {
  const canvas = container.querySelector('[data-testid="desk-table-surface-canvas"]');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    return [];
  }
  const raw = canvas.dataset.selectedCardIds;
  if (!raw) {
    return [];
  }
  return raw.split(",").filter(Boolean) as CardInstanceId[];
}

export function clickDeskCanvasCard(container: ParentNode, cardInstanceId: CardInstanceId) {
  const canvas = container.querySelector('[data-testid="desk-table-surface-canvas"]');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Desk table canvas is missing.");
  }
  const regions = readDeskCanvasHitRegions(container);
  const region = regions.find((entry) => entry.cardInstanceId === cardInstanceId);
  if (!region) {
    throw new Error(`No hit region for card ${cardInstanceId}`);
  }
  const rect = canvas.getBoundingClientRect();
  const cssWidth = Number.parseFloat(canvas.style.width) || rect.width;
  const cssHeight = Number.parseFloat(canvas.style.height) || rect.height;
  const clientX = rect.left + ((region.x + region.width / 2) * rect.width) / cssWidth;
  const clientY = rect.top + ((region.y + region.height / 2) * rect.height) / cssHeight;
  canvas.dispatchEvent(
    new CustomEvent("desk-select-card", {
      bubbles: true,
      detail: cardInstanceId,
    }),
  );
}

export function readDeskCanvasHighlightedCardIds(container: ParentNode): CardInstanceId[] {
  const canvas = container.querySelector('[data-testid="desk-table-surface-canvas"]');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    return [];
  }
  const raw = canvas.dataset.highlightedCardIds;
  if (!raw) {
    return [];
  }
  return raw.split(",").filter(Boolean) as CardInstanceId[];
}

export async function waitForDeskCanvasSelectedCard(
  container: ParentNode,
  expected: CardInstanceId | "",
) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (getDeskCanvasSelectedCardId(container) === expected) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Expected selected card ${expected || "(none)"} on desk canvas.`);
}

export async function waitForDeskCanvas(container: ParentNode) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (container.querySelector('[data-testid="desk-table-surface-canvas"]')) {
      if (readDeskCanvasHitRegions(container).length > 0) {
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("Desk canvas hit regions never became available.");
}

export function countDeskCanvasZones(
  container: ParentNode,
  zone: "opponent" | "own",
  options?: Readonly<{ interactiveOnly?: boolean; withDisplayName?: boolean }>,
): number {
  return readDeskCanvasHitRegions(container).filter((region) => {
    if (region.zone !== zone) return false;
    if (options?.interactiveOnly && !region.interactive) return false;
    if (options?.withDisplayName && !region.displayName) return false;
    return true;
  }).length;
}
