// @vitest-environment happy-dom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import DeskTableSurfaceCanvas from "./DeskTableSurfaceCanvas";
import type { PlayPresentationModel } from "./playPresentationTypes";

const model: PlayPresentationModel = {
  opponentHand: { reveal: "backs", cards: [] },
  ownHand: [],
  center: {
    referenceEmptyLabel: "empty",
    referenceHintLabel: "hint",
    deckLabel: "deck",
    discardLabel: "discard",
    deckCount: 0,
    discardCount: 0,
  },
};

describe("desk canvas mount size", () => {
  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  });

  it("does not lock the canvas to a 1px box before the host is measured", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StrictMode>
          <DeskTableSurfaceCanvas model={model} onSelectCard={() => undefined} />
        </StrictMode>,
      );
    });

    const canvas = container.querySelector('[data-testid="desk-table-surface-canvas"]');
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    const style = (canvas as HTMLCanvasElement).style;
    expect(style.width).not.toBe("1px");
    expect(style.height).not.toBe("1px");
    expect(container.querySelector(".desk-table__canvas-host")).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
