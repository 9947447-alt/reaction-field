import { PLAY_BRAND_ASSETS } from "../playBrandAssets";
import type { CardInstanceId } from "../../../game/engine/types";
import {
  DESK_CARD_HEIGHT,
  DESK_CARD_WIDTH,
  type DeskCanvasLayout,
  type PlayPresentationModel,
  type PresentationCardSlot,
} from "./playPresentationTypes";

export type DeskSurfaceRenderMotion = Readonly<{
  ownCardLiftPx: (cardInstanceId: CardInstanceId) => number;
  playFly?: Readonly<{
    slot: PresentationCardSlot;
    x: number;
    y: number;
  }>;
}>;

export type DeskTableBrandImages = Readonly<{
  cardBack: CanvasImageSource;
  cardFrame: CanvasImageSource;
}>;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawDeskBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.7);
  gradient.addColorStop(0, "#17384d");
  gradient.addColorStop(1, "#0d2230");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawCardBack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  images: DeskTableBrandImages,
) {
  roundRect(ctx, x, y, DESK_CARD_WIDTH, DESK_CARD_HEIGHT, 9);
  ctx.fillStyle = "#0f2740";
  ctx.fill();
  ctx.drawImage(images.cardBack, x + 8, y + 12, DESK_CARD_WIDTH - 16, DESK_CARD_HEIGHT - 28);
  ctx.drawImage(images.cardFrame, x, y, DESK_CARD_WIDTH, DESK_CARD_HEIGHT);
}

function drawCardFace(
  ctx: CanvasRenderingContext2D,
  slot: {
    displayName: string;
    typeLabel: string;
    isIon: boolean;
    selected: boolean;
    highlighted: boolean;
    disabled: boolean;
  },
  x: number,
  y: number,
  images: DeskTableBrandImages,
) {
  roundRect(ctx, x, y, DESK_CARD_WIDTH, DESK_CARD_HEIGHT, 9);
  ctx.fillStyle = slot.disabled ? "#e2e8f0" : "#f7fafc";
  ctx.fill();
  ctx.strokeStyle = slot.selected ? "#0f7f78" : slot.highlighted ? "#f59e0b" : "#cbd5e1";
  ctx.lineWidth = slot.selected ? 2.5 : 1.5;
  ctx.stroke();

  ctx.fillStyle = slot.isIon ? "#0f766e" : "#1d4ed8";
  roundRect(ctx, x + 8, y + 8, 44, 18, 6);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px system-ui, sans-serif";
  ctx.fillText(slot.typeLabel.slice(0, 6), x + 12, y + 20);

  ctx.fillStyle = "#0b1b2b";
  ctx.font = "bold 12px system-ui, sans-serif";
  const name = slot.displayName;
  const maxWidth = DESK_CARD_WIDTH - 16;
  let line = name;
  while (ctx.measureText(line).width > maxWidth && line.length > 1) {
    line = `${line.slice(0, -1)}…`;
  }
  ctx.fillText(line, x + 8, y + DESK_CARD_HEIGHT / 2 + 4);

  ctx.drawImage(images.cardFrame, x, y, DESK_CARD_WIDTH, DESK_CARD_HEIGHT);

  if (slot.selected) {
    ctx.strokeStyle = "#0f7f78";
    ctx.lineWidth = 2.5;
    roundRect(ctx, x, y, DESK_CARD_WIDTH, DESK_CARD_HEIGHT, 9);
    ctx.stroke();
  }
}

function drawCenterPanel(
  ctx: CanvasRenderingContext2D,
  model: PlayPresentationModel,
  width: number,
  height: number,
) {
  const panelWidth = Math.min(width - 24, 420);
  const panelHeight = Math.min(180, height * 0.42);
  const x = (width - panelWidth) / 2;
  const y = (height - panelHeight) / 2;

  roundRect(ctx, x, y, panelWidth, panelHeight, 12);
  ctx.fillStyle = "rgba(15, 35, 50, 0.82)";
  ctx.fill();
  ctx.strokeStyle = "#2d5a7b";
  ctx.lineWidth = 1;
  ctx.stroke();

  const center = model.center;
  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.fillText(center.referenceEmptyLabel ? "Table Reference" : "Table Reference", x + 12, y + 20);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 14px system-ui, sans-serif";
  const refName = center.referenceName ?? center.referenceEmptyLabel;
  ctx.fillText(refName.slice(0, 36), x + 12, y + 44);

  if (center.cycleRoundLabel) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText(center.cycleRoundLabel, x + 12, y + 62);
  }

  if (center.recentName) {
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText(center.recentTitle ?? "", x + 12, y + 88);
    ctx.fillStyle = "#f1f5f9";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(center.recentName.slice(0, 32), x + 12, y + 106);
  }

  const chipY = y + panelHeight - 34;
  ctx.fillStyle = "rgba(30, 58, 78, 0.95)";
  roundRect(ctx, x + 12, chipY, 88, 24, 8);
  ctx.fill();
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillText(`${center.deckLabel}: ${center.deckCount}`, x + 18, chipY + 16);

  roundRect(ctx, x + 108, chipY, 100, 24, 8);
  ctx.fill();
  ctx.fillText(`${center.discardLabel}: ${center.discardCount}`, x + 114, chipY + 16);
}

export function renderDeskTableSurface(
  ctx: CanvasRenderingContext2D,
  model: PlayPresentationModel,
  layout: DeskCanvasLayout,
  images: DeskTableBrandImages,
  motion?: DeskSurfaceRenderMotion,
) {
  const ownCardLiftPx = motion?.ownCardLiftPx ?? (() => 0);
  const { width, height } = layout;
  ctx.clearRect(0, 0, width, height);
  drawDeskBackground(ctx, width, height);
  drawCenterPanel(ctx, model, width, height);

  for (const region of layout.hitRegions) {
    if (region.zone === "opponent") {
      const slot = model.opponentHand.cards.find((card) => card.cardInstanceId === region.cardInstanceId);
      if (!slot) continue;
      if (model.opponentHand.reveal === "backs") {
        drawCardBack(ctx, region.x, region.y, images);
      } else {
        drawCardFace(ctx, slot, region.x, region.y, images);
      }
      continue;
    }

    const slot = model.ownHand.find((card) => card.cardInstanceId === region.cardInstanceId);
    if (!slot) continue;
    const lift = ownCardLiftPx(region.cardInstanceId);
    drawCardFace(ctx, slot, region.x, region.y - lift, images);
  }

  const fly = motion?.playFly;
  if (fly) {
    drawCardFace(ctx, fly.slot, fly.x, fly.y, images);
  }
}

function createSolidTile(color: string): HTMLCanvasElement {
  const tile = document.createElement("canvas");
  tile.width = 4;
  tile.height = 4;
  const tileCtx = tile.getContext("2d");
  if (tileCtx) {
    tileCtx.fillStyle = color;
    tileCtx.fillRect(0, 0, 4, 4);
  }
  return tile;
}

export async function loadDeskTableBrandImages(): Promise<DeskTableBrandImages> {
  const fallback: DeskTableBrandImages = {
    cardBack: createSolidTile("#0f2740"),
    cardFrame: createSolidTile("#94a3b8"),
  };

  if (typeof Image === "undefined") {
    return fallback;
  }

  const load = async (src: string, color: string) => {
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error(`Failed to load brand asset: ${src}`));
        image.src = src;
      });
      return image;
    } catch {
      return createSolidTile(color);
    }
  };

  const [cardBack, cardFrame] = await Promise.all([
    load(PLAY_BRAND_ASSETS.cardBack, "#0f2740"),
    load(PLAY_BRAND_ASSETS.cardFrame, "#94a3b8"),
  ]);
  return { cardBack, cardFrame };
}
