// @vitest-environment happy-dom

import { describe, expect, it, beforeEach, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { LocaleProvider } from "../../app/locale";
import { LobbyPage } from "./LobbyPage";

describe("Phase 20-Home — LobbyPage", () => {
  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    Object.defineProperty(navigator, "languages", {
      configurable: true,
      value: ["zh-CN"],
    });
    Object.defineProperty(navigator, "language", {
      configurable: true,
      value: "zh-CN",
    });
  });

  it("renders lobby with three mode cards and banner slot, with zero debug controls or log IDs", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StrictMode>
          <LocaleProvider>
            <LobbyPage />
          </LocaleProvider>
        </StrictMode>,
      );
    });

    const banner = container.querySelector(".lobby-banner");
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain("反应域");
    expect(banner?.textContent).not.toContain("占位图");
    expect(banner?.textContent).not.toContain("Phase 20 Lobby Banner Slot");
    expect(banner?.querySelector("img")?.getAttribute("src")).toContain("lobby-banner.png");

    // Three entry cards exist
    const soloCard = container.querySelector('[data-testid="mode-card-solo"]');
    const duoCard = container.querySelector('[data-testid="mode-card-duo"]');
    const tutorialCard = container.querySelector('[data-testid="mode-card-tutorial"]');
    expect(soloCard).not.toBeNull();
    expect(duoCard).not.toBeNull();
    expect(tutorialCard).not.toBeNull();

    expect(soloCard?.textContent).toContain("单人人机对战");
    expect(duoCard?.textContent).toContain("本地双人对战");
    expect(tutorialCard?.textContent).toContain("交互式教学引导");
    expect(soloCard?.querySelector("img")?.getAttribute("src")).toContain("mode-solo.png");
    expect(duoCard?.querySelector("img")?.getAttribute("src")).toContain("mode-duo.png");
    expect(tutorialCard?.querySelector("img")?.getAttribute("src")).toContain("mode-tutorial.png");
    expect(container.querySelectorAll("[data-testid^='mode-card-']")).toHaveLength(3);

    // Zero controller dropdowns, zero Log IDs, zero raw details debug elements
    const controllerSelects = container.querySelectorAll(
      "select[aria-label*='controller'], select[aria-label*='控制方']",
    );
    expect(controllerSelects).toHaveLength(0);

    const logIds = container.querySelectorAll(".game-log__entry-id");
    expect(logIds).toHaveLength(0);

    const debugDetails = container.querySelectorAll("details");
    expect(debugDetails).toHaveLength(0);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("supports in-place locale switching between Chinese and English", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StrictMode>
          <LocaleProvider>
            <LobbyPage />
          </LocaleProvider>
        </StrictMode>,
      );
    });

    const soloCard = container.querySelector('[data-testid="mode-card-solo"]');
    expect(soloCard?.textContent).toContain("单人人机对战");

    // Switch to English
    const enButton = Array.from(container.querySelectorAll("button.locale-switch__button")).find(
      (btn) => btn.textContent === "English",
    ) as HTMLButtonElement;
    expect(enButton).not.toBeNull();
    await act(async () => {
      enButton.click();
    });

    expect(soloCard?.textContent).toContain("Solo vs AI");
    const duoCard = container.querySelector('[data-testid="mode-card-duo"]');
    expect(duoCard?.textContent).toContain("Local Two-Player");
    const tutorialCard = container.querySelector('[data-testid="mode-card-tutorial"]');
    expect(tutorialCard?.textContent).toContain("Tutorial Guidance");

    // Switch back to Chinese
    const zhButton = Array.from(container.querySelectorAll("button.locale-switch__button")).find(
      (btn) => btn.textContent === "中文",
    ) as HTMLButtonElement;
    await act(async () => {
      zhButton.click();
    });
    expect(soloCard?.textContent).toContain("单人人机对战");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("navigates to /play routes when clicking mode buttons", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const pushStateSpy = vi.spyOn(window.history, "pushState");

    await act(async () => {
      root.render(
        <StrictMode>
          <LocaleProvider>
            <LobbyPage />
          </LocaleProvider>
        </StrictMode>,
      );
    });

    // Click Solo vs AI button
    const soloBtn = container.querySelector('[data-testid="mode-card-solo"] button') as HTMLButtonElement;
    expect(soloBtn).not.toBeNull();
    await act(async () => {
      soloBtn.click();
    });
    expect(pushStateSpy).toHaveBeenCalledWith({}, "", expect.stringContaining("/play?mode=solo_ai"));

    // Click Duo button
    const duoBtn = container.querySelector('[data-testid="mode-card-duo"] button') as HTMLButtonElement;
    expect(duoBtn).not.toBeNull();
    await act(async () => {
      duoBtn.click();
    });
    expect(pushStateSpy).toHaveBeenCalledWith({}, "", expect.stringContaining("/play?mode=two_player"));

    // Click Tutorial button
    const tutBtn = container.querySelector('[data-testid="mode-card-tutorial"] button') as HTMLButtonElement;
    expect(tutBtn).not.toBeNull();
    await act(async () => {
      tutBtn.click();
    });
    expect(pushStateSpy).toHaveBeenCalledWith({}, "", expect.stringContaining("/play?mode=solo_ai&tutorial=1"));

    pushStateSpy.mockRestore();
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
