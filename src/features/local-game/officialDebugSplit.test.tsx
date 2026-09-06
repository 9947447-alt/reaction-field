// @vitest-environment happy-dom

import { describe, expect, it, beforeEach } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { isDebugRoute } from "../../app/routes";
import { LocalGamePage } from "./LocalGamePage";
import { deterministicFixtureFactory } from "../../../e2e/fixtureScenarios";
import { LocaleProvider } from "../../app/locale";

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
});
