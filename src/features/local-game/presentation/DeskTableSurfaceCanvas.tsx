import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CardInstanceId } from "../../../game/engine/types";
import type { PlayPresentationModel } from "./playPresentationTypes";
import { hitTestDeskTableSurface, layoutDeskTableSurface } from "./layoutDeskTableSurface";
import {
  loadDeskTableBrandImages,
  renderDeskTableSurface,
  type DeskTableBrandImages,
} from "./renderDeskTableSurface";

export type DeskTableSurfaceCanvasProps = Readonly<{
  model: PlayPresentationModel;
  onSelectCard: (cardInstanceId: CardInstanceId) => void;
  selectedCardId?: CardInstanceId;
  selectedCardIds?: readonly CardInstanceId[];
}>;

function scalePointerPosition(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

export default function DeskTableSurfaceCanvas({
  model,
  onSelectCard,
  selectedCardId,
  selectedCardIds = [],
}: DeskTableSurfaceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [images, setImages] = useState<DeskTableBrandImages | null>(null);
  const [size, setSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    let cancelled = false;
    loadDeskTableBrandImages()
      .then((loaded) => {
        if (!cancelled) {
          setImages(loaded);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setImages(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return undefined;
    }
    const applySize = (width: number, height: number) => {
      setSize({
        width: Math.max(1, Math.floor(width)),
        height: Math.max(1, Math.floor(height)),
      });
    };
    applySize(host.clientWidth || 900, host.clientHeight || 320);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      applySize(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(
    () => layoutDeskTableSurface(model, size.width, size.height),
    [model, size.height, size.width],
  );

  const ariaSummary = useMemo(() => {
    const ownNames = model.ownHand
      .filter((card) => card.displayName)
      .map((card) => card.displayName);
    const opponentCount = model.opponentHand.cards.length;
    const opponentReveal = model.opponentHand.reveal === "backs" ? "backs" : "faces";
    return `Desk surface canvas; opponent ${opponentCount} cards (${opponentReveal}); own hand ${ownNames.length} cards`;
  }, [model]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }
    const onTestSelect = (event: Event) => {
      const cardInstanceId = (event as CustomEvent<CardInstanceId>).detail;
      if (cardInstanceId) {
        onSelectCard(cardInstanceId);
      }
    };
    canvas.addEventListener("desk-select-card", onTestSelect);
    return () => canvas.removeEventListener("desk-select-card", onTestSelect);
  }, [onSelectCard]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.dataset.hitRegions = JSON.stringify(layout.hitRegions);
    canvas.dataset.selectedCardId = selectedCardId ?? "";
    canvas.dataset.selectedCardIds = selectedCardIds.join(",");
    canvas.dataset.highlightedCardIds = model.ownHand
      .filter((card) => card.highlighted)
      .map((card) => card.cardInstanceId)
      .join(",");
    canvas.dataset.centerSummary = JSON.stringify(model.center);
  }, [layout, model, selectedCardId, selectedCardIds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !images) {
      return;
    }
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const pixelWidth = Math.floor(layout.width * dpr);
    const pixelHeight = Math.floor(layout.height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      canvas.style.width = `${layout.width}px`;
      canvas.style.height = `${layout.height}px`;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderDeskTableSurface(ctx, model, layout, images);
  }, [images, layout, model]);

  const handleCanvasActivate = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const { x, y } = scalePointerPosition(canvas, clientX, clientY);
      const hit = hitTestDeskTableSurface(layout, x, y);
      if (hit?.interactive) {
        onSelectCard(hit.cardInstanceId);
      }
    },
    [layout, onSelectCard],
  );

  return (
    <div className="desk-table__canvas-host" ref={hostRef}>
      <canvas
        aria-label={ariaSummary}
        className="desk-table__surface-canvas"
        data-testid="desk-table-surface-canvas"
        onPointerUp={(event) => handleCanvasActivate(event.clientX, event.clientY)}
        ref={canvasRef}
        role="img"
      />
    </div>
  );
}
