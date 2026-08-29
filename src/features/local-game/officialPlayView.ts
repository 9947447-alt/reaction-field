import { projectHumanPlayState } from "../../game/engine/humanPlayView";
import type { GameState, PlayerId } from "../../game/engine/types";
import type { VisibilityMode } from "../../game/engine/visibility";
import type { PlayerControllerSelection } from "./localGameSession";

export function getOfficialHumanViewerPlayerId(
  controllers: PlayerControllerSelection,
): PlayerId | undefined {
  const humanIndexes = controllers.flatMap((controller, index) =>
    controller === "human" ? [index] : [],
  );
  if (humanIndexes.length !== 1) {
    return undefined;
  }
  return `player_${humanIndexes[0] + 1}`;
}

export function getOfficialVisibilityMode(
  controllers: PlayerControllerSelection,
): VisibilityMode {
  return getOfficialHumanViewerPlayerId(controllers) ? "human-play" : "public-debug";
}

export function getOfficialPlayState(
  game: GameState,
  controllers: PlayerControllerSelection,
): GameState {
  const viewerId = getOfficialHumanViewerPlayerId(controllers);
  return viewerId ? projectHumanPlayState(game, viewerId) : game;
}
