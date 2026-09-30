// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { scalePointerPosition } from "./DeskTableSurfaceCanvas";

describe("desk canvas pointer scaling", () => {
  it("maps clicks in CSS pixels when the canvas backing store is scaled for device pixels", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1800;
    canvas.height = 640;
    canvas.style.width = "900px";
    canvas.style.height = "320px";
    canvas.getBoundingClientRect = () => ({
      x: 10,
      y: 20,
      left: 10,
      top: 20,
      right: 910,
      bottom: 340,
      width: 900,
      height: 320,
      toJSON: () => ({}),
    });

    expect(scalePointerPosition(canvas, 110, 70)).toEqual({ x: 100, y: 50 });
  });

  it("uses the rendered box when the canvas style size is a percentage", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1800;
    canvas.height = 640;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 390,
      bottom: 280,
      width: 390,
      height: 280,
      toJSON: () => ({}),
    });

    expect(scalePointerPosition(canvas, 195, 140)).toEqual({ x: 195, y: 140 });
  });
});
