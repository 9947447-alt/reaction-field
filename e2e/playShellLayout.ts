import { expect, type Page } from "@playwright/test";

export type PlayShellLayoutSnapshot = {
  columnCount: number;
  columns: string;
  surfaceVisible: boolean;
  sidebarVisible: boolean;
};

export async function readPlayShellLayout(page: Page): Promise<PlayShellLayoutSnapshot> {
  await page.evaluate(() => window.scrollTo(0, 0));
  return page.evaluate(() => {
    const shell = document.querySelector(".play-shell-layout");
    const surface = document.querySelector(".play-surface");
    const sidebar = document.querySelector(".play-sidebar");
    if (!shell || !surface || !sidebar) {
      throw new Error("Play shell landmarks are missing");
    }

    const vis = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return rect.top < window.innerHeight
        && rect.bottom > 0
        && rect.left < window.innerWidth
        && rect.right > 0;
    };

    const columns = getComputedStyle(shell).gridTemplateColumns;
    return {
      columnCount: columns.trim().split(/\s+/u).filter(Boolean).length,
      columns,
      surfaceVisible: vis(surface),
      sidebarVisible: vis(sidebar),
    };
  });
}

export async function expectPortraitPlayShell(page: Page) {
  const layout = await readPlayShellLayout(page);
  expect(layout.columnCount, `portrait columns: ${layout.columns}`).toBe(1);
}

export async function expectLandscapePlayShell(page: Page) {
  const layout = await readPlayShellLayout(page);
  expect(layout.columnCount, `landscape columns: ${layout.columns}`).toBe(2);
  expect(layout.surfaceVisible, "play-surface must intersect the landscape viewport").toBe(true);
  expect(layout.sidebarVisible, "play-sidebar must intersect the landscape viewport").toBe(true);
}

export async function expectLandscapeDeskTable(page: Page) {
  await expect(page.locator('[data-testid="desk-table"]')).toBeVisible();
  // 1. 对手区与手牌横排
  await expect(page.locator(".desk-table__opponent-zone .official-hand-row")).toBeVisible();
  // 2. 中央场面牌
  await expect(page.locator(".desk-table__center-zone .table-center-board")).toBeVisible();
  // 3. 己方手牌横排
  await expect(page.locator(".desk-table__own-zone .official-hand-row")).toBeVisible();
  // 4. 桌底 1~3 个大按钮操作条
  await expect(page.locator(".desk-action-bar")).toBeVisible();
  const buttons = page.locator(".desk-action-bar .desk-action-btn");
  const count = await buttons.count();
  expect(count).toBeGreaterThanOrEqual(1);
  expect(count).toBeLessThanOrEqual(3);
}
