// @vitest-environment happy-dom

import { StrictMode, act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { LocalGamePage } from "./LocalGamePage";
import { LocaleProvider } from "../../app/locale";

describe("Phase 20-Tut — Interactive Tutorial Integration", () => {
  it("renders Start tutorial button on configuration, enters seeded tutorial, guards clicks, progresses via engine, and completes acid-base neutralization", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          <StrictMode>
            <LocalGamePage aiDelayMs={0} isDebug={false} />
          </StrictMode>,
        );
      });

      // 1. Check entry button
      const startTutorialButton = container.querySelector(".start-tutorial-button") as HTMLButtonElement;
      expect(startTutorialButton).not.toBeNull();
      expect(startTutorialButton.textContent).toContain("开始教学");

      // 2. Click Start tutorial
      await act(async () => {
        startTutorialButton.click();
      });

      // 3. Step 1: Preparation
      const coachBanner = container.querySelector(".coach-banner");
      expect(coachBanner).not.toBeNull();
      expect(coachBanner?.textContent).toContain("新手教学 · 第 1/4 步");
      expect(coachBanner?.textContent).toContain("备课阶段");

      const confirmPrepButton = container.querySelector(
        ".preparation-panel button.primary-button.coach-highlight",
      ) as HTMLButtonElement;
      expect(confirmPrepButton).not.toBeNull();
      expect(confirmPrepButton.disabled).toBe(false);

      // Confirm preparation
      await act(async () => {
        confirmPrepButton.click();
      });

      // 4. Step 2: Select hand card (dilute NaOH)
      expect(container.querySelector(".coach-banner")?.textContent).toContain("第 2/4 步");
      expect(container.querySelector(".coach-banner")?.textContent).toContain("看手牌与选牌");

      const ownPlayerPanel = container.querySelector('[aria-labelledby="player_1-title"]');
      expect(ownPlayerPanel).not.toBeNull();

      // Find highlighted card (dilute NaOH) and other cards
      const highlightedCard = ownPlayerPanel?.querySelector(".official-card.coach-highlight");
      expect(highlightedCard).not.toBeNull();
      expect(highlightedCard?.textContent).toContain("稀 NaOH");

      // Click a non-highlighted card -> guard: should NOT be selected!
      const nonHighlightedCards = ownPlayerPanel?.querySelectorAll(".official-card.card-face:not(.coach-highlight)");
      expect(nonHighlightedCards?.length).toBeGreaterThan(0);
      const otherCardButton = nonHighlightedCards?.[0].querySelector("button.debug-card__select") as HTMLButtonElement;

      await act(async () => {
        otherCardButton.click();
      });
      expect(nonHighlightedCards?.[0].classList.contains("is-selected")).toBe(false);
      // Step still in step 2
      expect(container.querySelector(".coach-banner")?.textContent).toContain("看手牌与选牌");

      // Click the highlighted card (dilute NaOH)
      const targetCardButton = highlightedCard?.querySelector("button.debug-card__select") as HTMLButtonElement;
      await act(async () => {
        targetCardButton.click();
      });
      expect(highlightedCard?.classList.contains("is-selected")).toBe(true);

      // 5. Step 3: Play card as reference
      expect(container.querySelector(".coach-banner")?.textContent).toContain("第 3/4 步");
      expect(container.querySelector(".coach-banner")?.textContent).toContain("普通出牌建立基准");

      const actionPanel = container.querySelector(".action-panel");
      expect(actionPanel).not.toBeNull();

      // The Play button for dilute NaOH is highlighted
      const playReferenceButton = actionPanel?.querySelector(
        "button.secondary-button.coach-highlight",
      ) as HTMLButtonElement;
      expect(playReferenceButton).not.toBeNull();
      expect(playReferenceButton.textContent).toContain("普通出牌");

      // End action button should be disabled during step 3
      const passActionButton = actionPanel?.querySelector("button.secondary-button:not(.coach-highlight)") as HTMLButtonElement;
      expect(passActionButton.disabled).toBe(true);

      // Click the highlighted Play button
      await act(async () => {
        playReferenceButton.click();
      });

      // 6. AI responds with DIY attack -> transitions to Step 4: responseWindow
      // aiDelayMs is 0, so AI acts synchronously!
      expect(container.querySelector(".coach-banner")?.textContent).toContain("第 4/4 步");
      expect(container.querySelector(".coach-banner")?.textContent).toContain("响应酸性伤害");

      const responsePanel = container.querySelector(".response-panel");
      expect(responsePanel).not.toBeNull();

      // Pass response button is disabled in tutorial
      const passResponseButton = responsePanel?.querySelector("button.secondary-button") as HTMLButtonElement;
      expect(passResponseButton.disabled).toBe(true);

      // Target response card (dilute KOH) is highlighted
      const highlightedResponseCard = responsePanel?.querySelector(".response-card-wrapper.coach-highlight");
      expect(highlightedResponseCard).not.toBeNull();
      expect(highlightedResponseCard?.textContent).toContain("稀 KOH");

      // Click the highlighted response card
      const responseCardButton = highlightedResponseCard?.querySelector("button.debug-card__select") as HTMLButtonElement;
      expect(responseCardButton).not.toBeNull();
      await act(async () => {
        responseCardButton.click();
      });

      // 7. Reaction logged and Step 5: Completed!
      const gameLog = container.querySelector(".game-log");
      expect(gameLog?.textContent).toContain("成功反应 · 酸碱中和");

      expect(container.querySelector(".coach-banner")?.textContent).toContain("教学完成");
      expect(container.querySelector(".coach-banner")?.textContent).toContain("恭喜");

      // Complete button is shown
      const completeButton = container.querySelector(".coach-banner__complete-btn") as HTMLButtonElement;
      expect(completeButton).not.toBeNull();
      expect(completeButton.textContent).toContain("进入人机对局");

      // Click complete -> restarts into normal Solo vs AI
      await act(async () => {
        completeButton.click();
      });

      // Coach banner should no longer be present
      expect(container.querySelector(".coach-banner")).toBeNull();
      // Should be in playing phase of fresh Solo vs AI
      expect(container.querySelector(".players-grid")).not.toBeNull();
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it("allows skipping tutorial at any time to enter normal Solo vs AI", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          <StrictMode>
            <LocalGamePage aiDelayMs={0} isDebug={false} />
          </StrictMode>,
        );
      });

      const startTutorialButton = container.querySelector(".start-tutorial-button") as HTMLButtonElement;
      await act(async () => {
        startTutorialButton.click();
      });

      expect(container.querySelector(".coach-banner")).not.toBeNull();

      // Click Skip tutorial
      const skipButton = container.querySelector(".coach-banner__skip") as HTMLButtonElement;
      expect(skipButton).not.toBeNull();
      expect(skipButton.textContent).toContain("跳过教学");

      await act(async () => {
        skipButton.click();
      });

      // Coach banner dismissed, enters default solo vs AI
      expect(container.querySelector(".coach-banner")).toBeNull();
      expect(container.querySelector(".players-grid")).not.toBeNull();
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it("renders tutorial coach banner in English when locale is en", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          <StrictMode>
            <LocaleProvider>
              <LocalGamePage aiDelayMs={0} isDebug={false} />
            </LocaleProvider>
          </StrictMode>,
        );
      });

      // Switch to English via locale switch button
      const enButton = Array.from(container.querySelectorAll(".locale-switch__button")).find(
        (btn) => btn.textContent?.includes("English"),
      ) as HTMLButtonElement | undefined;
      expect(enButton).toBeDefined();

      await act(async () => {
        enButton?.click();
      });

      const startTutorialButton = container.querySelector(".start-tutorial-button") as HTMLButtonElement;
      expect(startTutorialButton.textContent).toContain("Start tutorial");

      await act(async () => {
        startTutorialButton.click();
      });

      const coachBanner = container.querySelector(".coach-banner");
      expect(coachBanner?.textContent).toContain("Step 1/4 · Preparation");
      expect(coachBanner?.textContent).toContain("Skip tutorial");
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });
});
