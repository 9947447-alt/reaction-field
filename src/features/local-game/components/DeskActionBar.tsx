import { Children, type ReactNode } from "react";
import { useLocale } from "../../../app/locale";
import type { ActivateCharacterSkillAction, GameAction } from "../../../game/engine/actions";
import { getLegalCharacterSkillActions } from "../../../game/engine/characterSkills";
import type {
  CardInstanceId,
  DIYSelectionAnalysis,
  GameState,
} from "../../../game/engine/types";
import type { PlayerControllerSelection } from "../localGameSession";
import {
  canExecuteMainActionEffect,
  canPlayAgainstCurrentTableReference,
  getActivePlayer,
  getCardDefinition,
  getExperimentCounterattackPursuitCards,
  getOpponentTargets,
  getPlayer,
  getPlayerStatusById,
  getResponseCards,
  getStatusHandlingCards,
} from "../localGameView";
import {
  getDamageKindDisplayName,
  getDiyBlockerDisplayName,
  getDiyRecipeDisplayName,
  getDiyVirtualProductDisplayName,
  getOptionalCardDisplayName,
  getPlayerDisplayName,
  getSkillDisplayName,
  getStatusDisplayName,
} from "../presentationLocale";
import { describeIncomingResponseAnnouncement } from "../publicRecentAction";
import { getOfficialHumanViewerPlayerId } from "../officialPlayView";

export type DeskActionBarProps = Readonly<{
  game: GameState;
  playerControllers?: PlayerControllerSelection;
  selectedCardId?: CardInstanceId;
  selectedCardIds?: CardInstanceId[];
  isDiyMode?: boolean;
  diyAnalysis?: DIYSelectionAnalysis | null;
  onEnterDiy?: () => void;
  onCancelDiy?: () => void;
  dispatchGameAction: (action: GameAction) => void;
  onRestart?: (trigger: HTMLButtonElement) => void;
  onReturnToCharacterSelection?: (trigger: HTMLButtonElement) => void;
}>;

const MAX_DESK_ACTION_BUTTONS = 3;

type DeskButtonKind = "play" | "skill" | "end" | "diy";

type DeskButtonItem = Readonly<{
  kind: DeskButtonKind;
  node: ReactNode;
}>;

function DeskActionButtons({ children }: { children: ReactNode }) {
  return (
    <div className="desk-action-bar__buttons">
      {Children.toArray(children).slice(0, MAX_DESK_ACTION_BUTTONS)}
    </div>
  );
}

function pickDeskSkillActions(
  legalActions: readonly ActivateCharacterSkillAction[],
  selectedCardId: CardInstanceId | undefined,
): ActivateCharacterSkillAction[] {
  const alkaliActions = legalActions.filter(
    (action): action is Extract<ActivateCharacterSkillAction, { skillId: "alkali_recovery" }> =>
      action.skillId === "alkali_recovery",
  );
  const otherActions = legalActions.filter((action) => action.skillId !== "alkali_recovery");
  const picked: ActivateCharacterSkillAction[] = [...otherActions];

  if (alkaliActions.length > 0) {
    const bound = selectedCardId
      ? alkaliActions.find((action) => action.cardInstanceId === selectedCardId)
      : undefined;
    picked.push(bound ?? alkaliActions[0]);
  }

  return picked;
}

function takeOfficialDeskButtons(items: readonly DeskButtonItem[]): ReactNode[] {
  const play = items.filter((item) => item.kind === "play");
  const skills = items.filter((item) => item.kind === "skill");
  const rest = items.filter((item) => item.kind === "end" || item.kind === "diy");
  const out: ReactNode[] = [];

  for (const item of play) {
    if (out.length >= MAX_DESK_ACTION_BUTTONS) {
      break;
    }
    out.push(item.node);
  }

  const skillBudget = Math.max(0, MAX_DESK_ACTION_BUTTONS - out.length);
  for (const item of skills.slice(0, skillBudget)) {
    out.push(item.node);
  }

  for (const item of rest) {
    if (out.length >= MAX_DESK_ACTION_BUTTONS) {
      break;
    }
    out.push(item.node);
  }

  return out;
}
