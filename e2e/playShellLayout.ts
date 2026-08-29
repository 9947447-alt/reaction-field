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
