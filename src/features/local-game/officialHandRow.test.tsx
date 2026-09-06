// @vitest-environment happy-dom

import { describe, expect, it, beforeEach, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { LocalGamePage } from "./LocalGamePage";
import { deterministicFixtureFactory } from "../../../e2e/fixtureScenarios";
import { LocaleProvider } from "../../app/locale";
import { PLAY_BRAND_ASSETS } from "./playBrandAssets";

describe("Phase 20 Table — Official Hand Row and Interactive Selection", () => {
  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  });

  it("renders own hand as a horizontal row with card frames and enables tap-to-lift and tap-again-to-cancel", async () => {
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

    // Start in Solo vs AI mode with CEO vs Acid King (starts directly in mainAction)
    const p1Select = container.querySelector('[aria-label="player_1 角色"], [aria-label="player_1 character"]') as HTMLSelectElement;
    const p2Select = container.querySelector('[aria-label="player_2 角色"], [aria-label="player_2 character"]') as HTMLSelectElement;
    if (p1Select && p2Select) {
      await act(async () => {
        p1Select.value = "chemical_factory_ceo";
        p1Select.dispatchEvent(new Event("change", { bubbles: true }));
        p2Select.value = "acid_king";
        p2Select.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }

    const startButton = container.querySelector("button.start-game-button") as HTMLButtonElement;
    expect(startButton).not.toBeNull();
    await act(async () => {
      startButton.click();
    });

    // In PlayingGame, player_1 (human) hand row has official-hand-row and hand-grid classes
    const ownPanel = container.querySelector('[aria-labelledby="player_1-title"]') as HTMLElement;
    expect(ownPanel).not.toBeNull();

    const handRow = ownPanel.querySelector(".official-hand-row");
    expect(handRow).not.toBeNull();
    expect(handRow?.classList.contains("hand-grid")).toBe(true);

    // Hand row header shows hand title and total count
    const handHeader = ownPanel.querySelector(".hand-row-header");
    expect(handHeader).not.toBeNull();
    expect(handHeader?.textContent).toMatch(/手牌|Hand cards/);
    expect(handHeader?.textContent).toMatch(/张|cards/);

    // All own cards are official cards with card-frame overlay
    const ownCards = ownPanel.querySelectorAll(".official-card.card-face");
    expect(ownCards.length).toBeGreaterThan(0);
    for (const card of ownCards) {
      const frameImg = card.querySelector("img.card-frame__overlay");
      expect(frameImg).not.toBeNull();
      expect(frameImg?.getAttribute("src")).toContain("card-frame.png");
    }

    // Interactive selection: click first card to select (lifted up)
    const firstCard = ownCards[0] as HTMLElement;
    const firstButton = firstCard.querySelector("button.debug-card__select") as HTMLButtonElement;
    expect(firstButton).not.toBeNull();
    expect(firstCard.classList.contains("is-selected")).toBe(false);
    expect(firstButton.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      firstButton.click();
    });

    // Selected: has is-selected class and aria-pressed=true
    expect(firstCard.classList.contains("is-selected")).toBe(true);
    expect(firstButton.getAttribute("aria-pressed")).toBe("true");

    // Tap again to cancel: click first card again
    await act(async () => {
      firstButton.click();
    });

    // Deselected: is-selected removed and aria-pressed=false
    expect(firstCard.classList.contains("is-selected")).toBe(false);
    expect(firstButton.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("demonstrates Engine Authority: selecting hand cards does not alter GameState until Play/DIY is dispatched", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    let recordedReducerCalls = 0;
    const trackingReducer = (state: any, action: any) => {
      recordedReducerCalls += 1;
      return state;
    };

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

    const p1Select = container.querySelector('[aria-label="player_1 角色"], [aria-label="player_1 character"]') as HTMLSelectElement;
    const p2Select = container.querySelector('[aria-label="player_2 角色"], [aria-label="player_2 character"]') as HTMLSelectElement;
    if (p1Select && p2Select) {
      await act(async () => {
        p1Select.value = "chemical_factory_ceo";
        p1Select.dispatchEvent(new Event("change", { bubbles: true }));
        p2Select.value = "acid_king";
        p2Select.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }

    const startButton = container.querySelector("button.start-game-button") as HTMLButtonElement;
    await act(async () => {
      startButton.click();
    });

    const ownPanel = container.querySelector('[aria-labelledby="player_1-title"]') as HTMLElement;
    const cardButtons = ownPanel.querySelectorAll("button.debug-card__select");
    expect(cardButtons.length).toBeGreaterThan(1);

    const initialLogEntries = container.querySelectorAll(".game-log li").length;
    const initialHpText = ownPanel.querySelector(".player-hp-val")?.textContent;

    // Click card 1 (select)
    await act(async () => {
      (cardButtons[0] as HTMLButtonElement).click();
    });
    // Click card 2 (switch selection)
    await act(async () => {
      (cardButtons[1] as HTMLButtonElement).click();
    });
    // Click card 2 again (deselect)
    await act(async () => {
      (cardButtons[1] as HTMLButtonElement).click();
    });

    // Verify: GameState did not mutate, logs remained identical, HP remained identical
    const currentLogEntries = container.querySelectorAll(".game-log li").length;
    const currentHpText = ownPanel.querySelector(".player-hp-val")?.textContent;
    expect(currentLogEntries).toBe(initialLogEntries);
    expect(currentHpText).toBe(initialHpText);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders opponent hand in Solo vs AI as non-clickable card backs row with count", async () => {
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

    const startButton = container.querySelector("button.start-game-button") as HTMLButtonElement;
    await act(async () => {
      startButton.click();
    });

    const opponentPanel = container.querySelector('[aria-labelledby="player_2-title"]') as HTMLElement;
    expect(opponentPanel).not.toBeNull();

    // Hand row has is-backs class
    const handRow = opponentPanel.querySelector(".official-hand-row.is-backs");
    expect(handRow).not.toBeNull();

    // Opponent count
    const handCountPill = opponentPanel.querySelector(".hand-count-pill")?.textContent ?? "";
    const match = handCountPill.match(/(\d+)/);
    const count = Number(match?.[1]);
    expect(count).toBeGreaterThan(0);

    // Opponent cards are all card backs
    const cardBacks = opponentPanel.querySelectorAll(".card-back.official-card--back");
    expect(cardBacks).toHaveLength(count);

    // Each card back has card-back image and card-frame overlay
    for (const back of cardBacks) {
      const backImg = back.querySelector("img.card-back__image");
      const frameImg = back.querySelector("img.card-frame__overlay");
      expect(backImg).not.toBeNull();
      expect(frameImg).not.toBeNull();
      expect(backImg?.getAttribute("src")).toContain("card-back.png");
      expect(frameImg?.getAttribute("src")).toContain("card-frame.png");
    }

    // Zero interactive buttons or card face elements inside opponent hand
    expect(opponentPanel.querySelectorAll(".card-back button")).toHaveLength(0);
    expect(opponentPanel.querySelectorAll(".card-face")).toHaveLength(0);
    expect(opponentPanel.querySelectorAll(".debug-card__select")).toHaveLength(0);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("reveals card faces and names for both players in local two-player mode", async () => {
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

    // Select Two-Player mode
    const modeSelect = container.querySelector(
      "select[aria-label*='mode'], select[aria-label*='模式']",
    ) as HTMLSelectElement;
    await act(async () => {
      modeSelect.value = "two_player";
      modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const startButton = container.querySelector("button.start-game-button") as HTMLButtonElement;
    await act(async () => {
      startButton.click();
    });

    const player1 = container.querySelector('[aria-labelledby="player_1-title"]') as HTMLElement;
    const player2 = container.querySelector('[aria-labelledby="player_2-title"]') as HTMLElement;

    // Both players show card faces in official hand rows
    expect(player1.querySelectorAll(".official-card.card-face").length).toBeGreaterThan(0);
    expect(player2.querySelectorAll(".official-card.card-face").length).toBeGreaterThan(0);

    // Both players show card names, zero card backs
    expect(player1.querySelectorAll(".card-back")).toHaveLength(0);
    expect(player2.querySelectorAll(".card-back")).toHaveLength(0);

    // Both players have card buttons with names
    const p1Names = Array.from(player1.querySelectorAll(".official-card__name")).map((el) => el.textContent?.trim());
    const p2Names = Array.from(player2.querySelectorAll(".official-card__name")).map((el) => el.textContent?.trim());
    expect(p1Names.length).toBeGreaterThan(0);
    expect(p2Names.length).toBeGreaterThan(0);
    expect(p1Names.every(Boolean)).toBe(true);
    expect(p2Names.every(Boolean)).toBe(true);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
