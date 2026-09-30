// @vitest-environment happy-dom

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "./locale";
import { LobbyPage } from "../features/lobby/LobbyPage";

const rootDir = resolve(import.meta.dirname, "../..");

function readRepoFile(path: string) {
  return readFileSync(resolve(rootDir, path), "utf8");
}

describe("shell layout mount contract", () => {
  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    document.head.querySelector("[data-shell-layout-test]")?.remove();
    const style = document.createElement("style");
    style.dataset.shellLayoutTest = "true";
    style.textContent = readRepoFile("src/app/shell.css");
    document.head.appendChild(style);
  });

  it("loads the release bar from the entry stylesheet, not the lazy game chunk", () => {
    const styles = readRepoFile("src/styles.css");
    const main = readRepoFile("src/main.tsx");
    const shell = readRepoFile("src/app/shell.css");
    const localGameCss = readRepoFile("src/features/local-game/local-game.css");
    const app = readRepoFile("src/app/App.tsx");
    const localGamePage = readRepoFile("src/features/local-game/LocalGamePage.tsx");
    const indexHtml = readRepoFile("index.html");

    expect(main).toContain('import "./styles.css"');
    expect(styles).toContain('@import "./app/shell.css"');
    expect(shell).toContain(".release-bar");
    expect(shell).toContain("env(safe-area-inset-top, 0px)");
    expect(shell).toContain("--release-bar-height");
    expect(localGameCss).not.toContain(".release-bar {");
    expect(localGameCss).toContain("var(--release-bar-height, calc(56px + env(safe-area-inset-top, 0px)))");
    expect(localGameCss).not.toContain("top: 54px");
    expect(app).not.toContain("fallback={null}");
    expect(app).toContain('aria-hidden={blocked ? "true" : undefined}');
    expect(app).toContain("inert={blocked ? true : undefined}");
    expect(localGamePage).not.toContain("fallback={null}");
    expect(localGamePage).toContain('data-testid="desk-table-fallback"');
    expect(indexHtml).toContain("viewport-fit=cover");
  });

  it("keeps the lobby release bar flexed and colored before any game chunk loads", async () => {
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

    const bar = container.querySelector(".release-bar");
    expect(bar).toBeInstanceOf(HTMLElement);
    const style = getComputedStyle(bar as HTMLElement);
    expect(style.display).toBe("flex");
    expect(style.backgroundColor.replaceAll(" ", "").toLowerCase()).toMatch(/^(#17384d|rgb\(23,56,77\))$/);
    expect(style.position).toBe("relative");

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
