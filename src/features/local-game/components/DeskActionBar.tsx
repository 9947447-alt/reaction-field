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

export function DeskActionBar({
  game,
  playerControllers,
  selectedCardId,
  selectedCardIds = [],
  isDiyMode = false,
  diyAnalysis = null,
  onEnterDiy,
  onCancelDiy,
  dispatchGameAction,
  onRestart,
  onReturnToCharacterSelection,
}: DeskActionBarProps) {
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  if (game.phase === "preparationSelection") {
    const pending = game.pendingLaboratoryPreparation;
    const isAi = Boolean(
      pending &&
        playerControllers &&
        playerControllers[pending.playerId === "player_1" ? 0 : 1] === "ai",
    );
    const keepCount = pending?.keepCount ?? 10;
    const selectedCount = selectedCardIds.length;
    const canConfirm = !isAi && selectedCount === keepCount && Boolean(pending);

    return (
      <nav aria-label={isEnglish ? "Preparation action bar" : "备课操作条"} className="desk-action-bar">
        <div className="desk-action-bar__info">
          <span className="desk-action-bar__phase-tag">
            {isEnglish ? "Preparation" : "备课阶段"}
          </span>
          <span className="desk-action-bar__hint">
            {isAi
              ? (isEnglish ? "AI is preparing..." : "AI 正在自动备课...")
              : isEnglish
                ? `Select ${keepCount} cards to keep (${selectedCount}/${keepCount} selected)`
                : `请在下方点选保留 ${keepCount} 张手牌（已选 ${selectedCount}/${keepCount} 张）`}
          </span>
        </div>
        <DeskActionButtons>
          <button
            className="desk-action-btn desk-action-btn--primary"
            disabled={!canConfirm}
            onClick={() => {
              if (!pending) return;
              dispatchGameAction({
                type: "CONFIRM_LABORATORY_PREPARATION",
                playerId: pending.playerId,
                keptCardInstanceIds: selectedCardIds,
              });
            }}
            type="button"
          >
            {isEnglish
              ? `Confirm Selection (${selectedCount}/${keepCount})`
              : `确认备课选择 (${selectedCount}/${keepCount})`}
          </button>
        </DeskActionButtons>
      </nav>
    );
  }

  if (game.phase === "responseWindow") {
    const pending = game.pendingResponse;
    const responder = pending ? getPlayer(game, pending.responderId) : undefined;
    const isAi = Boolean(
      responder &&
        playerControllers &&
        playerControllers[responder.id === "player_1" ? 0 : 1] === "ai",
    );
    const responseCards = !isAi && responder ? getResponseCards(game, responder) : [];
    const canRespond = Boolean(selectedCardId && responseCards.includes(selectedCardId));
    const incomingPlay = describeIncomingResponseAnnouncement(
      game,
      locale,
      playerControllers ? getOfficialHumanViewerPlayerId(playerControllers) : undefined,
    );

    return (
      <nav aria-label={isEnglish ? "Response action bar" : "响应操作条"} className="desk-action-bar">
        <div className="desk-action-bar__info">
          <span className="desk-action-bar__phase-tag is-response">
            {isEnglish ? "Response Window" : "响应阶段"}
          </span>
          <span className="desk-action-bar__hint">
            {incomingPlay ? `${incomingPlay} · ` : ""}
            {isAi
              ? (isEnglish ? "AI is evaluating response..." : "AI 正在响应...")
              : canRespond
                ? (isEnglish ? "Ready to respond with selected card" : "已选中响应牌，点击打出")
                : responseCards.length > 0
                  ? (isEnglish ? "Select a valid card to respond" : "请在下方点选合法响应牌")
                  : (isEnglish ? "No response cards available" : "无可用响应牌")}
          </span>
        </div>
        <DeskActionButtons>
          <button
            className="desk-action-btn desk-action-btn--primary"
            disabled={isAi || !canRespond}
            onClick={() => {
              if (!responder || !selectedCardId) return;
              dispatchGameAction({
                type: "RESPOND_WITH_CARD",
                playerId: responder.id,
                cardInstanceId: selectedCardId,
              });
            }}
            type="button"
          >
            {isEnglish ? "Play Response" : "打出响应"}
          </button>
          <button
            className="desk-action-btn desk-action-btn--secondary"
            disabled={isAi}
            onClick={() => {
              if (!responder) return;
              dispatchGameAction({
                type: "PASS_RESPONSE",
                playerId: responder.id,
              });
            }}
            type="button"
          >
            {isEnglish ? "Pass Response" : "放弃响应"}
          </button>
        </DeskActionButtons>
      </nav>
    );
  }

  if (game.phase === "experimentCounterattackWindow") {
    const pending = game.pendingExperimentCounterattack;
    const responder = pending ? getPlayer(game, pending.responderPlayerId) : undefined;
    const isAi = Boolean(
      responder &&
        playerControllers &&
        playerControllers[responder.id === "player_1" ? 0 : 1] === "ai",
    );
    const canRecover = pending?.legalOptions.includes("recover") ?? false;
    const pursuitCards = !isAi && responder ? getExperimentCounterattackPursuitCards(game, responder) : [];
    const isPursuitSelected = Boolean(selectedCardId && pursuitCards.includes(selectedCardId));

    return (
      <nav aria-label={isEnglish ? "Counterattack action bar" : "实验反击操作条"} className="desk-action-bar">
        <div className="desk-action-bar__info">
          <span className="desk-action-bar__phase-tag is-counterattack">
            {isEnglish ? "Experiment Counterattack" : "实验反击"}
          </span>
          <span className="desk-action-bar__hint">
            {isAi
              ? (isEnglish ? "AI deciding counterattack..." : "AI 正在选择反击选项...")
              : isPursuitSelected
                ? (isEnglish ? "Selected card for pursuit counterattack" : "已选中追击反击牌")
                : (isEnglish ? "Choose recovery or pursuit with a selected card" : "可选择回复 HP，或点选手牌追击")}
          </span>
        </div>
        <DeskActionButtons>
          {isPursuitSelected ? (
            <button
              className="desk-action-btn desk-action-btn--primary"
              disabled={isAi}
              onClick={() => {
                if (!responder || !selectedCardId) return;
                dispatchGameAction({
                  type: "RESOLVE_EXPERIMENT_COUNTERATTACK",
                  playerId: responder.id,
                  option: "acid-base-pursuit",
                  cardInstanceId: selectedCardId,
                });
              }}
              type="button"
            >
              {isEnglish ? "Pursuit Counterattack" : "追击反击"}
            </button>
          ) : (
            <button
              className="desk-action-btn desk-action-btn--primary"
              disabled={isAi || !canRecover}
              onClick={() => {
                if (!responder) return;
                dispatchGameAction({
                  type: "RESOLVE_EXPERIMENT_COUNTERATTACK",
                  playerId: responder.id,
                  option: "recover",
                });
              }}
              type="button"
            >
              {isEnglish ? "Recover 1 HP" : "回复 1 HP"}
            </button>
          )}
        </DeskActionButtons>
      </nav>
    );
  }

  if (game.phase === "statusWindow") {
    const pending = game.pendingStatusHandling;
    const player = pending ? getPlayer(game, pending.playerId) : undefined;
    const isAi = Boolean(
      player &&
        playerControllers &&
        playerControllers[player.id === "player_1" ? 0 : 1] === "ai",
    );
    const status = getPlayerStatusById(player, pending?.statusInstanceId);
    const handlingCards = !isAi && player && status ? getStatusHandlingCards(game, player, status) : [];
    const canHandle = Boolean(selectedCardId && handlingCards.includes(selectedCardId));

    return (
      <nav aria-label={isEnglish ? "Status handling action bar" : "状态处理操作条"} className="desk-action-bar">
        <div className="desk-action-bar__info">
          <span className="desk-action-bar__phase-tag is-status">
            {isEnglish ? "Status Handling" : "状态处理"}
          </span>
          <span className="desk-action-bar__hint">
            {status ? (isEnglish ? `Handling ${getStatusDisplayName(status.statusId, locale)} · ` : `处理 ${getStatusDisplayName(status.statusId, locale)} · `) : ""}
            {isAi
              ? (isEnglish ? "AI handling status..." : "AI 正在处理状态...")
              : canHandle
                ? (isEnglish ? "Selected card ready to handle status" : "已选中处理牌，点击执行")
                : handlingCards.length > 0
                  ? (isEnglish ? "Select card from hand to handle status" : "请在下方点选处理牌")
                  : (isEnglish ? "No handling card available" : "无可用处理牌")}
          </span>
        </div>
        <DeskActionButtons>
          <button
            className="desk-action-btn desk-action-btn--primary"
            disabled={isAi || !canHandle}
            onClick={() => {
              if (!player || !status || !selectedCardId) return;
              dispatchGameAction({
                type: "HANDLE_STATUS_WITH_CARD",
                playerId: player.id,
                statusInstanceId: status.id,
                cardInstanceId: selectedCardId,
              });
            }}
            type="button"
          >
            {isEnglish ? "Handle Status" : "处理状态"}
          </button>
          <button
            className="desk-action-btn desk-action-btn--secondary"
            disabled={isAi}
            onClick={() => {
              if (!player || !status) return;
              dispatchGameAction({
                type: "PASS_STATUS_HANDLING",
                playerId: player.id,
                statusInstanceId: status.id,
              });
            }}
            type="button"
          >
            {isEnglish ? "Pass Handling" : "放弃处理"}
          </button>
        </DeskActionButtons>
      </nav>
    );
  }

  if (game.phase === "gameOver") {
    return (
      <nav aria-label={isEnglish ? "Game over action bar" : "对局结束操作条"} className="desk-action-bar">
        <div className="desk-action-bar__info">
          <span className="desk-action-bar__phase-tag is-gameover">
            {isEnglish ? "Game Over" : "对局结束"}
          </span>
          <span className="desk-action-bar__hint">
            {isEnglish ? "The game has concluded." : "对局已结算完毕。"}
          </span>
        </div>
        <DeskActionButtons>
          <button
            className="desk-action-btn desk-action-btn--primary"
            onClick={(e) => onRestart?.(e.currentTarget)}
            type="button"
          >
            {isEnglish ? "Restart Current Lineup" : "按当前阵容重开"}
          </button>
          <button
            className="desk-action-btn desk-action-btn--secondary"
            onClick={(e) => onReturnToCharacterSelection?.(e.currentTarget)}
            type="button"
          >
            {isEnglish ? "Return to Character Selection" : "返回角色选择"}
          </button>
        </DeskActionButtons>
      </nav>
    );
  }

  const activePlayer = getActivePlayer(game);
  const isAi = Boolean(
    activePlayer &&
      playerControllers &&
      playerControllers[activePlayer.id === "player_1" ? 0 : 1] === "ai",
  );
  const targets = activePlayer ? getOpponentTargets(game, activePlayer.id) : [];
  const legalSkillActions =
    !isAi && activePlayer ? getLegalCharacterSkillActions(game, activePlayer.id) : [];
  const deskSkillActions = pickDeskSkillActions(legalSkillActions, selectedCardId);

  if (isDiyMode && activePlayer) {
    const isExecutable = diyAnalysis?.status === "EXECUTABLE";
    let diyHint = isEnglish ? "Select component cards from hand" : "请点选手牌中的组件卡牌组合";

    if (selectedCardIds.length > 0) {
      if (diyAnalysis?.status === "INVALID_SELECTION") {
        diyHint = isEnglish ? "Invalid card selection" : "所选卡牌包含无效实例";
      } else if (diyAnalysis?.status === "NO_RECIPE_MATCH") {
        diyHint = isEnglish ? "No matching DIY recipe" : "当前所选暂无可执行 DIY 配方";
      } else if (diyAnalysis?.status === "MATCHED_NOT_EXECUTABLE") {
        const rName = getDiyRecipeDisplayName(diyAnalysis.recipeId, diyAnalysis.recipeId, locale);
        const bMsg = getDiyBlockerDisplayName(diyAnalysis.blockerCode, locale);
        diyHint = `${rName} · ${bMsg}`;
      } else if (diyAnalysis?.status === "EXECUTABLE") {
        const outcome = diyAnalysis.outcome;
        let out = "";
        if (outcome.kind === "CO2_REMOVE_OWN_FIRE" || outcome.kind === "H2O_REMOVE_OWN_FIRE") {
          out = isEnglish ? "Remove own fire" : "移除自身火情";
        } else if (outcome.kind === "SO2_APPLY_LEAK") {
          out = isEnglish ? "Apply SO2 leak" : "施加 SO2 泄漏";
        } else if (outcome.kind === "VIRTUAL_ATTACK") {
          const kindName = getDamageKindDisplayName(outcome.damageKind, locale);
          const prodName = getDiyVirtualProductDisplayName(diyAnalysis.recipeId, locale);
          out = `${prodName} · ${outcome.damageAmount} ${kindName}`;
        }
        diyHint = `${getDiyRecipeDisplayName(diyAnalysis.recipeId, diyAnalysis.recipeId, locale)} (${out})`;
      }
    }

    return (
      <nav aria-label={isEnglish ? "DIY action bar" : "DIY 操作条"} className="desk-action-bar">
        <div className="desk-action-bar__info">
          <span className="desk-action-bar__phase-tag is-diy">
            {isEnglish ? "Active DIY" : "主动 DIY"}
          </span>
          <span className="desk-action-bar__hint">{diyHint}</span>
        </div>
        <DeskActionButtons>
          <button
            className="desk-action-btn desk-action-btn--primary"
            disabled={!isExecutable}
            onClick={() => {
              if (!diyAnalysis || diyAnalysis.status !== "EXECUTABLE") return;
              const outcome = diyAnalysis.outcome;
              const targetId =
                outcome.kind === "VIRTUAL_ATTACK" || outcome.kind === "SO2_APPLY_LEAK"
                  ? outcome.targetPlayerId
                  : undefined;
              dispatchGameAction({
                type: "PLAY_DIY_SELECTION",
                playerId: activePlayer.id,
                componentCardInstanceIds: selectedCardIds,
                targetPlayerId: targetId,
              });
              onCancelDiy?.();
            }}
            type="button"
          >
            {isEnglish ? "Execute DIY" : "执行主动 DIY"}
          </button>
          <button
            className="desk-action-btn desk-action-btn--secondary"
            onClick={onCancelDiy}
            type="button"
          >
            {isEnglish ? "Cancel DIY" : "取消 DIY"}
          </button>
        </DeskActionButtons>
      </nav>
    );
  }

  const canDiy = Boolean(
    !isAi &&
      activePlayer &&
      !activePlayer.usedDIYThisCycle &&
      activePlayer.hand.some((id) =>
        getCardDefinition(game, id)?.allowedTimings.includes("diy-component"),
      ),
  );

  const selectedCardDef = selectedCardId && activePlayer
    ? getCardDefinition(game, selectedCardId)
    : undefined;
  const canExecute = Boolean(
    !isAi &&
      activePlayer &&
      selectedCardId &&
      canExecuteMainActionEffect(game, activePlayer, selectedCardId),
  );
  const canAssociate = Boolean(
    !isAi &&
      activePlayer &&
      selectedCardId &&
      canPlayAgainstCurrentTableReference(game, activePlayer, selectedCardId),
  );

  const isOxygen = selectedCardDef?.id === "substance_o2";
  const targetPlayerId = isOxygen ? activePlayer?.id : targets[0]?.id;
  const keepSkillSlot = Boolean(selectedCardId && deskSkillActions.length > 0);

  let hintText = isAi
    ? (isEnglish ? "AI is playing..." : "AI 正在行动...")
    : selectedCardDef
      ? `${getOptionalCardDisplayName(selectedCardDef, locale)}`
      : (isEnglish ? "Select a card from hand to play, or end action" : "请点选一张手牌出牌，或结束行动");

  if (!isAi && selectedCardDef) {
    if (canExecute && canAssociate) {
      hintText += isEnglish ? " (Can run effect or play reference)" : " (可执行效果或普通出牌)";
    } else if (canExecute) {
      hintText += isEnglish ? " (Can run effect)" : " (可执行效果)";
    } else if (canAssociate) {
      hintText += isEnglish ? " (Can play reference)" : " (可作为场面基准普通出牌)";
    } else {
      hintText += isEnglish ? " (Cannot play currently)" : " (当前不可出牌)";
    }
  }

  return (
    <nav aria-label={isEnglish ? "Main action bar" : "主行动操作条"} className="desk-action-bar">
      <div className="desk-action-bar__info">
        <span className="desk-action-bar__phase-tag">
          {isEnglish ? "Main Action" : "主行动"}
        </span>
        <span className="desk-action-bar__hint">{hintText}</span>
      </div>
      <DeskActionButtons>
        {takeOfficialDeskButtons([
          ...(selectedCardId
            ? [
                {
                  kind: "play" as const,
                  node: canExecute ? (
                    <button
                      className="desk-action-btn desk-action-btn--primary"
                      disabled={isAi}
                      key="play-effect"
                      onClick={() => {
                        if (!activePlayer || !selectedCardId) return;
                        dispatchGameAction({
                          type: "PLAY_CARD",
                          playerId: activePlayer.id,
                          cardInstanceId: selectedCardId,
                          targetPlayerId,
                        });
                      }}
                      type="button"
                    >
                      {isEnglish ? "Run Effect" : "执行效果"}
                    </button>
                  ) : canAssociate ? (
                    <button
                      className="desk-action-btn desk-action-btn--primary"
                      disabled={isAi}
                      key="play-reference"
                      onClick={() => {
                        if (!activePlayer || !selectedCardId) return;
                        dispatchGameAction({
                          type: "PLAY_REFERENCE_CARD",
                          playerId: activePlayer.id,
                          cardInstanceId: selectedCardId,
                        });
                      }}
                      type="button"
                    >
                      {isEnglish ? "Play" : "普通出牌"}
                    </button>
                  ) : (
                    <button
                      className="desk-action-btn desk-action-btn--primary"
                      disabled
                      key="play-blocked"
                      type="button"
                    >
                      {isEnglish ? "Cannot Play" : "不可出牌"}
                    </button>
                  ),
                },
              ]
            : []),
          ...deskSkillActions.map((action) => ({
            kind: "skill" as const,
            node: (
              <button
                className="desk-action-btn desk-action-btn--skill"
                data-skill-id={action.skillId}
                key={`skill-${action.skillId}-${"cardInstanceId" in action ? action.cardInstanceId : "targetPlayerId" in action ? action.targetPlayerId : "solo"}`}
                onClick={() => {
                  dispatchGameAction(action);
                }}
                type="button"
              >
                {isEnglish
                  ? `Activate ${getSkillDisplayName(action.skillId, locale)}`
                  : `发动${getSkillDisplayName(action.skillId, locale)}`}
              </button>
            ),
          })),
          ...(keepSkillSlot
            ? []
            : selectedCardId && canExecute && canAssociate
              ? [
                  {
                    kind: "play" as const,
                    node: (
                      <button
                        className="desk-action-btn desk-action-btn--secondary"
                        disabled={isAi}
                        key="play-reference-secondary"
                        onClick={() => {
                          if (!activePlayer || !selectedCardId) return;
                          dispatchGameAction({
                            type: "PLAY_REFERENCE_CARD",
                            playerId: activePlayer.id,
                            cardInstanceId: selectedCardId,
                          });
                        }}
                        type="button"
                      >
                        {isEnglish ? "Play" : "普通出牌"}
                      </button>
                    ),
                  },
                ]
              : [
                  {
                    kind: "diy" as const,
                    node: (
                      <button
                        className="desk-action-btn desk-action-btn--secondary"
                        disabled={!canDiy}
                        key="enter-diy"
                        onClick={onEnterDiy}
                        type="button"
                      >
                        {isEnglish ? "Active DIY" : "进入主动 DIY"}
                      </button>
                    ),
                  },
                ]),
          {
            kind: "end" as const,
            node: (
              <button
                className="desk-action-btn desk-action-btn--secondary"
                disabled={isAi}
                key="end-action"
                onClick={() => {
                  if (!activePlayer) return;
                  dispatchGameAction({
                    type: "PASS_ACTION",
                    playerId: activePlayer.id,
                  });
                }}
                type="button"
              >
                {isEnglish ? "End Action" : "结束本次行动"}
              </button>
            ),
          },
        ])}
      </DeskActionButtons>
    </nav>
  );
}
