import { useEffect, useState } from "react";
import { useLocale } from "../../../app/locale";
import type { GameAction } from "../../../game/engine/actions";
import type { CardInstanceId, GameState } from "../../../game/engine/types";
import type { PlayerControllerSelection } from "../localGameSession";
import { CardDebugCard } from "./CardDebugCard";
import { getAiAutoActionNote, getPlayerDisplayName } from "../presentationLocale";

import { TUTORIAL_PRESET_PREPARATION_CARD_IDS } from "../tutorial/tutorialScript";

type PreparationPanelProps = {
  game: GameState;
  playerControllers?: PlayerControllerSelection;
  dispatchGameAction: (action: GameAction) => void;
  isTutorial?: boolean;
};

export function PreparationPanel({ game, playerControllers, dispatchGameAction, isTutorial }: PreparationPanelProps) {
  const { locale } = useLocale();
  const isEnglish = locale === "en";
  const pending = game.pendingLaboratoryPreparation;
  const [selectedIds, setSelectedIds] = useState<CardInstanceId[]>([]);
  const currentPlayer = game.players.find((player) => player.id === pending?.playerId);
  const isAi = Boolean(
    pending &&
      playerControllers &&
      playerControllers[pending.playerId === "player_1" ? 0 : 1] === "ai",
  );
  const validCandidateIds = pending?.candidateCardInstanceIds.filter((id) => {
    const i = game.cardInstances[id];
    return currentPlayer?.hand.includes(id) && i?.ownerId === currentPlayer.id && i.zone.type === "hand" && i.zone.playerId === currentPlayer.id;
  }) ?? [];
  const validCandidateIdSet = new Set(validCandidateIds);
  const validSelectedIds = selectedIds.filter((id) => validCandidateIdSet.has(id));

  useEffect(() => {
    if (isTutorial && pending) {
      const preset = TUTORIAL_PRESET_PREPARATION_CARD_IDS.filter((id) =>
        validCandidateIdSet.has(id),
      );
      if (preset.length === pending.keepCount) {
        setSelectedIds(preset);
        return;
      }
    }
    setSelectedIds([]);
  }, [game, pending?.playerId, isTutorial]);

  if (game.phase !== "preparationSelection" || !pending) return null;

  const toggleCard = (id: CardInstanceId) => {
    if (isTutorial) return;
    setSelectedIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  };

  return (
    <section className="debug-section preparation-panel" aria-labelledby="preparation-title">
      <div className="panel-heading">
        <div>
          <p className="debug-kicker">{isEnglish ? "Keep the required cards" : "请保留指定数量的手牌"}</p>
          <h2 id="preparation-title">{isEnglish ? "Laboratory Teacher · Preparation" : "实验室老师 · 备课"}</h2>
        </div>
        <strong className="selection-count">
          {isEnglish ? "Selected" : "已选"} {validSelectedIds.length} / {pending.keepCount}
        </strong>
      </div>
      <p className="panel-note">
        {isEnglish ? "Current selector" : "当前选择玩家"}：{getPlayerDisplayName(currentPlayer, locale)}
        {isAi ? ` · ${getAiAutoActionNote(locale)}` : ""}
      </p>
      <details className="debug-details"><summary>{isEnglish ? "Debug details" : "调试详情"}</summary><p>LABORATORY_PREPARATION</p></details>
      <div className="preparation-candidate-grid">
        {isAi ? (
          <p className="empty-note">{getAiAutoActionNote(locale)}</p>
        ) : validCandidateIds.map((cardInstanceId) => (
          <CardDebugCard
            cardInstanceId={cardInstanceId}
            disabled={isTutorial}
            game={game}
            key={cardInstanceId}
            onSelect={toggleCard}
            selected={validSelectedIds.includes(cardInstanceId)}
          />
        ))}
      </div>
      <button
        className={`primary-button${isTutorial && validSelectedIds.length === pending.keepCount ? " coach-highlight" : ""}`}
        disabled={isAi || validSelectedIds.length !== pending.keepCount}
        onClick={() => {
          dispatchGameAction({
            type: "CONFIRM_LABORATORY_PREPARATION",
            playerId: pending.playerId,
            keptCardInstanceIds: validSelectedIds,
          });
          setSelectedIds([]);
        }}
        type="button"
      >
        {isEnglish ? "Confirm preparation selection" : "确认备课选择"}
      </button>
    </section>
  );
}
