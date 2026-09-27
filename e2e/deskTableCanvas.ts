import { expect, type Locator, type Page } from "@playwright/test";

type DeskCanvasHitRegion = Readonly<{
  cardInstanceId: string;
  zone: "opponent" | "own";
  x: number;
  y: number;
  width: number;
  height: number;
  displayName: string;
  interactive: boolean;
}>;

export async function readHitRegions(page: Page): Promise<DeskCanvasHitRegion[]> {
  return page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="desk-table-surface-canvas"]');
    if (!canvas || !(canvas instanceof HTMLCanvasElement) || !canvas.dataset.hitRegions) {
      return [];
    }
    return JSON.parse(canvas.dataset.hitRegions) as DeskCanvasHitRegion[];
  });
}

export async function expectDeskTableSurfaceCanvas(page: Page) {
  await expect(page.locator('[data-testid="desk-table-surface-canvas"]')).toBeVisible();
}

export async function clickDeskCanvasCardByIndex(
  page: Page,
  zone: "opponent" | "own",
  index: number,
) {
  const canvas = page.locator('[data-testid="desk-table-surface-canvas"]');
  await expect(canvas).toBeVisible();
  const regions = (await readHitRegions(page)).filter((region) => region.zone === zone);
  const region = regions[index];
  if (!region) {
    throw new Error(`No ${zone} canvas card at index ${index}`);
  }
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error("Canvas bounding box is missing.");
  }
  const cssWidth = await canvas.evaluate((node) => Number.parseFloat(node.style.width) || node.clientWidth);
  const cssHeight = await canvas.evaluate((node) => Number.parseFloat(node.style.height) || node.clientHeight);
  const x = box.x + ((region.x + region.width / 2) * box.width) / cssWidth;
  const y = box.y + ((region.y + region.height / 2) * box.height) / cssHeight;
  await page.mouse.click(x, y);
}

export async function clickDeskCanvasCardByDisplayName(page: Page, displayName: string) {
  const regions = await readHitRegions(page);
  const region = regions.find((entry) => entry.displayName === displayName);
  if (!region) {
    throw new Error(`No canvas card named ${displayName}`);
  }
  const canvas = page.locator('[data-testid="desk-table-surface-canvas"]');
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error("Canvas bounding box is missing.");
  }
  const cssWidth = await canvas.evaluate((node) => Number.parseFloat(node.style.width) || node.clientWidth);
  const cssHeight = await canvas.evaluate((node) => Number.parseFloat(node.style.height) || node.clientHeight);
  const x = box.x + ((region.x + region.width / 2) * box.width) / cssWidth;
  const y = box.y + ((region.y + region.height / 2) * box.height) / cssHeight;
  await page.mouse.click(x, y);
}

export async function countDeskCanvasCards(page: Page, zone: "opponent" | "own") {
  const regions = (await readHitRegions(page)).filter((entry) => entry.zone === zone);
  return regions.length;
}

export async function readDeskCanvasCenterSummary(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="desk-table-surface-canvas"]');
    if (!canvas || !(canvas instanceof HTMLCanvasElement) || !canvas.dataset.centerSummary) {
      return undefined;
    }
    return JSON.parse(canvas.dataset.centerSummary) as {
      referenceName?: string;
      recentName?: string;
      recentTitle?: string;
    };
  });
}

export async function readDeskCanvasSelectedCardId(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="desk-table-surface-canvas"]');
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      return "";
    }
    return canvas.dataset.selectedCardId ?? "";
  });
}

export async function readDeskCanvasHighlightedCardIds(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="desk-table-surface-canvas"]');
    if (!canvas || !(canvas instanceof HTMLCanvasElement) || !canvas.dataset.highlightedCardIds) {
      return [];
    }
    return canvas.dataset.highlightedCardIds.split(",").filter(Boolean);
  });
}

export async function expectTutorialOpponentHandHidden(page: Page, hiddenNames: readonly string[]) {
  const opponentZone = page.locator(".desk-table__opponent-zone");
  await expectDeskTableSurfaceCanvas(page);
  const regions = (await readHitRegions(page)).filter((region) => region.zone === "opponent");
  expect(regions.length).toBeGreaterThan(0);
  expect(regions.every((region) => !region.displayName)).toBe(true);
  await expect(opponentZone.locator(".official-card__name")).toHaveCount(0);
  for (const name of hiddenNames) {
    await expect(opponentZone).not.toContainText(name);
  }
}
