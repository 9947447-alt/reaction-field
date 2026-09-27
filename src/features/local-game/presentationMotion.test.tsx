import { describe, expect, it } from "vitest";
import type { CardInstanceId } from "../../game/engine/types";
import { createInitialGame } from "../../game/engine/createInitialGame";
import { projectHumanPlayState } from "../../game/engine/humanPlayView";
import { buildPlayPresentationModel } from "./presentation/buildPlayPresentationModel";
import { hitTestDeskTableSurface, layoutDeskTableSurface } from "./presentation/layoutDeskTableSurface";
import {
  easeOutCubic,
  inferSingleOwnHandCardRemoved,
  playFlyPosition,
  stepToward,
  targetLiftForCard,
} from "./presentation/deskTableSurfaceMotion";
import {
  DESK_CARD_SELECTED_LIFT,
  type PlayPresentationModel,
  type PresentationCardSlot,
} from "./presentation/playPresentationTypes";

function slot(id: string): PresentationCardSlot {
  return {
    cardInstanceId: id as CardInstanceId,
    displayName: id,
    typeLabel: "T",
    isIon: false,
    selected: false,
    highlighted: false,
    disabled: false,
    interactive: true,
  };
}

function handModel(ownIds: string[]): PlayPresentationModel {
  return {
    opponentHand: { reveal: "backs", cards: [] },
    ownHand: ownIds.map((id) => slot(id)),
    center: {
      referenceEmptyLabel: "Empty",
      referenceHintLabel: "",
      deckLabel: "Deck",
      discardLabel: "Discard",
      deckCount: 0,
      discardCount: 0,
    },
  };
}

describe("PlayPresentationModel", () => {
  it("redacts opponent hand names in solo human vs AI via getOfficialPlayState", () => {
    const game = createInitialGame({
      characterIds: ["chemical_factory_ceo", "acid_king"],
      seed: 42,
    });
    const model = buildPlayPresentationModel({
      game,
      playerControllers: ["human", "ai"],
      locale: "zh-CN",
      ownPlayerId: "player_1",
      opponentPlayerId: "player_2",
      opponentHandReveal: "faces",
      ownHandDisabled: false,
      opponentHandDisabled: true,
    });

    expect(model.opponentHand.reveal).toBe("backs");
    expect(model.opponentHand.cards.length).toBeGreaterThan(0);
    expect(model.opponentHand.cards.every((card) => card.displayName === "")).toBe(true);
    expect(model.ownHand.every((card) => card.displayName.length > 0)).toBe(true);
  });

  it("exposes opponent faces in local two-player mode", () => {
    const game = createInitialGame({
      characterIds: ["laboratory_teacher", "laboratory_teacher"],
      seed: 7,
    });
    const model = buildPlayPresentationModel({
      game,
      playerControllers: ["human", "human"],
      locale: "zh-CN",
      ownPlayerId: "player_1",
      opponentPlayerId: "player_2",
      opponentHandReveal: "faces",
      ownHandDisabled: false,
      opponentHandDisabled: false,
    });

    expect(model.opponentHand.reveal).toBe("faces");
    expect(model.opponentHand.cards.some((card) => card.displayName.length > 0)).toBe(true);
  });

  it("layout hit-test returns interactive own card regions", () => {
    const game = projectHumanPlayState(
      createInitialGame({
        characterIds: ["chemical_factory_ceo", "acid_king"],
        seed: 1,
      }),
      "player_1",
    );
    const model = buildPlayPresentationModel({
      game,
      playerControllers: ["human", "ai"],
      locale: "zh-CN",
      ownPlayerId: "player_1",
      opponentPlayerId: "player_2",
      opponentHandReveal: "faces",
      ownHandDisabled: false,
      opponentHandDisabled: true,
    });
    const layout = layoutDeskTableSurface(model, 900, 420);
    const ownRegion = layout.hitRegions.find((region) => region.zone === "own" && region.interactive);
    expect(ownRegion).toBeDefined();
    const hit = hitTestDeskTableSurface(
      layout,
      ownRegion!.x + ownRegion!.width / 2,
      ownRegion!.y + ownRegion!.height / 2,
    );
    expect(hit?.cardInstanceId).toBe(ownRegion!.cardInstanceId);
  });

  it("hit-test follows animated own-card lift offset", () => {
    const game = projectHumanPlayState(
      createInitialGame({
        characterIds: ["chemical_factory_ceo", "acid_king"],
        seed: 2,
      }),
      "player_1",
    );
    const model = buildPlayPresentationModel({
      game,
      playerControllers: ["human", "ai"],
      locale: "zh-CN",
      ownPlayerId: "player_1",
      opponentPlayerId: "player_2",
      opponentHandReveal: "faces",
      ownHandDisabled: false,
      opponentHandDisabled: true,
    });
    const layout = layoutDeskTableSurface(model, 900, 420);
    const ownRegion = layout.hitRegions.find((region) => region.zone === "own" && region.interactive);
    expect(ownRegion).toBeDefined();
    const lift = 12;
    const miss = hitTestDeskTableSurface(
      layout,
      ownRegion!.x + ownRegion!.width / 2,
      ownRegion!.y - lift - 4,
      () => lift,
    );
    expect(miss).toBeUndefined();
    const hit = hitTestDeskTableSurface(
      layout,
      ownRegion!.x + ownRegion!.width / 2,
      ownRegion!.y - lift + ownRegion!.height / 2,
      () => lift,
    );
    expect(hit?.cardInstanceId).toBe(ownRegion!.cardInstanceId);
  });
});

describe("deskTableSurfaceMotion", () => {
  it("eases selection lift toward target", () => {
    const next = stepToward(0, DESK_CARD_SELECTED_LIFT, 80, 160);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(DESK_CARD_SELECTED_LIFT);
    expect(stepToward(DESK_CARD_SELECTED_LIFT, 0, 200, 160)).toBe(0);
  });

  it("resolves lift targets from selection props", () => {
    expect(targetLiftForCard("a" as CardInstanceId, "a" as CardInstanceId, [])).toBe(
      DESK_CARD_SELECTED_LIFT,
    );
    expect(targetLiftForCard("b" as CardInstanceId, undefined, ["b" as CardInstanceId])).toBe(
      DESK_CARD_SELECTED_LIFT,
    );
    expect(targetLiftForCard("c" as CardInstanceId, undefined, [])).toBe(0);
  });

  it("infers a single-card own-hand removal for play fly", () => {
    const previous = handModel(["a", "b", "c"]);
    const next = handModel(["a", "c"]);
    expect(inferSingleOwnHandCardRemoved(previous, next)?.cardInstanceId).toBe("b");
    expect(inferSingleOwnHandCardRemoved(previous, handModel(["a"]))).toBeUndefined();
  });

  it("interpolates play fly position", () => {
    const motion = {
      cardInstanceId: "b" as CardInstanceId,
      slot: slot("b"),
      fromX: 10,
      fromY: 200,
      toX: 110,
      toY: 80,
      startedAtMs: 0,
    };
    expect(playFlyPosition(motion, easeOutCubic(0))).toEqual({ x: 10, y: 200 });
    expect(playFlyPosition(motion, 1)).toEqual({ x: 110, y: 80 });
  });
});
