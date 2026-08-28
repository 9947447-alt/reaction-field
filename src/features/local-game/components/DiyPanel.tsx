import { useEffect, useMemo, useState } from "react";
import { useLocale } from "../../../app/locale";
import type { GameAction } from "../../../game/engine/actions";
import { analyzeDIYSelection } from "../../../game/engine/diy";
import type {
  CardInstanceId,
  DIYSelectionAnalysis,
  GameState,
  PlayerId,
} from "../../../game/engine/types";
import type { PlayerControllerSelection } from "../localGameSession";
import {
  getActivePlayer,
  getCardDefinition,
  getOpponentTargets,
  getPlayer,
} from "../localGameView";
import {
  getCardDisplayName,
  getDamageKindDisplayName,
  getDiyBlockerDisplayName,
  getDiyRecipeDisplayName,
  getDiyVirtualProductDisplayName,
  getPlayerDisplayName,
} from "../presentationLocale";

type DiyPanelProps = {
  game: GameState;
  playerControllers?: PlayerControllerSelection;
  dispatchGameAction: (action: GameAction) => void;
};

export function DiyPanel({ game, playerControllers, dispatchGameAction }: DiyPanelProps) {
  const { locale } = useLocale();
  const isEnglish = locale === "en";
  const activePlayer = getActivePlayer(game);
  const isAi = Boolean(
    activePlayer &&
      playerControllers &&
      playerControllers[activePlayer.id === "player_1" ? 0 : 1] === "ai",
  );

  const candidateCardIds = useMemo(() => {
    if (!activePlayer) return [];
    return activePlayer.hand.filter((cardId) => {
      const def = getCardDefinition(game, cardId);
      return def?.allowedTimings.includes("diy-component");
    });
  }, [activePlayer, game]);

  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectedCardIds, setSelectedCardIds] = useState<CardInstanceId[]>([]);
  const [targetPlayerId, setTargetPlayerId] = useState<PlayerId | undefined>();
  const targets = activePlayer ? getOpponentTargets(game, activePlayer.id) : [];
  const defaultTargetPlayerId = targets[0]?.id;

  const effectiveTargetPlayerId =
    targetPlayerId && targets.some((t) => t.id === targetPlayerId)
      ? targetPlayerId
      : defaultTargetPlayerId;

  useEffect(() => {
    setIsSelecting(false);
    setSelectedCardIds([]);
  }, [activePlayer?.id, game.cycleNumber, game.roundInCycle, game.phase]);

  useEffect(() => {
    setSelectedCardIds((prev) => prev.filter((id) => candidateCardIds.includes(id)));
  }, [candidateCardIds]);

  const analysis: DIYSelectionAnalysis | null = useMemo(() => {
    if (!isSelecting || !activePlayer || selectedCardIds.length === 0) {
      return null;
    }
    const initialAnalysis = analyzeDIYSelection(
      game,
      activePlayer.id,
      selectedCardIds,
      undefined,
    );
    if (
      initialAnalysis.status === "MATCHED_NOT_EXECUTABLE" &&
      initialAnalysis.blockerCode === "TARGET_PLAYER_REQUIRED"
    ) {
      return analyzeDIYSelection(
        game,
        activePlayer.id,
        selectedCardIds,
        effectiveTargetPlayerId,
      );
    }
    return initialAnalysis;
  }, [activePlayer, effectiveTargetPlayerId, game, isSelecting, selectedCardIds]);

  if (game.phase !== "mainAction" || !activePlayer) {
    return null;
  }

  const canSubmit = !isAi && analysis?.status === "EXECUTABLE";

  const isTargetRequired = Boolean(
    analysis &&
      ((analysis.status === "EXECUTABLE" &&
        (analysis.outcome.kind === "VIRTUAL_ATTACK" ||
          analysis.outcome.kind === "SO2_APPLY_LEAK")) ||
        (analysis.status === "MATCHED_NOT_EXECUTABLE" &&
          (analysis.blockerCode === "TARGET_PLAYER_REQUIRED" ||
            analysis.blockerCode === "TARGET_PLAYER_INVALID"))),
  );

  const isNoTargetRecipe = Boolean(
    analysis &&
      ((analysis.status === "EXECUTABLE" &&
        (analysis.outcome.kind === "CO2_REMOVE_OWN_FIRE" ||
          analysis.outcome.kind === "H2O_REMOVE_OWN_FIRE")) ||
        (analysis.status === "MATCHED_NOT_EXECUTABLE" &&
          (analysis.blockerCode === "OWN_FIRE_REQUIRED" ||
            analysis.blockerCode === "UNEXPECTED_TARGET"))),
  );

  function renderPreview() {
    if (selectedCardIds.length === 0) {
      return (
        <p className="empty-note">
          {isEnglish
            ? "Select component cards from your hand to craft."
            : "请在下方点选手牌中的组件卡牌组合出牌。"}
        </p>
      );
    }

    if (!analysis) {
      return null;
    }

    if (analysis.status === "INVALID_SELECTION") {
      return (
        <p className="error-banner">
          {isEnglish
            ? "Selection contains invalid card instances."
            : "所选卡牌包含无效实例。"}
        </p>
      );
    }

    if (analysis.status === "NO_RECIPE_MATCH") {
      return (
        <p className="panel-note">
          {isEnglish
            ? "No matching DIY recipe for current selection."
            : "当前所选组合暂无可执行 DIY 配方。"}
        </p>
      );
    }

    if (analysis.status === "MATCHED_NOT_EXECUTABLE") {
      const recipeName = getDiyRecipeDisplayName(analysis.recipeId, analysis.recipeId, locale);
      const blockerMessage = getDiyBlockerDisplayName(analysis.blockerCode, locale);
      return (
        <div className="diy-preview-card is-blocked">
          <p className="diy-preview-title">
            {isEnglish ? "Matched recipe: " : "匹配配方："}
            <strong>{recipeName}</strong>
          </p>
          <p className="diy-blocker-message">{blockerMessage}</p>
        </div>
      );
    }

    if (analysis.status === "EXECUTABLE") {
      const outcome = analysis.outcome;
      let outcomeText = "";
      if (outcome.kind === "CO2_REMOVE_OWN_FIRE") {
        outcomeText = isEnglish
          ? "Effect: Remove own Fire status (CO2)"
          : "执行效果：移除自身火情状态 (CO2)";
      } else if (outcome.kind === "H2O_REMOVE_OWN_FIRE") {
        outcomeText = isEnglish
          ? "Effect: Remove own Fire status (H2O)"
          : "执行效果：移除自身火情状态 (H2O)";
      } else if (outcome.kind === "SO2_APPLY_LEAK") {
        const target = getPlayer(game, outcome.targetPlayerId);
        const targetName = getPlayerDisplayName(target, locale);
        outcomeText = isEnglish
          ? `Effect: Apply SO2 leak to ${targetName}`
          : `执行效果：对 ${targetName} 施加 SO2 泄漏状态`;
      } else if (outcome.kind === "VIRTUAL_ATTACK") {
        const target = getPlayer(game, outcome.targetPlayerId);
        const targetName = getPlayerDisplayName(target, locale);
        const kindName = getDamageKindDisplayName(outcome.damageKind, locale);
        const prodName = getDiyVirtualProductDisplayName(analysis.recipeId, locale);
        outcomeText = isEnglish
          ? `Effect: Virtual product ${prodName}, deal ${outcome.damageAmount} ${kindName} damage to ${targetName} (awaiting response)`
          : `执行效果：生成虚拟产品 ${prodName}，对 ${targetName} 造成 ${outcome.damageAmount} 点${kindName}伤害（等待响应）`;
      }

      return (
        <div className="diy-preview-card is-executable">
          <p className="diy-preview-title">
            {isEnglish ? "Matched recipe: " : "匹配配方："}
            <strong>{getDiyRecipeDisplayName(analysis.recipeId, analysis.recipeId, locale)}</strong>
          </p>
          <p className="diy-outcome-message">{outcomeText}</p>
        </div>
      );
    }

    return null;
  }

  function handleCancelDiy() {
    setSelectedCardIds([]);
    setIsSelecting(false);
  }

  function handlePlayDiy() {
    if (!activePlayer || !canSubmit || !analysis || analysis.status !== "EXECUTABLE") {
      return;
    }

    const targetId =
      analysis.outcome.kind === "VIRTUAL_ATTACK" || analysis.outcome.kind === "SO2_APPLY_LEAK"
        ? analysis.outcome.targetPlayerId
        : undefined;

    dispatchGameAction({
      type: "PLAY_DIY_SELECTION",
      playerId: activePlayer.id,
      componentCardInstanceIds: selectedCardIds,
      targetPlayerId: targetId,
    });
    setSelectedCardIds([]);
    setIsSelecting(false);
  }

  return (
    <section className="debug-section diy-panel" aria-labelledby="diy-title">
      <div className="panel-heading">
        <div>
          <p className="debug-kicker">
            {isEnglish ? "Select component cards to craft" : "点选手牌组件组合出牌"}
          </p>
          <h2 id="diy-title">{isEnglish ? "Active DIY" : "主动 DIY"}</h2>
        </div>
        <span className={activePlayer.usedDIYThisCycle ? "warn-pill" : "ok-pill"}>
          {activePlayer.usedDIYThisCycle
            ? isEnglish
              ? "Used this cycle"
              : "本周期已用"
            : isEnglish
              ? "Available this cycle"
              : "本周期可用"}
        </span>
      </div>

      <details className="debug-details">
        <summary>{isEnglish ? "Debug details" : "调试详情"}</summary>
        <p>
          PLAY_DIY_SELECTION · status: {isSelecting ? (analysis?.status ?? "NO_SELECTION") : "NOT_IN_DIY_MODE"}
          {isSelecting && analysis && "recipeId" in analysis ? ` · recipe: ${analysis.recipeId}` : ""}
          {isSelecting && analysis && "blockerCode" in analysis ? ` · blocker: ${analysis.blockerCode}` : ""}
        </p>
      </details>

      {!isSelecting ? (
        <div className="diy-entry-section">
          <button
            className="secondary-button"
            disabled={isAi}
            onClick={() => setIsSelecting(true)}
            type="button"
          >
            {isEnglish ? "Enter active DIY" : "进入主动 DIY"}
          </button>
        </div>
      ) : (
        <>
          <div className="diy-candidate-section">
            <div className="diy-candidate-heading">
              <span className="diy-candidate-label">
                {isEnglish ? "Hand component cards" : "手牌组件卡"}
              </span>
              {selectedCardIds.length > 0 ? (
                <button
                  className="secondary-button compact-button"
                  disabled={isAi}
                  onClick={() => setSelectedCardIds([])}
                  type="button"
                >
                  {isEnglish
                    ? `Clear selection (${selectedCardIds.length})`
                    : `清空选择 (${selectedCardIds.length})`}
                </button>
              ) : null}
            </div>

            {candidateCardIds.length > 0 ? (
              <div
                className="candidate-grid"
                role="group"
                aria-label={isEnglish ? "DIY component cards" : "DIY 组件卡牌"}
              >
                {candidateCardIds.map((cardInstanceId) => {
                  const isSelected = selectedCardIds.includes(cardInstanceId);
                  const def = getCardDefinition(game, cardInstanceId);
                  const cardName = def
                    ? getCardDisplayName(def.id, def.name, locale)
                    : cardInstanceId;

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={`debug-card candidate-card${isSelected ? " is-selected" : ""}`}
                      disabled={isAi}
                      key={cardInstanceId}
                      onClick={() => {
                        setSelectedCardIds((prev) =>
                          prev.includes(cardInstanceId)
                            ? prev.filter((id) => id !== cardInstanceId)
                            : [...prev, cardInstanceId],
                        );
                      }}
                      type="button"
                    >
                      <span className="debug-card__name">{cardName}</span>
                      <span className="debug-card__line">{cardInstanceId}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="empty-note">
                {isEnglish ? "No DIY component cards in hand." : "手牌中暂无可用 DIY 组件牌。"}
              </p>
            )}
          </div>

          {isTargetRequired ? (
            <label className="field-row">
              <span>{isEnglish ? "DIY target" : "DIY 目标"}</span>
              <select
                disabled={isAi}
                onChange={(e) => setTargetPlayerId(e.target.value as PlayerId)}
                value={effectiveTargetPlayerId ?? ""}
              >
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {getPlayerDisplayName(t, locale)}
                  </option>
                ))}
              </select>
            </label>
          ) : isNoTargetRecipe ? (
            <p className="empty-note">
              {isEnglish ? "No target required." : "此配方不需要选择目标。"}
            </p>
          ) : null}

          <div className="diy-preview-section">{renderPreview()}</div>

          <div className="diy-action-row">
            <button
              className="primary-button"
              disabled={!canSubmit}
              onClick={handlePlayDiy}
              type="button"
            >
              {isEnglish ? "Run active DIY" : "执行主动 DIY"}
            </button>
            <button
              className="secondary-button"
              disabled={isAi}
              onClick={handleCancelDiy}
              type="button"
            >
              {isEnglish ? "Cancel DIY" : "取消 DIY"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

