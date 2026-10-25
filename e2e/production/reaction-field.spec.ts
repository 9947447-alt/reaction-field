import { execFileSync } from "node:child_process";
import { expect, test as base, type Locator, type Page } from "@playwright/test";
import {
  clickDeskCanvasCardByDisplayName,
  clickDeskCanvasCardByIndex,
  countDeskCanvasCards,
  expectDeskTableSurfaceCanvas,
  expectTutorialOpponentHandHidden,
  readDeskCanvasCenterSummary,
  readDeskCanvasHighlightedCardIds,
  readDeskCanvasSelectedCardId,
  readHitRegions,
} from "../deskTableCanvas";
import {
  expectLandscapeDeskTable,
  expectLandscapePlayShell,
  expectPortraitPlayShell,
} from "../playShellLayout";

function readExpectedBuildCommit(): string {
  const commit = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  if (!/^[0-9a-f]{12}$/u.test(commit)) {
    throw new Error(`Expected a 12-character lowercase Git SHA, received: ${commit}`);
  }
  return commit;
}

const expectedBuildCommit = readExpectedBuildCommit();

const test = base.extend<{
  externalRequests: string[];
  networkFailures: string[];
  runtimeErrors: string[];
}>({
  externalRequests: async ({ page }, use) => {
    const failures: string[] = [];
    const baseOrigin = new URL("http://127.0.0.1:4175").origin;
    page.on("request", (request) => {
      const url = request.url();
      if (/^https?:/u.test(url) && new URL(url).origin !== baseOrigin) {
        failures.push(`${request.method()} ${url}`);
      }
    });
    await use(failures);
    expect(failures).toEqual([]);
  },
  networkFailures: async ({ page }, use) => {
    const failures: string[] = [];
    const baseOrigin = new URL("http://127.0.0.1:4175").origin;
    page.on("requestfailed", (request) => {
      if (new URL(request.url()).origin === baseOrigin) {
        failures.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? "unknown"}`);
      }
    });
    page.on("response", (response) => {
      if (new URL(response.url()).origin === baseOrigin && (response.status() < 200 || response.status() >= 400)) {
        failures.push(`response: ${response.status()} ${response.url()}`);
      }
    });
    await use(failures);
    expect(failures).toEqual([]);
  },
  runtimeErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") errors.push(`${message.type()}: ${message.text()}`);
    });
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    await use(errors);
    expect(errors).toEqual([]);
  },
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "language", {
      configurable: true,
      get: () => "zh-CN",
    });
    Object.defineProperty(Navigator.prototype, "languages", {
      configurable: true,
      get: () => ["zh-CN"],
    });

    let seed = 42;
    Math.random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  });
});

async function expectNoHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    bodyClient: document.body.clientWidth,
    bodyScroll: document.body.scrollWidth,
    documentClient: document.documentElement.clientWidth,
    documentScroll: document.documentElement.scrollWidth,
  }));
  expect(widths.bodyScroll).toBeLessThanOrEqual(widths.bodyClient);
  expect(widths.documentScroll).toBeLessThanOrEqual(widths.documentClient);
}

async function readDeskActionLayout(page: Page) {
  return page.evaluate(() => {
    const bounds = (selector: string) => {
      const node = document.querySelector<HTMLElement>(selector);
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      const round = (value: number) => Math.round(value * 100) / 100;
      return {
        left: round(rect.left),
        right: round(rect.right),
        top: round(rect.top),
        bottom: round(rect.bottom),
        width: round(rect.width),
        height: round(rect.height),
      };
    };
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight, scrollX: window.scrollX },
      body: { clientWidth: document.body.clientWidth, scrollWidth: document.body.scrollWidth },
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      },
      actionBar: bounds(".desk-action-bar"),
      buttons: bounds(".desk-action-bar__buttons"),
      trigger: bounds('[data-testid="desk-action-menu-trigger"]'),
      menu: bounds(".desk-action-menu"),
      primaryButtonCount: document.querySelectorAll(
        ".desk-action-bar__buttons > button.desk-action-btn",
      ).length,
    };
  });
}

async function startTwoPlayerGame(page: Page, player1Character: string, player2Character: string) {
  await page.goto("/play");
  await page.getByLabel("对局模式").selectOption("two_player");
  await page.getByLabel("player_1 角色").selectOption(player1Character);
  await page.getByLabel("player_2 角色").selectOption(player2Character);
  await page.getByRole("button", { name: "开始游戏" }).click();
  await expectLandscapeDeskTable(page);
}

async function openMainActionMenu(page: Page, locale: "zh" | "en") {
  const label = locale === "en" ? "More actions" : "更多操作";
  const trigger = page.getByTestId("desk-action-menu-trigger");
  await expect(trigger).toBeVisible();
  await trigger.click();
  const menu = page.getByRole("menu", { name: label });
  await expect(menu).toBeVisible();
  return menu;
}

async function visibleActionByName(page: Page, chineseName: string, englishName: string): Promise<Locator | undefined> {
  const name = new RegExp(`^(?:${chineseName}|${englishName})$`, "u");
  const actionBar = page.locator(".desk-action-bar");
  for (const role of ["button", "menuitem"] as const) {
    const matches = actionBar.getByRole(role, { name, exact: true });
    for (let index = 0; index < await matches.count(); index += 1) {
      const match = matches.nth(index);
      if (await match.isVisible()) return match;
    }
  }
  return undefined;
}

async function findCardWithEffectAndReferenceRoutes(page: Page): Promise<string> {
  const ownCards = (await readHitRegions(page)).filter((region) => region.zone === "own");
  for (let index = 0; index < ownCards.length; index += 1) {
    const card = ownCards[index];
    if (!card?.interactive || /SO2/iu.test(card.displayName)) continue;
    await clickDeskCanvasCardByIndex(page, "own", index);
    await expect(page.locator(".desk-action-bar__hint")).toContainText(card.displayName);

    const trigger = page.getByTestId("desk-action-menu-trigger");
    let menuOpen = false;
    if (await trigger.isVisible()) {
      await trigger.click();
      await expect(page.getByRole("menu")).toBeVisible();
      menuOpen = true;
    }

    const effect = await visibleActionByName(page, "执行效果", "Run Effect");
    const reference = await visibleActionByName(page, "普通出牌", "Play");
    if (effect && reference && await effect.isEnabled() && await reference.isEnabled()) {
      if (menuOpen) await page.keyboard.press("Escape");
      return card.displayName;
    }

    if (menuOpen) await page.keyboard.press("Escape");
    await clickDeskCanvasCardByIndex(page, "own", index);
  }

  throw new Error("No visible hand card has both a legal effect route and a legal reference-play route.");
}

async function clickDeskCanvasCardByTouch(page: Page, zone: "opponent" | "own", index: number) {
  const canvas = page.locator('[data-testid="desk-table-surface-canvas"]');
  await expect(canvas).toBeVisible();
  const regions = (await readHitRegions(page)).filter((region) => region.zone === zone);
  const region = regions[index];
  if (!region) throw new Error(`No ${zone} canvas card at index ${index}`);
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas bounding box is missing.");
  const cssWidth = await canvas.evaluate((node) => Number.parseFloat(node.style.width) || node.clientWidth);
  const cssHeight = await canvas.evaluate((node) => Number.parseFloat(node.style.height) || node.clientHeight);
  const x = box.x + ((region.x + region.width / 2) * box.width) / cssWidth;
  const y = box.y + ((region.y + region.height / 2) * box.height) / cssHeight;
  await page.touchscreen.tap(x, y);
}

for (const [path, playPath, assetPrefix, brandPrefix] of [["/", "/play", "/assets/", "/"], ["/playtest/", "/playtest/play", "/playtest/assets/", "/playtest/"]] as const) {
  test(`正式构建在 ${path} 展现大厅三入口与横持遮罩，点击进入 ${playPath} 且无横向溢出`, async ({ page, externalRequests, networkFailures, runtimeErrors }) => {
    void externalRequests;
    void runtimeErrors;
    void networkFailures;
    const successfulAssets: { contentType: string | null; path: string; resourceType: string }[] = [];
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (url.origin === "http://127.0.0.1:4175" && response.status() >= 200 && response.status() < 400) {
        successfulAssets.push({
          contentType: response.headers()["content-type"] ?? null,
          path: url.pathname,
          resourceType: response.request().resourceType(),
        });
      }
    });
    await page.goto(path);
    const script = successfulAssets.find((asset) => asset.resourceType === "script");
    const stylesheet = successfulAssets.find((asset) => asset.resourceType === "stylesheet");
    expect(script?.path.startsWith(assetPrefix)).toBe(true);
    expect(script?.contentType).toMatch(/^text\/javascript/u);
    expect(stylesheet?.path.startsWith(assetPrefix)).toBe(true);
    expect(stylesheet?.contentType).toMatch(/^text\/css/u);
    await expect(page).toHaveTitle(/反应域 · REACTION FIELD · Beta 1 · 0\.20\.0-beta\.1/u);
    const iconLinks = await page.locator('link[rel~="icon"]').evaluateAll((links) => links.map((link) => ({
      href: link.getAttribute("href"),
      sizes: link.getAttribute("sizes"),
      type: link.getAttribute("type"),
    })));
    expect(iconLinks).toEqual([
      { href: "./brand/reaction-field-game-icon.svg", sizes: null, type: "image/svg+xml" },
      { href: "./brand/favicon.ico", sizes: null, type: "image/x-icon" },
      { href: "./brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { href: "./brand/favicon-16.png", sizes: "16x16", type: "image/png" },
    ]);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "./brand/apple-touch-icon-180.png");
    const brandAssets = [
      ["brand/reaction-field-game-icon.svg", "image/svg+xml"],
      ["brand/favicon.ico", "image/x-icon"],
      ["brand/favicon-32.png", "image/png"],
      ["brand/favicon-16.png", "image/png"],
      ["brand/apple-touch-icon-180.png", "image/png"],
    ] as const;
    for (const [relativeAssetPath, contentType] of brandAssets) {
      const asset = await page.evaluate(async (assetPath) => {
        const response = await fetch(assetPath, { cache: "no-store" });
        return { contentType: response.headers.get("content-type"), status: response.status };
      }, `${brandPrefix}${relativeAssetPath}`);
      expect(asset.status, relativeAssetPath).toBe(200);
      expect(asset.contentType, relativeAssetPath).toBe(contentType);
    }

    // 1. Assert Lobby Page Presentation
    await expect(page.locator('[data-testid="lobby-page"]')).toBeVisible();
    await expect(page.locator(".lobby-banner")).toBeVisible();
    await expect(page.locator(".lobby-banner__slot-tag")).toHaveCount(0);
    await expect(page.locator(".lobby-banner__image")).toHaveAttribute("src", /lobby-banner\.png$/);
    await expect(page.getByText("占位图")).toHaveCount(0);
    await expect(page.getByText("Phase 20 Lobby Banner Slot")).toHaveCount(0);
    await expect(page.locator(".release-bar .secondary-brand")).toHaveText("REACTION FIELD");

    // Assert Three Mode Entries visible
    const soloCard = page.locator('[data-testid="mode-card-solo"]');
    const duoCard = page.locator('[data-testid="mode-card-duo"]');
    const tutorialCard = page.locator('[data-testid="mode-card-tutorial"]');
    await expect(soloCard).toBeVisible();
    await expect(duoCard).toBeVisible();
    await expect(tutorialCard).toBeVisible();
    await expect(soloCard.locator("img")).toHaveAttribute("src", /mode-solo\.png$/);
    await expect(duoCard.locator("img")).toHaveAttribute("src", /mode-duo\.png$/);
    await expect(tutorialCard.locator("img")).toHaveAttribute("src", /mode-tutorial\.png$/);
    await expect(page.locator("[data-testid^='mode-card-']")).toHaveCount(3);

    // Official Lobby zero debug controls, zero Log IDs, zero JSON
    await expect(page.locator("select[aria-label*='controller'], select[aria-label*='控制方']")).toHaveCount(0);
    await expect(page.locator(".game-log__entry-id")).toHaveCount(0);
    await expect(page.locator("details")).toHaveCount(0);

    // Feedback link
    const feedback = page.getByRole("link", { name: "在新标签页打开 Microsoft Forms 反馈表" });
    await expect(feedback).toHaveAttribute("href", "https://forms.cloud.microsoft/r/QG8PACUnsa");
    await expect(feedback).toHaveAttribute("target", "_blank");
    await expect(feedback).toHaveAttribute("rel", "noopener noreferrer");

    // About Dialog
    await page.getByRole("button", { name: "关于与帮助" }).click();
    const about = page.getByRole("dialog", { name: "关于与帮助" });
    await expect(about).toContainText("REACTION FIELD");
    await expect(about).toContainText("0.20.0-beta.1");
    await expect(about).toContainText("MVP0-P10");
    await expect(about).toContainText(expectedBuildCommit);
    const repository = about.getByRole("link", { name: "在新标签页打开反应域 GitHub 仓库" });
    await expect(repository).toHaveAttribute(
      "href",
      "https://github.com/9947447-alt/reaction-field",
    );
    await page.keyboard.press("Escape");

    // 2. Portrait Viewport: Assert Orientation Barrier blocks interaction
    await page.setViewportSize({ width: 390, height: 844 });
    const barrier = page.locator('[data-testid="orientation-barrier"]');
    await expect(barrier).toBeVisible();
    await expect(barrier).toContainText("请横持设备");
    const officialContent = page.getByTestId("official-route-content");
    await expect(officialContent).toHaveAttribute("aria-hidden", "true");
    await expect(officialContent).toHaveAttribute("inert", "");

    // Tapping button is blocked by barrier overlay
    const soloButton = soloCard.getByRole("button", { name: "进入人机对局" });
    let clickIntercepted = false;
    try {
      await soloButton.click({ timeout: 1500 });
    } catch {
      clickIntercepted = true;
    }
    expect(clickIntercepted).toBe(true);

    // Rotate back to landscape
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(barrier).not.toBeVisible();
    await expect(officialContent).not.toHaveAttribute("aria-hidden");
    await expect(officialContent).not.toHaveAttribute("inert");

    // 3. Click Duo button to navigate to /play
    const duoButton = duoCard.getByRole("button", { name: "进入双人对局" });
    await duoButton.click();
    await expect(page).toHaveURL(new RegExp(playPath.replace("/", "\\/")));

    // Official play setup has zero controller dropdowns
    await expect(page.locator("select[aria-label*='controller'], select[aria-label*='控制方']")).toHaveCount(0);
    await expect(page.locator("details.debug-details")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "反应域 · 本地双人角色选择" })).toBeVisible();
    await page.getByLabel("player_1 角色").selectOption("chemical_factory_ceo");
    await page.getByLabel("player_2 角色").selectOption("acid_king");
    await page.getByRole("button", { name: "开始游戏" }).click();

    // Assert Desk Table 4 Core Pieces
    await expectLandscapeDeskTable(page);
    await expect(page.locator("select[aria-label*='controller'], select[aria-label*='控制方']")).toHaveCount(0);
    await expect(page.locator("details")).toHaveCount(0);
    await expect(page.locator("dl")).toHaveCount(0);
    await expect(page.locator(".action-panel")).toHaveCount(0);

    // Official GameLogDrawer verification
    const logButton = page.locator(".desk-table__log-toggle");
    await expect(logButton).toBeVisible();
    await logButton.click();

    const drawer = page.locator(".game-log-drawer");
    await expect(drawer).toBeVisible();
    const gameLog = drawer.locator(".game-log");
    await expect(gameLog).toBeVisible();
    await expect(gameLog.locator("ol li").first()).toContainText("游戏开始，进入第 1 实验周期。");
    const initialLogCount = await gameLog.locator("ol li").count();
    expect(initialLogCount).toBeGreaterThanOrEqual(1);

    // In-place locale switch to English
    await page.getByRole("button", { name: "English" }).click();
    await expect(gameLog.locator("ol li").first()).toContainText("Game started; entering experiment cycle 1.");
    expect(await gameLog.locator("ol li").count()).toBe(initialLogCount);

    // In-place locale switch back to Chinese
    await page.getByRole("button", { name: "中文" }).click();
    await expect(gameLog.locator("ol li").first()).toContainText("游戏开始，进入第 1 实验周期。");
    expect(await gameLog.locator("ol li").count()).toBe(initialLogCount);

    // Close GameLogDrawer
    await drawer.locator(".game-log-drawer__close").click();
    await expect(drawer).toHaveCount(0);

    await expectDeskTableSurfaceCanvas(page);

    // Action progression log test: click desk action bar button
    await page.getByRole("button", { name: "结束本次行动" }).click();

    // Re-open log drawer to verify progression
    await logButton.click();
    await expect(drawer).toBeVisible();
    const postActionCount = await gameLog.locator("ol li").count();
    expect(postActionCount).toBeGreaterThan(initialLogCount);
    await expect(gameLog.locator("ol li").last()).toContainText("轮到 玩家 B 行动。");

    // In-place translation after action
    await page.getByRole("button", { name: "English" }).click();
    await expect(gameLog.locator("ol li").last()).toContainText("It is Player B's turn.");
    expect(await gameLog.locator("ol li").count()).toBe(postActionCount);
    await page.getByRole("button", { name: "中文" }).click();
    await drawer.locator(".game-log-drawer__close").click();
    await expect(drawer).toHaveCount(0);

    await page.getByRole("button", { name: "按当前阵容重开" }).click();
    await page.getByRole("button", { name: "确认重开" }).click();
    await expectLandscapeDeskTable(page);
    await page.getByRole("button", { name: "返回角色选择" }).click();
    await page.getByRole("button", { name: "确认返回" }).click();
    await expect(page.getByRole("heading", { name: "反应域 · 本地双人角色选择" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    // In portrait viewport in /play, orientation barrier is visible
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('[data-testid="orientation-barrier"]')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}

test("正式构建在 /play 验证 Phase 16 双语游戏日志、反应日志与 DIY 虚拟攻击展示", async ({ page, externalRequests, networkFailures, runtimeErrors }) => {
  void externalRequests;
  void runtimeErrors;
  void networkFailures;

  await page.goto("/play");
  await page.getByLabel("对局模式").selectOption("two_player");
  await page.getByLabel("player_1 角色").selectOption("laboratory_teacher");
  await page.getByLabel("player_2 角色").selectOption("laboratory_teacher");
  await page.getByRole("button", { name: "开始游戏" }).click();

  // Helper to select the first 10 cards in preparation
  async function selectFirstTenPreparationCards(zone: "own" | "opponent") {
    await expectDeskTableSurfaceCanvas(page);
    const regions = (await readHitRegions(page)).filter((region) => region.zone === zone);
    expect(regions).toHaveLength(20);

    for (let index = 0; index < 10; index += 1) {
      await clickDeskCanvasCardByIndex(page, zone, index);
    }

    await page.getByRole("button", { name: /确认备课/u }).click();
  }

  // Player A preparation: keep 10 cards
  await selectFirstTenPreparationCards("own");

  // Player B preparation: keep 10 cards
  await selectFirstTenPreparationCards("opponent");

  await expectLandscapeDeskTable(page);

  // 1. Formal DIY Virtual Attack execution
  await page.getByRole("button", { name: "进入主动 DIY" }).click();

  const virtualAttackRecipes = [
    {
      id: "diy_hcl_from_h_cl",
      components: ["H+", "Cl-"],
      recipeZh: "H+ + Cl- -> 稀 HCl",
      recipeEn: "H+ + Cl- -> dilute HCl",
      productZh: "稀 HCl",
      productEn: "dilute HCl",
      kindZh: "酸性",
      kindEn: "acid",
      amount: 1,
    },
    {
      id: "diy_naoh_from_na_oh",
      components: ["Na+", "OH-"],
      recipeZh: "Na+ + OH- -> 稀 NaOH",
      recipeEn: "Na+ + OH- -> dilute NaOH",
      productZh: "稀 NaOH",
      productEn: "dilute NaOH",
      kindZh: "碱性",
      kindEn: "alkaline",
      amount: 1,
    },
    {
      id: "diy_koh_from_k_oh",
      components: ["K+", "OH-"],
      recipeZh: "K+ + OH- -> 稀 KOH",
      recipeEn: "K+ + OH- -> dilute KOH",
      productZh: "稀 KOH",
      productEn: "dilute KOH",
      kindZh: "碱性",
      kindEn: "alkaline",
      amount: 1,
    },
    {
      id: "diy_h2so4_from_2h_so4",
      components: ["H+", "H+", "SO4^2-"],
      recipeZh: "2H+ + SO4^2- -> 稀 H2SO4",
      recipeEn: "2H+ + SO4^2- -> dilute H2SO4",
      productZh: "稀 H2SO4",
      productEn: "dilute H2SO4",
      kindZh: "酸性",
      kindEn: "acid",
      amount: 1,
    },
    {
      id: "diy_limewater_from_ca_2oh",
      components: ["Ca2+", "OH-", "OH-"],
      recipeZh: "Ca2+ + 2OH- -> 石灰水 Ca(OH)2",
      recipeEn: "Ca2+ + 2OH- -> limewater Ca(OH)2",
      productZh: "石灰水 Ca(OH)2",
      productEn: "limewater Ca(OH)2",
      kindZh: "碱性",
      kindEn: "alkaline",
      amount: 1,
    },
  ];

  let selectedRecipeInfo = virtualAttackRecipes[0];
  const availableCandidates = (await readHitRegions(page))
    .filter((region) => region.zone === "own" && region.interactive)
    .map((region) => ({ name: region.displayName.trim(), displayName: region.displayName }));

  for (const recipeInfo of virtualAttackRecipes) {
    const matchedNames: string[] = [];
    const usedIndices = new Set<number>();

    let allFound = true;
    for (const comp of recipeInfo.components) {
      const foundIdx = availableCandidates.findIndex(
        (candidate, idx) =>
          !usedIndices.has(idx) && (candidate.name === comp || candidate.name.startsWith(comp)),
      );
      if (foundIdx === -1) {
        allFound = false;
        break;
      }
      usedIndices.add(foundIdx);
      matchedNames.push(availableCandidates[foundIdx].displayName);
    }

    if (allFound) {
      selectedRecipeInfo = recipeInfo;
      for (const displayName of matchedNames) {
        await clickDeskCanvasCardByDisplayName(page, displayName);
      }
      break;
    }
  }

  await expect(page.getByRole("button", { name: "执行主动 DIY" })).toBeEnabled();
  await page.getByRole("button", { name: "执行主动 DIY" }).click();

  // Open GameLogDrawer to verify logs
  const logButton = page.locator(".desk-table__log-toggle");
  await logButton.click();
  const drawer = page.locator(".game-log-drawer");
  await expect(drawer).toBeVisible();
  const gameLog = drawer.locator(".game-log");

  // Official play log has no debug details, no Log ID, and no raw JSON
  await expect(gameLog.locator("details.game-log__details")).toHaveCount(0);
  await expect(gameLog.locator(".game-log__entry-id")).toHaveCount(0);
  await expect(page.getByText("日志编号：")).toHaveCount(0);
  await expect(page.getByText("Log ID：")).toHaveCount(0);

  const logItems = gameLog.locator("ol li");
  const diyLog = logItems.last();
  const logCountAfterDiy = await logItems.count();

  // Assert DIY Virtual Attack in Chinese: recipe, virtual product, waiting for response base damage
  const expectedDiyZh = `玩家 A 主动 DIY 使用 ${selectedRecipeInfo.recipeZh}，生成虚拟产品 ${selectedRecipeInfo.productZh}；对 玩家 B 的${selectedRecipeInfo.kindZh}伤害基础值为 ${selectedRecipeInfo.amount} 点，等待响应；不创建实体卡牌。`;
  await expect(diyLog).toContainText(expectedDiyZh);

  // In-place locale switch to English for DIY log
  await page.getByRole("button", { name: "English" }).click();
  const expectedDiyEn = `Player A used active DIY recipe ${selectedRecipeInfo.recipeEn} to produce the virtual product ${selectedRecipeInfo.productEn}; the base ${selectedRecipeInfo.kindEn} damage value to Player B is ${selectedRecipeInfo.amount}, awaiting response; no entity card is created.`;
  await expect(diyLog).toContainText(expectedDiyEn);
  expect(await logItems.count()).toBe(logCountAfterDiy);

  await page.getByRole("button", { name: "中文" }).click();
  await drawer.locator(".game-log-drawer__close").click();
  await expect(drawer).toHaveCount(0);

  // 2. Formal Response execution triggering Reaction
  const opponentRegions = (await readHitRegions(page)).filter((region) => region.zone === "opponent");
  const responseIndex = opponentRegions.findIndex((region) => region.interactive);
  expect(responseIndex).toBeGreaterThanOrEqual(0);
  await clickDeskCanvasCardByIndex(page, "opponent", responseIndex);
  await page.getByRole("button", { name: "打出响应" }).click();

  // Re-open log drawer to verify reaction log
  await logButton.click();
  await expect(drawer).toBeVisible();
  const reactionItem = gameLog.locator("li:has(.game-log__reaction)").last();
  await expect(reactionItem).toBeVisible();
  const reactionLog = reactionItem.locator(".game-log__reaction");
  const logCountAfterReaction = await logItems.count();

  // Assert Reaction in Chinese: neutralization, trigger, outcome
  await expect(reactionLog).toContainText("成功反应 · 酸碱中和");
  await expect(reactionLog).toContainText("入口：单目标伤害响应");
  await expect(reactionLog).toContainText("伤害已完全抵消；生成虚拟结果 H2O");
  await expect(reactionItem.locator(".game-log__message")).toContainText("已记录一项成功反应。");

  // In-place locale switch to English for Reaction log
  await page.getByRole("button", { name: "English" }).click();
  await expect(reactionLog).toContainText("Successful reaction · Acid-base neutralization");
  await expect(reactionLog).toContainText("Entry：Single-target damage response");
  await expect(reactionLog).toContainText("Damage was fully cancelled; virtual result H2O was produced");
  await expect(reactionItem.locator(".game-log__message")).toContainText("A successful reaction was recorded.");
  expect(await logItems.count()).toBe(logCountAfterReaction);

  await page.getByRole("button", { name: "中文" }).click();
  await drawer.locator(".game-log-drawer__close").click();
  await expect(drawer).toHaveCount(0);
});

test("正式构建人机只显示对手牌背与张数，双人仍公开手牌，且手牌支持点选抬起与取消", async ({
  page,
  externalRequests,
  networkFailures,
  runtimeErrors,
}) => {
  void externalRequests;
  void runtimeErrors;
  void networkFailures;

  await page.goto("/play");
  await expect(page.getByText("选择角色与模式后开始；只显示自己的手牌，对手为牌背。")).toBeVisible();
  await page.getByRole("button", { name: "开始游戏" }).click();
  await expect(page.getByRole("heading", { name: "本地人机对局" })).toBeVisible();
  await expect(page.getByText("己方手牌；对手背面")).toBeVisible();

  // 1. Opponent hand in default Solo vs AI (CEO opponent has 14 cards)
  const opponent = page.locator('[aria-labelledby="player_2-title"]');
  const opponentCountText = await opponent.locator(".hand-count-pill").textContent();
  const opponentCount = Number(opponentCountText?.match(/(\d+)/)?.[1]);
  expect(opponentCount).toBe(14);
  await expectDeskTableSurfaceCanvas(page);
  expect(await countDeskCanvasCards(page, "opponent")).toBe(opponentCount);
  expect(
    (await readHitRegions(page)).filter((region) => region.zone === "opponent" && region.displayName),
  ).toHaveLength(0);
  await expect(opponent.locator(".debug-card__select")).toHaveCount(0);
  await expect(opponent.locator("button")).toHaveCount(0);

  // 2. Return to setup, start CEO vs Acid King to test own hand selection in mainAction
  await page.getByRole("button", { name: "返回角色选择" }).click();
  await page.getByRole("button", { name: "确认返回" }).click();
  await page.getByLabel("player_1 角色").selectOption("chemical_factory_ceo");
  await page.getByLabel("player_2 角色").selectOption("acid_king");
  await page.getByRole("button", { name: "开始游戏" }).click();
  await expectLandscapeDeskTable(page);
  await expect(page.locator(".desk-action-bar__phase-tag")).toHaveText("主行动");

  expect(await countDeskCanvasCards(page, "own")).toBe(14);
  const ownRegions = (await readHitRegions(page)).filter((region) => region.zone === "own" && region.interactive);
  expect(ownRegions.length).toBe(14);
  expect(await readDeskCanvasSelectedCardId(page)).toBe("");

  await clickDeskCanvasCardByIndex(page, "own", 0);
  expect(await readDeskCanvasSelectedCardId(page)).toBe(ownRegions[0].cardInstanceId);

  await clickDeskCanvasCardByIndex(page, "own", 0);
  expect(await readDeskCanvasSelectedCardId(page)).toBe("");

  // 3. Two-player mode: reveals card faces and names for both sides
  await page.getByRole("button", { name: "返回角色选择" }).click();
  await page.getByRole("button", { name: "确认返回" }).click();
  await page.getByLabel("对局模式").selectOption("two_player");
  await page.getByLabel("player_1 角色").selectOption("chemical_factory_ceo");
  await page.getByLabel("player_2 角色").selectOption("acid_king");
  await page.getByRole("button", { name: "开始游戏" }).click();
  await expect(page.getByRole("heading", { name: "本地双人公开对局" })).toBeVisible();

  expect(await countDeskCanvasCards(page, "opponent")).toBe(10);
  expect(
    (await readHitRegions(page)).filter((region) => region.zone === "opponent" && region.displayName),
  ).toHaveLength(10);
  expect(await countDeskCanvasCards(page, "own")).toBe(14);
});

test("正式对局壳横屏 844 与 1024 为桌面四件套，竖屏 390 呈现横持遮罩", async ({
  page,
  externalRequests,
  networkFailures,
  runtimeErrors,
}) => {
  void externalRequests;
  void runtimeErrors;
  void networkFailures;

  await page.goto("/play");
  await page.getByLabel("player_1 角色").selectOption("chemical_factory_ceo");
  await page.getByLabel("player_2 角色").selectOption("acid_king");
  await page.getByRole("button", { name: "开始游戏" }).click();
  await expectLandscapeDeskTable(page);

  await page.setViewportSize({ width: 1280, height: 800 });
  await expectLandscapeDeskTable(page);
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 1024, height: 768 });
  await expectLandscapeDeskTable(page);
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 844, height: 390 });
  await expectLandscapeDeskTable(page);
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('[data-testid="orientation-barrier"]')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("生产构建在 /debug 保留调试实验室且品牌图片正常加载无 404", async ({ page, externalRequests, networkFailures, runtimeErrors }) => {
  void externalRequests;
  void runtimeErrors;
  void networkFailures;

  await page.goto("/debug");
  await expect(page.getByRole("heading", { name: /角色选择/u })).toBeVisible();
  const controllerSelects = page.locator("select[aria-label*='controller'], select[aria-label*='控制方']");
  await expect(controllerSelects).toHaveCount(2);

  // Avatar images are visible and their src attribute contains brand/play/ and strictly avoids /debug/brand/
  const teacherAvatar = page.locator('img[src*="char-lab-teacher.png"]').first();
  await expect(teacherAvatar).toBeVisible();
  const teacherSrc = await teacherAvatar.getAttribute("src");
  expect(teacherSrc).toContain("brand/play/");
  expect(teacherSrc).not.toContain("/debug/brand/");

  // Switch to CEO and Acid King to enter mainAction directly without preparation step
  await page.getByLabel("player_1 角色").selectOption("chemical_factory_ceo");
  await page.getByLabel("player_2 角色").selectOption("acid_king");

  // Start game in debug lab
  await page.getByRole("button", { name: "开始游戏" }).click();
  await expect(page.getByRole("heading", { exact: true, name: "主行动" })).toBeVisible();

  // Opponent card-back images are visible and avoid /debug/brand/
  const cardBack = page.locator('.card-back img.card-back__image').first();
  await expect(cardBack).toBeVisible();
  const cardBackSrc = await cardBack.getAttribute("src");
  expect(cardBackSrc).toContain("brand/play/");
  expect(cardBackSrc).not.toContain("/debug/brand/");
});

test("生产构建在 /playtest/debug 下品牌图片正常加载无 404", async ({ page, externalRequests, networkFailures, runtimeErrors }) => {
  void externalRequests;
  void runtimeErrors;
  void networkFailures;

  await page.goto("/playtest/debug");
  await expect(page.getByRole("heading", { name: /角色选择/u })).toBeVisible();
  const teacherAvatar = page.locator('img[src*="char-lab-teacher.png"]').first();
  await expect(teacherAvatar).toBeVisible();
  const teacherSrc = await teacherAvatar.getAttribute("src");
  expect(teacherSrc).toContain("brand/play/");
  expect(teacherSrc).not.toContain("/debug/brand/");
});

test("正式 /play 双人对局保持书记技能、结束行动与 DIY 可达，并更新已用技能菜单", async ({
  page,
  externalRequests,
  networkFailures,
  runtimeErrors,
}) => {
  void externalRequests;
  void runtimeErrors;
  void networkFailures;

  await startTwoPlayerGame(page, "clumsy_party_secretary", "acid_king");
  const actionBar = page.locator(".desk-action-bar");
  const primarySkills = actionBar.locator('.desk-action-bar__buttons > button[data-skill-id]');
  await expect(primarySkills).toHaveCount(3);
  for (const skillId of ["exhaust_leak", "lab_fire", "exothermic_accident"]) {
    const primarySkill = actionBar.locator(`.desk-action-bar__buttons > button[data-skill-id="${skillId}"]`);
    await expect(primarySkill).toBeVisible();
    await expect(primarySkill).toBeEnabled();
  }

  let menu = await openMainActionMenu(page, "zh");
  await expect(menu.getByRole("menuitem")).toHaveCount(2);
  await expect(menu.getByRole("menuitem", { name: "结束本次行动" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "进入主动 DIY" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: /执行效果|普通出牌/u })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);

  menu = await openMainActionMenu(page, "zh");
  await menu.getByRole("menuitem", { name: "进入主动 DIY" }).click();
  await expect(actionBar.locator(".desk-action-bar__phase-tag")).toHaveText("主动 DIY");
  await page.getByRole("button", { name: "取消 DIY" }).click();
  await expect(actionBar.locator(".desk-action-bar__phase-tag")).toHaveText("主行动");

  await page.getByRole("button", { name: "English" }).click();
  menu = await openMainActionMenu(page, "en");
  await expect(menu.getByRole("menuitem", { name: "End Action" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Active DIY" })).toBeVisible();
  await menu.getByRole("menuitem", { name: "End Action" }).click();
  const player2 = page.locator('[aria-labelledby="player_2-title"]');
  await expect(player2.locator(".active-pill")).toHaveText("Active");
  await page.getByRole("button", { name: "中文" }).click();

  await expect(player2.locator(".active-pill")).toHaveText("当前行动");
  await page.getByRole("button", { name: "结束本次行动" }).click();
  await expect(page.locator('[aria-labelledby="player_1-title"] .active-pill')).toHaveText("当前行动");

  await clickDeskCanvasCardByIndex(page, "own", 0);
  menu = await openMainActionMenu(page, "zh");
  const overflowSkill = menu.locator('[data-skill-id="exothermic_accident"]');
  await expect(overflowSkill).toBeVisible();
  await expect(overflowSkill).toBeEnabled();
  await page.screenshot({ path: "test-results/desk-action-menu-desktop.png" });

  await overflowSkill.click();
  await expect(player2.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "9");
  await page.getByRole("button", { name: "结束本次行动" }).click();
  await expect(page.locator('[aria-labelledby="player_1-title"] .active-pill')).toHaveText("当前行动");
  await expect(actionBar.locator("[data-skill-id]")).toHaveCount(0);
  await expect(page.getByTestId("desk-action-menu-trigger")).toHaveCount(0);
});

test("正式 /play 人机模式通过用户界面执行书记技能并更新 AI 对手体力", async ({
  page,
  externalRequests,
  networkFailures,
  runtimeErrors,
}) => {
  void externalRequests;
  void runtimeErrors;
  void networkFailures;

  await page.goto("/play");
  await page.getByLabel("player_1 角色").selectOption("clumsy_party_secretary");
  await page.getByRole("button", { name: "开始游戏" }).click();
  await expect(page.getByRole("heading", { name: "本地人机对局" })).toBeVisible();
  for (const skillId of ["exhaust_leak", "lab_fire", "exothermic_accident"]) {
    await expect(page.locator(`.desk-action-bar [data-skill-id="${skillId}"]`)).toBeVisible();
  }

  await clickDeskCanvasCardByIndex(page, "own", 0);
  const menu = await openMainActionMenu(page, "zh");
  await menu.locator('[data-skill-id="exothermic_accident"]').click();
  await expect(page.locator('[aria-labelledby="player_2-title"] [role="progressbar"]')).toHaveAttribute(
    "aria-valuenow",
    "9",
  );
});

test("正式 /play 同一实体卡可普通出牌或执行效果，重载后候选卡稳定且结果不同", async ({
  page,
  externalRequests,
  networkFailures,
  runtimeErrors,
}) => {
  void externalRequests;
  void runtimeErrors;
  void networkFailures;

  await startTwoPlayerGame(page, "chemical_factory_ceo", "chemical_factory_ceo");
  const firstCard = await findCardWithEffectAndReferenceRoutes(page);
  await expect(page.locator('[aria-labelledby="player_2-title"] [role="progressbar"]')).toHaveAttribute(
    "aria-valuenow",
    "10",
  );
  await openMainActionMenu(page, "zh");
  const ordinaryAction = await visibleActionByName(page, "普通出牌", "Play");
  expect(ordinaryAction).toBeDefined();
  await ordinaryAction!.click();
  await expect(page.locator(".desk-action-bar__phase-tag")).toHaveText("主行动");
  expect((await readDeskCanvasCenterSummary(page))?.referenceName).toBe(firstCard);
  await expect(page.locator('[aria-labelledby="player_2-title"] [role="progressbar"]')).toHaveAttribute(
    "aria-valuenow",
    "10",
  );

  await page.locator(".desk-table__log-toggle").click();
  const referenceLog = page.locator(".game-log ol li").filter({ hasText: "不触发原有效果" });
  await expect(referenceLog).toHaveCount(1);
  const referenceResult = await referenceLog.last().textContent();
  await page.locator(".game-log-drawer__close").click();

  await page.reload();
  await startTwoPlayerGame(page, "chemical_factory_ceo", "chemical_factory_ceo");
  const secondCard = await findCardWithEffectAndReferenceRoutes(page);
  expect(secondCard).toBe(firstCard);

  let effectAction = await visibleActionByName(page, "执行效果", "Run Effect");
  if (!effectAction) {
    await openMainActionMenu(page, "zh");
    effectAction = await visibleActionByName(page, "执行效果", "Run Effect");
  }
  expect(effectAction).toBeDefined();
  await effectAction!.click();
  await expect(page.locator(".desk-action-bar__phase-tag")).toHaveText("响应阶段");
  await expect(page.locator(".desk-action-bar__hint")).toContainText(firstCard);
  await expect(page.locator('[aria-labelledby="player_2-title"] [role="progressbar"]')).toHaveAttribute(
    "aria-valuenow",
    "10",
  );
  await page.locator(".desk-table__log-toggle").click();
  const attackLog = page.locator(".game-log ol li").filter({ hasText: "等待响应" });
  await expect(attackLog).toHaveCount(1);
  await expect(attackLog.last()).toContainText(firstCard);
  expect(await attackLog.last().textContent()).not.toBe(referenceResult);
});

test.describe("正式 /play 触屏横屏主行动菜单", () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

  test("真实触摸可打开菜单并执行溢出的合法书记技能", async ({
    page,
    externalRequests,
    networkFailures,
    runtimeErrors,
  }) => {
    void externalRequests;
    void runtimeErrors;
    void networkFailures;

    await startTwoPlayerGame(page, "clumsy_party_secretary", "acid_king");
    await expectLandscapeDeskTable(page);
    await clickDeskCanvasCardByTouch(page, "own", 0);
    const trigger = page.getByTestId("desk-action-menu-trigger");
    await trigger.tap();
    const menu = page.getByRole("menu", { name: "更多操作" });
    await expect(menu).toBeVisible();
    const skill = menu.locator('[data-skill-id="exothermic_accident"]');
    await expect(skill).toBeVisible();
    await expect(skill).toBeEnabled();
    await page.screenshot({ path: "test-results/desk-action-menu-touch-landscape.png" });

    await skill.tap();
    await expect(page.locator('[aria-labelledby="player_2-title"] [role="progressbar"]')).toHaveAttribute(
      "aria-valuenow",
      "9",
    );
  });
});

test.describe("正式 /play 英文窄屏双人操作栏", () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

  test("书记的 More actions 入口与菜单完整可见，PASS 和 DIY 可达", async ({
    page,
    externalRequests,
    networkFailures,
    runtimeErrors,
  }, testInfo) => {
    void externalRequests;
    void networkFailures;
    void runtimeErrors;

    await startTwoPlayerGame(page, "clumsy_party_secretary", "acid_king");
    await page.getByRole("button", { name: "English" }).click();
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, left: 0 }));

    const before = await readDeskActionLayout(page);
    console.log(`[rf-ui-01-fix1-before] ${JSON.stringify(before)}`);
    expect(before.viewport.scrollX).toBe(0);
    await expectNoHorizontalOverflow(page);
    expect(before.primaryButtonCount).toBeLessThanOrEqual(3);
    expect(before.actionBar).not.toBeNull();
    expect(before.buttons).not.toBeNull();
    expect(before.trigger).not.toBeNull();
    expect(before.actionBar!.left).toBeGreaterThanOrEqual(0);
    expect(before.actionBar!.right).toBeLessThanOrEqual(before.viewport.width);
    expect(before.buttons!.left).toBeGreaterThanOrEqual(before.actionBar!.left);
    expect(before.buttons!.right).toBeLessThanOrEqual(before.actionBar!.right);
    expect(before.trigger!.left).toBeGreaterThanOrEqual(0);
    expect(before.trigger!.right).toBeLessThanOrEqual(before.viewport.width);
    expect(before.trigger!.top).toBeGreaterThanOrEqual(0);
    expect(before.trigger!.bottom).toBeLessThanOrEqual(before.viewport.height);
    expect(before.trigger!.width).toBeGreaterThanOrEqual(44);
    expect(before.trigger!.height).toBeGreaterThanOrEqual(44);

    const trigger = page.getByTestId("desk-action-menu-trigger");
    await trigger.click();
    const menu = page.getByRole("menu", { name: "More actions" });
    const open = await readDeskActionLayout(page);
    console.log(`[rf-ui-01-fix1-after] ${JSON.stringify(open)}`);
    await expectNoHorizontalOverflow(page);
    expect(open.viewport.scrollX).toBe(0);
    expect(open.menu).not.toBeNull();
    expect(open.menu!.left).toBeGreaterThanOrEqual(0);
    expect(open.menu!.right).toBeLessThanOrEqual(open.viewport.width);
    const screenshotPath = testInfo.outputPath("desk-action-menu-after.png");
    await page.screenshot({ path: screenshotPath });
    console.log(`[rf-ui-01-fix1-screenshot] ${screenshotPath}`);
    await expect(menu.getByRole("menuitem", { name: "End Action" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Active DIY" })).toBeVisible();
    await menu.getByRole("menuitem", { name: "Active DIY" }).click();
    await expect(page.locator(".desk-action-bar__phase-tag")).toHaveText("Active DIY");
    await page.getByRole("button", { name: "Cancel DIY" }).click();
    await expect(page.locator(".desk-action-bar__phase-tag")).toHaveText("Main Action");
    await trigger.click();
    await page.getByRole("menuitem", { name: "End Action" }).click();
    await expect(page.locator('[aria-labelledby="player_2-title"] .active-pill')).toHaveText("Active");
  });

  test("中文书记菜单在同一窄屏视口内完整显示", async ({ page, externalRequests, networkFailures, runtimeErrors }) => {
    void externalRequests;
    void networkFailures;
    void runtimeErrors;
    await startTwoPlayerGame(page, "clumsy_party_secretary", "acid_king");
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, left: 0 }));
    const before = await readDeskActionLayout(page);
    expect(before.viewport.scrollX).toBe(0);
    await expectNoHorizontalOverflow(page);
    expect(before.trigger!.left).toBeGreaterThanOrEqual(0);
    expect(before.trigger!.right).toBeLessThanOrEqual(before.viewport.width);
    const menu = await openMainActionMenu(page, "zh");
    const open = await readDeskActionLayout(page);
    await expectNoHorizontalOverflow(page);
    expect(open.menu!.left).toBeGreaterThanOrEqual(0);
    expect(open.menu!.right).toBeLessThanOrEqual(open.viewport.width);
    await expect(menu.getByRole("menuitem", { name: "结束本次行动" })).toBeVisible();
  });
});

test.describe("正式 /play 英文桌面双人操作栏", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("菜单保持在英文桌面视口内", async ({ page, externalRequests, networkFailures, runtimeErrors }) => {
    void externalRequests;
    void networkFailures;
    void runtimeErrors;
    await startTwoPlayerGame(page, "clumsy_party_secretary", "acid_king");
    await page.getByRole("button", { name: "English" }).click();
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, left: 0 }));
    const before = await readDeskActionLayout(page);
    expect(before.viewport.scrollX).toBe(0);
    await expectNoHorizontalOverflow(page);
    expect(before.trigger!.left).toBeGreaterThanOrEqual(0);
    expect(before.trigger!.right).toBeLessThanOrEqual(before.viewport.width);
    const menu = await openMainActionMenu(page, "en");
    const open = await readDeskActionLayout(page);
    await expectNoHorizontalOverflow(page);
    expect(open.menu!.left).toBeGreaterThanOrEqual(0);
    expect(open.menu!.right).toBeLessThanOrEqual(open.viewport.width);
    await expect(menu.getByRole("menuitem", { name: "End Action" })).toBeVisible();
  });
});

const tutorialOpponentHandNames = ["Na+", "稀 HCl", "H+", "H2O", "S", "稀 KOH", "Cl-", "稀 H2SO4", "SO2"];

async function openTutorialFromLobby(page: Page) {
  await page.goto("/");
  await expect(page.locator('[data-testid="lobby-page"]')).toBeVisible();
  const tutorialCard = page.locator('[data-testid="mode-card-tutorial"]');
  await expect(tutorialCard).toBeVisible();
  await tutorialCard.getByRole("button", { name: "进入教学" }).click();
  await expect(page).toHaveURL(/\/play\?mode=solo_ai&tutorial=1/);
  await expect(page.locator('[data-testid="desk-table"]')).toBeVisible();
  await expect(page.locator("select[aria-label*='controller'], select[aria-label*='控制方']")).toHaveCount(0);
  await expect(page.locator("details")).toHaveCount(0);
}

test("生产构建从大厅进入教学并走完备课、稀 NaOH 出牌、AI 公开牌与稀 KOH 响应", async ({
  page,
  externalRequests,
  networkFailures,
  runtimeErrors,
}) => {
  void externalRequests;
  void runtimeErrors;
  void networkFailures;

  await openTutorialFromLobby(page);

  const coachBanner = page.locator('[data-testid="coach-banner"]');
  await expect(coachBanner).toBeVisible();
  await expect(coachBanner).toContainText("步骤 1/4 · 备课阶段");

  await page.reload();
  await expect(page).toHaveURL(/\/play\?mode=solo_ai&tutorial=1/);
  await expect(page.locator('[data-testid="desk-table"]')).toBeVisible();
  await expect(coachBanner).toBeVisible();
  await expect(coachBanner).toContainText("步骤 1/4 · 备课阶段");
  await expectTutorialOpponentHandHidden(page, tutorialOpponentHandNames);

  const confirmPrepButton = page.locator(".desk-action-bar button.coach-highlight");
  await expect(confirmPrepButton).toBeVisible();
  await expect(confirmPrepButton).toContainText("确认备课选择");
  await clickDeskCanvasCardByDisplayName(page, "O2");
  await clickDeskCanvasCardByDisplayName(page, "H2O");
  await expect(confirmPrepButton).toContainText("10/10");
  await confirmPrepButton.click();
  await expect(coachBanner).toContainText("步骤 1/4 · 备课阶段");
  await clickDeskCanvasCardByDisplayName(page, "H2O");
  await clickDeskCanvasCardByDisplayName(page, "O2");
  await confirmPrepButton.click();

  await expect(coachBanner).toContainText("步骤 2/4 · 看手牌与选牌");
  await expectTutorialOpponentHandHidden(page, tutorialOpponentHandNames);
  const highlightedPlay = await readDeskCanvasHighlightedCardIds(page);
  expect(highlightedPlay.length).toBe(1);
  await clickDeskCanvasCardByDisplayName(page, "稀 NaOH");

  await expect(coachBanner).toContainText("步骤 3/4 · 普通出牌建立基准");
  const effectButton = await visibleActionByName(page, "执行效果", "Run Effect");
  expect(effectButton).toBeDefined();
  await effectButton!.click();
  await expect(coachBanner).toContainText("步骤 3/4 · 普通出牌建立基准");
  const playRefButton = await visibleActionByName(page, "普通出牌", "Play");
  expect(playRefButton).toBeDefined();
  await expect(playRefButton!).toHaveClass(/coach-highlight/);
  await playRefButton!.click();

  await expect(coachBanner).toContainText("步骤 4/4 · 响应酸性伤害");
  await expectTutorialOpponentHandHidden(page, tutorialOpponentHandNames);
  const centerAfterPlay = await readDeskCanvasCenterSummary(page);
  expect(centerAfterPlay?.referenceName).toBe("稀 NaOH");
  expect(centerAfterPlay?.recentTitle).toContain("主动 DIY");
  expect(centerAfterPlay?.recentName).toBe("稀 HCl");

  await clickDeskCanvasCardByDisplayName(page, "稀 KOH");
  const playResponseButton = page.locator(".desk-action-bar button.coach-highlight");
  await expect(playResponseButton).toBeVisible();
  await expect(playResponseButton).toContainText("打出响应");
  await playResponseButton.click();

  await expect(coachBanner).toContainText("教学完成");
  await expect(coachBanner).toContainText("本局教学已结束");
  await expect(page).toHaveURL(/tutorial=1/);
  await expectTutorialOpponentHandHidden(page, tutorialOpponentHandNames);
  const completeButton = page.locator('[data-testid="coach-banner-complete"]');
  await expect(completeButton).toBeVisible();
  await expect(completeButton).toContainText("进入人机对局");
  await completeButton.click();
  await expect(coachBanner).toHaveCount(0);
  await expect(page.locator('[data-testid="desk-table"]')).toBeVisible();
});

test("生产构建从大厅进入教学后跳过，地址变为 /play?mode=solo_ai 且不含 tutorial=1", async ({
  page,
  externalRequests,
  networkFailures,
  runtimeErrors,
}) => {
  void externalRequests;
  void runtimeErrors;
  void networkFailures;

  await openTutorialFromLobby(page);
  const coachBanner = page.locator('[data-testid="coach-banner"]');
  await expect(coachBanner).toBeVisible();
  await expect(coachBanner).toContainText("步骤 1/4 · 备课阶段");
  await expectTutorialOpponentHandHidden(page, tutorialOpponentHandNames);

  await page.locator('[data-testid="coach-banner-skip"]').click();
  await expect(page).toHaveURL(/\/play\?mode=solo_ai$/);
  await expect(page).not.toHaveURL(/tutorial=1/);
  await expect(coachBanner).toHaveCount(0);
  await expect(page.locator('[data-testid="desk-table"]')).toBeVisible();
  await expectTutorialOpponentHandHidden(page, tutorialOpponentHandNames);
});

