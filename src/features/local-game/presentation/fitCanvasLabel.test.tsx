import { describe, expect, it } from "vitest";
import { fitCanvasLabel } from "./renderDeskTableSurface";

const ellipsisWidth = 14;
const measure = (value: string) =>
  [...value].reduce((sum, char) => sum + (char === "…" ? ellipsisWidth : 7), 0);

describe("fitCanvasLabel", () => {
  it("keeps a label that already fits", () => {
    expect(fitCanvasLabel("稀 HCl", 92, measure)).toBe("稀 HCl");
  });

  it("shortens a long English card name without stalling when the ellipsis is wider than a letter", () => {
    const text = "Limewater Ca(OH)2";
    let calls = 0;
    const fitted = fitCanvasLabel(text, 92, (value) => {
      calls += 1;
      return measure(value);
    });

    expect(calls).toBeLessThanOrEqual(text.length + 2);
    expect(measure(fitted)).toBeLessThanOrEqual(92);
    expect(fitted.endsWith("…")).toBe(true);
    expect(text.startsWith(fitted.slice(0, -1))).toBe(true);
  });

  it("returns the ellipsis when a single source character still overflows", () => {
    expect(fitCanvasLabel("ABCDEF", 14, measure)).toBe("…");
  });
});
