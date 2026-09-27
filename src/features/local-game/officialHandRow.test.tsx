// @vitest-environment happy-dom

import { describe, expect, it, beforeEach } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { LocalGamePage } from "./LocalGamePage";
import { deterministicFixtureFactory } from "../../../e2e/fixtureScenarios";
import { LocaleProvider } from "../../app/locale";
import {
  countDeskCanvasZones,
  readDeskCanvasHitRegions,
  waitForDeskCanvas,
} from "./presentation/deskTableCanvasTestHelpers";

describe("Phase 21 Table — Canvas hand row and interactive selection", () => {
  beforeEach(async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    await import("./presentation/DeskTableSurfaceCanvas");
  });

  it("renders own hand on canvas with interactive hit regions", async () => {
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

    await act(async () => {
      await waitForDeskCanvas(container);
    });
    expect(container.querySelector('[data-testid="desk-table-surface-canvas"]')).not.toBeNull();
    expect(countDeskCanvasZones(container, "own", { interactiveOnly: true })).toBeGreaterThan(0);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("demonstrates Engine Authority: canvas selection does not alter GameState until dispatch", async () => {
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

    await act(async () => {
      await waitForDeskCanvas(container);
    });
    const ownPanel = container.querySelector('[aria-labelledby="player_1-title"]') as HTMLElement;
    const regions = readDeskCanvasHitRegions(container).filter((region) => region.zone === "own" && region.interactive);
    expect(regions.length).toBeGreaterThan(1);

    const initialLogEntries = container.querySelectorAll(".game-log li").length;
    const initialHpText = ownPanel.querySelector(".player-hp-val")?.textContent;

    await act(async () => {
      clickDeskCanvasCard(container, regions[0].cardInstanceId);
      clickDeskCanvasCard(container, regions[1].cardInstanceId);
      clickDeskCanvasCard(container, regions[1].cardInstanceId);
    });

    expect(container.querySelectorAll(".game-log li").length).toBe(initialLogEntries);
    expect(ownPanel.querySelector(".player-hp-val")?.textContent).toBe(initialHpText);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders opponent hand on canvas as non-interactive backs with matching count", async () => {
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

    await act(async () => {
      await waitForDeskCanvas(container);
    });
    const opponentPanel = container.querySelector('[aria-labelledby="player_2-title"]') as HTMLElement;
    const opponentCount = Number(
      opponentPanel.querySelector(".hand-count-pill")?.textContent?.match(/(\d+)/)?.[1],
    );
    expect(opponentCount).toBeGreaterThan(0);
    expect(countDeskCanvasZones(container, "opponent")).toBe(opponentCount);
    expect(
      readDeskCanvasHitRegions(container).filter((region) => region.zone === "opponent" && region.interactive),
    ).toHaveLength(0);
    expect(opponentPanel.querySelectorAll(".official-hand-row")).toHaveLength(0);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("reveals card faces on canvas for both players in local two-player mode", async () => {
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

    await act(async () => {
      await waitForDeskCanvas(container);
    });
    expect(
      countDeskCanvasZones(container, "own", { withDisplayName: true }),
    ).toBeGreaterThan(0);
    expect(
      countDeskCanvasZones(container, "opponent", { withDisplayName: true }),
    ).toBeGreaterThan(0);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
