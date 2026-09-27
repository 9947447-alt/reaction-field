import { describe, expect, it } from "vitest";
import { createInitialGame } from "../../../game/engine/createInitialGame";
import { projectHumanPlayState } from "../../../game/engine/humanPlayView";
import { buildPlayPresentationModel } from "./buildPlayPresentationModel";
import { hitTestDeskTableSurface, layoutDeskTableSurface } from "./layoutDeskTableSurface";

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
});
