import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "../../../app/locale";
import type { GameAction } from "../../../game/engine/actions";
import { analyzeDIYSelection } from "../../../game/engine/diy";
import type {
  CardInstanceId,
  DIYSelectionAnalysis,
  Player,
  PlayerId,
} from "../../../game/engine/types";
import type {
  LocalGameSessionCommand,
  PlayingLocalGameSession,
} from "../localGameSession";
import {
  getActivePlayer,
  getExperimentCounterattackMetalCards,
  getExperimentCounterattackPursuitCards,
  getOpponentTargets,
  getPlayerStatusById,
  getResponseCards,
  getStatusHandlingCards,
} from "../localGameView";
import {
  getOfficialHumanViewerPlayerId,
  getOfficialPlayState,
} from "../officialPlayView";
import { DeskActionBar } from "./DeskActionBar";
import { GameLogDrawer } from "./GameLogDrawer";
import { GameSummary } from "./GameSummary";
import { PlayerPanel } from "./PlayerPanel";
import { SuccessfulReactionNotice } from "./SuccessfulReactionNotice";
import { TableReferenceBoard } from "./TableReferenceBoard";
import type { SessionConfirmationKind } from "./ConfirmationDialog";

export type DeskTableProps = Readonly<{
  session: PlayingLocalGameSession;
  dispatch: (command: LocalGameSessionCommand) => void;
  onRequestSessionExit: (
    kind: SessionConfirmationKind,
    trigger: HTMLButtonElement,
  ) => void;
}>;

export function DeskTable({
  session,
  dispatch,
  onRequestSessionExit,
}: DeskTableProps) {
  const { game, error, playerControllers } = session;
  const { locale } = useLocale();
  const isEnglish = locale === "en";
  const playGame = getOfficialPlayState(game, playerControllers);
  const viewerPlayerId = getOfficialHumanViewerPlayerId(playerControllers);

  const [selectedCardId, setSelectedCardId] = useState<CardInstanceId | undefined>();
  const [selectedCardIds, setSelectedCardIds] = useState<CardInstanceId[]>([]);
  const [isDiyMode, setIsDiyMode] = useState<boolean>(false);
  const [isLogOpen, setIsLogOpen] = useState<boolean>(false);

  // Reset selection on revision or phase changes
  useEffect(() => {
    setSelectedCardId(undefined);
    setSelectedCardIds([]);
    setIsDiyMode(false);
  }, [session.revision, playGame.phase]);

  const activePlayer = getActivePlayer(playGame);
  const targets = activePlayer ? getOpponentTargets(playGame, activePlayer.id) : [];

  const handleSelectCard = useCallback((cardId: CardInstanceId) => {
    // 1. Preparation selection (multi-select up to keepCount)
    if (playGame.phase === "preparationSelection") {
      const pending = playGame.pendingLaboratoryPreparation;
      const keepCount = pending?.keepCount ?? 10;
      setSelectedCardIds((current) => {
        if (current.includes(cardId)) {
          return current.filter((id) => id !== cardId);
        }
        if (current.length >= keepCount) {
          return current;
        }
        return [...current, cardId];
      });
      return;
    }

    // 2. Active DIY mode in main action (multi-select components)
    if (isDiyMode && playGame.phase === "mainAction") {
      setSelectedCardIds((current) =>
        current.includes(cardId)
          ? current.filter((id) => id !== cardId)
          : [...current, cardId],
      );
      return;
    }

    // 3. Normal single-card toggle
    setSelectedCardId((current) => (current === cardId ? undefined : cardId));
  }, [isDiyMode, playGame.pendingLaboratoryPreparation, playGame.phase]);

  const dispatchGameAction = useCallback((action: GameAction) => {
    dispatch({ type: "DISPATCH_GAME_ACTION", action });
    setSelectedCardId(undefined);
    setSelectedCardIds([]);
    setIsDiyMode(false);
  }, [dispatch]);

  // DIY selection analysis for DeskActionBar
  const diyAnalysis: DIYSelectionAnalysis | null = useMemo(() => {
    if (!isDiyMode || playGame.phase !== "mainAction" || !activePlayer || selectedCardIds.length === 0) {
      return null;
    }
    const initial = analyzeDIYSelection(playGame, activePlayer.id, selectedCardIds, undefined);
    if (initial.status === "MATCHED_NOT_EXECUTABLE" && initial.blockerCode === "TARGET_PLAYER_REQUIRED") {
      const defaultTarget: PlayerId | undefined = targets[0]?.id;
      return analyzeDIYSelection(playGame, activePlayer.id, selectedCardIds, defaultTarget);
    }
    return initial;
  }, [activePlayer, isDiyMode, playGame, selectedCardIds, targets]);

  const opponent = playGame.players[1];
  const ownPlayer = playGame.players[0];

  const currentActingPlayerId =
    playGame.phase === "preparationSelection"
      ? playGame.pendingLaboratoryPreparation?.playerId
      : playGame.phase === "responseWindow"
        ? playGame.pendingResponse?.responderId
        : playGame.phase === "experimentCounterattackWindow"
          ? playGame.pendingExperimentCounterattack?.responderPlayerId
          : playGame.phase === "statusWindow"
            ? playGame.pendingStatusHandling?.playerId
            : playGame.activePlayerId;

  const isPlayer1Active = currentActingPlayerId === ownPlayer.id;
  const isPlayer2Active = currentActingPlayerId === opponent.id;

  const isPlayer1Ai = playerControllers[0] === "ai";
  const isPlayer2Ai = playerControllers[1] === "ai";

  const getSelectableCardIds = useCallback(
    (targetPlayer: Player): readonly CardInstanceId[] | undefined => {
      if (playGame.phase === "responseWindow") {
        if (playGame.pendingResponse?.responderId === targetPlayer.id) {
          return getResponseCards(playGame, targetPlayer);
        }
        return [];
      }
      if (playGame.phase === "experimentCounterattackWindow") {
        if (playGame.pendingExperimentCounterattack?.responderPlayerId === targetPlayer.id) {
          return [
            ...getExperimentCounterattackPursuitCards(playGame, targetPlayer),
            ...getExperimentCounterattackMetalCards(playGame, targetPlayer),
          ];
        }
        return [];
      }
      if (playGame.phase === "statusWindow" && playGame.pendingStatusHandling) {
        if (playGame.pendingStatusHandling.playerId === targetPlayer.id) {
          const st = getPlayerStatusById(targetPlayer, playGame.pendingStatusHandling.statusInstanceId);
          return getStatusHandlingCards(playGame, targetPlayer, st);
        }
        return [];
      }
      return undefined;
    },
    [playGame],
  );

  return (
    <main className="local-game-page desk-table-page" data-testid="desk-table">
      <div className="desk-table__top-bar">
        <GameSummary
          error={error ?? undefined}
          game={playGame}
          isDebug={false}
          onRestart={(trigger) => onRequestSessionExit("restart", trigger)}
          onReturnToCharacterSelection={(trigger) => onRequestSessionExit("return", trigger)}
          playerControllers={playerControllers}
        />
        <button
          aria-expanded={isLogOpen}
          className="secondary-button desk-table__log-toggle"
          data-testid="desk-log-drawer-button"
          onClick={() => setIsLogOpen(true)}
          type="button"
        >
          {isEnglish ? `Game Log (${playGame.log.length})` : `对局日志 (${playGame.log.length})`}
        </button>
      </div>

      <SuccessfulReactionNotice game={playGame} />

      <div className="desk-table__surface">
        {/* Top: Opponent Zone */}
        <div className="desk-table__opponent-zone">
          <PlayerPanel
            controller={playerControllers[1]}
            game={playGame}
            handReveal={viewerPlayerId !== undefined && opponent.id !== viewerPlayerId ? "backs" : "contents"}
            handSelectionDisabled={isPlayer2Ai || !isPlayer2Active}
            isDebug={false}
            onSelectCard={handleSelectCard}
            player={opponent}
            selectableCardIds={getSelectableCardIds(opponent)}
            selectedCardId={isPlayer2Active ? selectedCardId : undefined}
            selectedCardIds={isPlayer2Active ? selectedCardIds : undefined}
            showActivePlayerIndicator={playGame.phase !== "preparationSelection"}
          />
        </div>

        {/* Center: Public Field and Table Reference */}
        <div className="desk-table__center-zone">
          <TableReferenceBoard game={playGame} />
        </div>

        {/* Bottom: Own Player Zone */}
        <div className="desk-table__own-zone">
          <PlayerPanel
            controller={playerControllers[0]}
            game={playGame}
            handReveal="contents"
            handSelectionDisabled={isPlayer1Ai || !isPlayer1Active}
            isDebug={false}
            onSelectCard={handleSelectCard}
            player={ownPlayer}
            selectableCardIds={getSelectableCardIds(ownPlayer)}
            selectedCardId={isPlayer1Active ? selectedCardId : undefined}
            selectedCardIds={isPlayer1Active ? selectedCardIds : undefined}
            showActivePlayerIndicator={playGame.phase !== "preparationSelection"}
          />
        </div>
      </div>

      {/* Desk Action Bar: 1-3 primary action buttons */}
      <DeskActionBar
        diyAnalysis={diyAnalysis}
        dispatchGameAction={dispatchGameAction}
        game={playGame}
        isDiyMode={isDiyMode}
        onCancelDiy={() => {
          setIsDiyMode(false);
          setSelectedCardIds([]);
        }}
        onEnterDiy={() => {
          setIsDiyMode(true);
          setSelectedCardId(undefined);
          setSelectedCardIds([]);
        }}
        onRestart={(trigger) => onRequestSessionExit("restart", trigger)}
        onReturnToCharacterSelection={(trigger) => onRequestSessionExit("return", trigger)}
        playerControllers={playerControllers}
        selectedCardId={selectedCardId}
        selectedCardIds={selectedCardIds}
      />

      {/* Game Log Drawer */}
      <GameLogDrawer
        game={playGame}
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
      />
    </main>
  );
}
