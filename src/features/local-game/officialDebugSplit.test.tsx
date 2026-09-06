// @vitest-environment happy-dom

import { describe, expect, it, beforeEach } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { isDebugRoute } from "../../app/routes";
import { LocalGamePage } from "./LocalGamePage";
import { deterministicFixtureFactory } from "../../../e2e/fixtureScenarios";
import { LocaleProvider } from "../../app/locale";
import { PLAY_BRAND_ASSETS, resolvePlayBrandAsset } from "./playBrandAssets";

describe("Phase 20D — Official Play & Debug Lab Split", () => {
  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  });
  it("correctly identifies debug routes from pathnames", () => {
    expect(isDebugRoute("/")).toBe(false);
    expect(isDebugRoute("/playtest/")).toBe(false);
    expect(isDebugRoute("/about")).toBe(false);
    expect(isDebugRoute("/debug")).toBe(true);
    expect(isDebugRoute("/debug/")).toBe(true);
    expect(isDebugRoute("/playtest/debug")).toBe(true);
    expect(isDebugRoute("/playtest/debug/")).toBe(true);
  });

  it("official play mode (isDebug=false) has zero controller dropdowns and renders character avatars", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StrictMode>
          <LocaleProvider>
            <LocalGamePage
              createGame={deterministicFixtureFactory}
              aiDelayMs={0}
              isDebug={false}
            />
          </LocaleProvider>
        </StrictMode>,
      );
    });

    // Zero controller dropdowns in official setup
    const controllerSelects = container.querySelectorAll(
      "select[aria-label*='controller'], select[aria-label*='控制方']",
    );
    expect(controllerSelects).toHaveLength(0);

    // Mode selector only has solo and duo, no custom
    const customOption = container.querySelector("option[value='custom']");
    expect(customOption).toBeNull();

    // Avatars for teacher and CEO are visible
    const teacherImg = container.querySelector('img[src*="char-lab-teacher.png"]');
    const ceoImg = container.querySelector('img[src*="char-ceo.png"]');
    expect(teacherImg).not.toBeNull();
    expect(ceoImg).not.toBeNull();

    // Start game in Solo vs AI
    const startButton = container.querySelector("button.start-game-button") as HTMLButtonElement;
    expect(startButton).not.toBeNull();
    await act(async () => {
      startButton.click();
    });

    // In playing mode, opponent hand shows card-back images
    const cardBackImages = container.querySelectorAll(".card-back img.card-back__image");
    expect(cardBackImages.length).toBeGreaterThan(0);

    // In official game log, there is no Log ID or JSON debug details
    const logDetails = container.querySelectorAll("details.game-log__details");
    expect(logDetails).toHaveLength(0);
    const entryIds = container.querySelectorAll(".game-log__entry-id");
    expect(entryIds).toHaveLength(0);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("debug lab mode (isDebug=true) preserves per-seat controller dropdowns and debug log details", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StrictMode>
          <LocaleProvider>
            <LocalGamePage
              createGame={deterministicFixtureFactory}
              aiDelayMs={0}
              isDebug={true}
            />
          </LocaleProvider>
        </StrictMode>,
      );
    });

    // Debug lab setup has 2 controller dropdowns
    const controllerSelects = container.querySelectorAll(
      "select[aria-label*='controller'], select[aria-label*='控制方']",
    );
    expect(controllerSelects).toHaveLength(2);

    // Start game
    const startButton = container.querySelector("button.start-game-button") as HTMLButtonElement;
    await act(async () => {
      startButton.click();
    });

    // In debug mode, game log details exist and show Log ID
    const logDetails = container.querySelectorAll("details.game-log__details");
    expect(logDetails.length).toBeGreaterThan(0);
    const entryIds = container.querySelectorAll(".game-log__entry-id");
    expect(entryIds.length).toBeGreaterThan(0);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  const acceptancePathnameCases = [
    { pathname: "/", expected: "/brand/play/card-back.png" },
    { pathname: "/debug", expected: "/brand/play/card-back.png" },
    { pathname: "/playtest/debug", expected: "/playtest/brand/play/card-back.png" },
    { pathname: "/Chemistry-online-Card-Game/", expected: "/Chemistry-online-Card-Game/brand/play/card-back.png" },
    { pathname: "/Chemistry-online-Card-Game/debug", expected: "/Chemistry-online-Card-Game/brand/play/card-back.png" },
  ] as const;

  for (const { pathname, expected } of acceptancePathnameCases) {
    it(`resolves resolvePlayBrandAsset('card-back.png') under pathname='${pathname}' exactly to '${expected}'`, () => {
      const originalPathname = window.location.pathname;
      try {
        window.history.pushState({}, "", pathname);
        expect(window.location.pathname).toBe(pathname);
        const resolved = resolvePlayBrandAsset("card-back.png");
        expect(resolved).toBe(expected);
        expect(resolved.startsWith("./brand/play/")).toBe(false);
        expect(resolved).not.toContain("/debug/brand/");
      } finally {
        window.history.pushState({}, "", originalPathname);
      }
    });
  }

  it("resource function and PLAY_BRAND_ASSETS strictly forbid starting with './brand/play/'", () => {
    const testFiles = [
      "table-felt.png",
      "card-back.png",
      "card-frame.png",
      "mode-solo.png",
      "mode-duo.png",
      "char-lab-teacher.png",
      "char-ceo.png",
    ] as const;

    for (const file of testFiles) {
      const resolved = resolvePlayBrandAsset(file);
      // Strictly forbids starting with "./brand/play/"
      expect(resolved.startsWith("./brand/play/")).toBe(false);
      expect(resolved).toContain(`brand/play/${file}`);
    }

    // Verify all exported asset properties never start with "./brand/play/"
    expect(PLAY_BRAND_ASSETS.tableFelt.startsWith("./brand/play/")).toBe(false);
    expect(PLAY_BRAND_ASSETS.cardBack.startsWith("./brand/play/")).toBe(false);
    expect(PLAY_BRAND_ASSETS.cardFrame.startsWith("./brand/play/")).toBe(false);
    expect(PLAY_BRAND_ASSETS.modeSolo.startsWith("./brand/play/")).toBe(false);
    expect(PLAY_BRAND_ASSETS.modeDuo.startsWith("./brand/play/")).toBe(false);
    expect(PLAY_BRAND_ASSETS.characters.laboratory_teacher.startsWith("./brand/play/")).toBe(false);
    expect(PLAY_BRAND_ASSETS.characters.chemical_factory_ceo.startsWith("./brand/play/")).toBe(false);
  });

  for (const debugPath of ["/debug", "/playtest/debug"] as const) {
    it(`renders in DOM with pathname='${debugPath}': img.src contains brand/play/card-back.png or character PNG and strictly avoids /debug/brand/ and /playtest/debug/brand/`, async () => {
      const originalPathname = window.location.pathname;
      try {
        window.history.pushState({}, "", debugPath);
        expect(window.location.pathname).toBe(debugPath);

        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);

        await act(async () => {
          root.render(
            <StrictMode>
              <LocaleProvider>
                <LocalGamePage
                  createGame={deterministicFixtureFactory}
                  aiDelayMs={0}
                  isDebug={true}
                />
              </LocaleProvider>
            </StrictMode>,
          );
        });

        // 1. In character selection setup, assert character PNGs
        const characterImages = Array.from(
          container.querySelectorAll<HTMLImageElement>("img[src*='char-']"),
        );
        expect(characterImages.length).toBeGreaterThan(0);
        for (const img of characterImages) {
          const srcAttr = img.getAttribute("src") ?? "";
          const resolvedSrc = img.src;
          expect(srcAttr.startsWith("./brand/play/")).toBe(false);
          expect(resolvedSrc).toMatch(/brand\/play\/char-/u);
          expect(resolvedSrc).not.toContain("/debug/brand/");
          expect(resolvedSrc).not.toContain("/playtest/debug/brand/");
        }

        // 2. Start game in solo vs AI to check opponent card-back
        const startButton = container.querySelector("button.start-game-button") as HTMLButtonElement;
        await act(async () => {
          startButton.click();
        });

        const cardBackImages = Array.from(
          container.querySelectorAll<HTMLImageElement>(".card-back img.card-back__image"),
        );
        expect(cardBackImages.length).toBeGreaterThan(0);
        for (const img of cardBackImages) {
          const srcAttr = img.getAttribute("src") ?? "";
          const resolvedSrc = img.src;
          expect(srcAttr.startsWith("./brand/play/")).toBe(false);
          expect(resolvedSrc).toContain("brand/play/card-back.png");
          expect(resolvedSrc).not.toContain("/debug/brand/");
          expect(resolvedSrc).not.toContain("/playtest/debug/brand/");
        }

        await act(async () => {
          root.unmount();
        });
        container.remove();
      } finally {
        window.history.pushState({}, "", originalPathname);
      }
    });
  }
});
