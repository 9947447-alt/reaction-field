import "./local-game.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { FeedbackLink } from "../../app/feedback";
import { LocaleSwitch, useLocale } from "../../app/locale";
import { ProjectRepositoryLink } from "../../app/projectRepository";
import { releaseMetadata } from "../../app/releaseMetadata";
import type { GameAction } from "../../game/engine/actions";
import type { CardInstanceId } from "../../game/engine/types";
import type { NATBAPolicy } from "../../game/natba/types";
import type { RandomSource } from "../../shared/random";
import { ActionPanel } from "./components/ActionPanel";
import { AboutDialog } from "./components/AboutDialog";
import { CharacterSelectionPanel } from "./components/CharacterSelectionPanel";
import { ConfirmationDialog, type SessionConfirmationKind } from "./components/ConfirmationDialog";
import { DeskTable } from "./components/DeskTable";
import { DiyPanel } from "./components/DiyPanel";
import { ExperimentCounterattackPanel } from "./components/ExperimentCounterattackPanel";
import { FatalSessionPage } from "./components/FatalSessionPage";
import { GameLog } from "./components/GameLog";
import { GameSummary } from "./components/GameSummary";
import { NewPlayerGuidance } from "./components/NewPlayerGuidance";
import { PlayerPanel } from "./components/PlayerPanel";
import { PreparationPanel } from "./components/PreparationPanel";
import { ResponsePanel } from "./components/ResponsePanel";
import { StatusPanel } from "./components/StatusPanel";
import { SuccessfulReactionNotice } from "./components/SuccessfulReactionNotice";
import { TableReferenceBoard } from "./components/TableReferenceBoard";
import { useLocalGameDebug } from "./hooks/useLocalGameDebug";
import {
  createConfiguringLocalGameSession,
  type LocalGameEngineReducer,
  type LocalGameFactory,
  type LocalGameSessionCommand,
  type LocalGameSessionInitializer,
  type LocalGameSessionState,
  type PlayingLocalGameSession,
} from "./localGameSession";
import {
  getOfficialHumanViewerPlayerId,
  getOfficialPlayState,
} from "./officialPlayView";
import { requiresSessionExitConfirmation } from "./sessionConfirmation";
import { createInitialGame } from "../../game/engine/createInitialGame";
import {
  TUTORIAL_SEED,
  deriveTutorialStep,
  isAllowedTutorialGameAction,
} from "./tutorial/tutorialScript";

type PlayingGameProps = Readonly<{
  session: PlayingLocalGameSession;
  dispatch: (command: LocalGameSessionCommand) => void;
  guidanceVisible: boolean;
  guidanceCollapsed: boolean;
  onGuidanceVisibleChange: (visible: boolean) => void;
  onGuidanceCollapsedChange: (collapsed: boolean) => void;
  onRequestSessionExit: (
    kind: SessionConfirmationKind,
    trigger: HTMLButtonElement,
  ) => void;
  isDebug?: boolean;
  isTutorial?: boolean;
}>;

function PlayingGame({
  session,
  dispatch,
  guidanceVisible,
  guidanceCollapsed,
  onGuidanceVisibleChange,
  onGuidanceCollapsedChange,
  onRequestSessionExit,
  isDebug = true,
  isTutorial = false,
}: PlayingGameProps) {
  const { game, error, playerControllers } = session;
  const { locale } = useLocale();
  const isEnglish = locale === "en";
  const playGame = getOfficialPlayState(game, playerControllers);
  const viewerPlayerId = getOfficialHumanViewerPlayerId(playerControllers);
  const [selectedCardId, setSelectedCardId] = useState<CardInstanceId | undefined>();

  useEffect(() => {
    setSelectedCardId(undefined);
  }, [session.revision]);

  const handleSelectCard = useCallback((cardId: CardInstanceId | undefined) => {
    setSelectedCardId((current) => (current === cardId ? undefined : cardId));
  }, []);

  function dispatchGameAction(action: GameAction) {
    if (isTutorial) {
      const stepKey = deriveTutorialStep(playGame, selectedCardId);
      if (!isAllowedTutorialGameAction(action, stepKey)) {
        return;
      }
    }
    dispatch({ type: "DISPATCH_GAME_ACTION", action });
    setSelectedCardId(undefined);
  }

  return (
    <main className="local-game-page">
      <GameSummary
        error={error ?? undefined}
        game={playGame}
        isDebug={isDebug}
        playerControllers={playerControllers}
        onRestart={(trigger) => onRequestSessionExit("restart", trigger)}
        onReturnToCharacterSelection={(trigger) => onRequestSessionExit("return", trigger)}
      />
      <SuccessfulReactionNotice game={playGame} />
      <div className="debug-layout play-shell-layout">
        <div className="debug-main play-surface">
          <div className="players-grid">
            {playGame.players.map((player, index) => (
              <PlayerPanel
                controller={playerControllers[index as 0 | 1]}
                game={playGame}
                handReveal={viewerPlayerId !== undefined && player.id !== viewerPlayerId ? "backs" : "contents"}
                handSelectionDisabled={playGame.phase !== "mainAction"}
                isDebug={isDebug}
                key={player.id}
                onSelectCard={handleSelectCard}
                player={player}
                selectedCardId={selectedCardId}
                showActivePlayerIndicator={playGame.phase !== "preparationSelection"}
              />
            ))}
          </div>
          <TableReferenceBoard game={playGame} />
          <GameLog game={playGame} isDebug={isDebug} />
        </div>
        <aside className="debug-sidebar play-sidebar" aria-label={isEnglish ? "Action panels" : "操作面板"}>
          <NewPlayerGuidance
            collapsed={guidanceCollapsed}
            game={playGame}
            mode="playing"
            onCollapsedChange={onGuidanceCollapsedChange}
            onVisibleChange={onGuidanceVisibleChange}
            visible={guidanceVisible}
          />
          {playGame.phase === "preparationSelection" ? (
            <PreparationPanel
              dispatchGameAction={dispatchGameAction}
              game={playGame}
              playerControllers={playerControllers}
            />
          ) : playGame.phase === "experimentCounterattackWindow" ? (
            <ExperimentCounterattackPanel
              dispatchGameAction={dispatchGameAction}
              game={playGame}
              playerControllers={playerControllers}
            />
          ) : (
            <>
              <ActionPanel
                dispatchGameAction={dispatchGameAction}
                game={playGame}
                onSelectCard={handleSelectCard}
                playerControllers={playerControllers}
                selectedCardId={selectedCardId}
              />
              <DiyPanel
                dispatchGameAction={dispatchGameAction}
                game={playGame}
                playerControllers={playerControllers}
              />
              <ResponsePanel
                dispatchGameAction={dispatchGameAction}
                game={playGame}
                playerControllers={playerControllers}
              />
              <StatusPanel
                dispatchGameAction={dispatchGameAction}
                game={playGame}
                playerControllers={playerControllers}
              />
            </>
          )}
          {playGame.phase === "gameOver" ? (
            <section className="debug-section">
              <h2>{isEnglish ? "Game over" : "对局结束"}</h2>
              <p className="panel-note">
                {isEnglish ? "Use the header to restart or return to character selection." : "可查看日志，或用顶部重开/返回角色选择。"}
              </p>
              <ProjectRepositoryLink />
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

type PendingSessionConfirmation = Readonly<{
  kind: SessionConfirmationKind;
  trigger: HTMLButtonElement;
}>;

export type LocalGamePageProps = Readonly<{
  createGame?: LocalGameFactory;
  reduceGame?: LocalGameEngineReducer;
  createSession?: LocalGameSessionInitializer;
  policy?: NATBAPolicy;
  aiDelayMs?: number;
  random?: RandomSource;
  isDebug?: boolean;
  initialTutorial?: boolean;
}>;

export function LocalGamePage({
  createGame,
  reduceGame,
  createSession,
  policy,
  aiDelayMs,
  random,
  isDebug = true,
  initialTutorial,
}: LocalGamePageProps = {}) {
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  const isTutorialInitial =
    initialTutorial ??
    (typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("tutorial") === "1");
  const isTutorialRef = useRef(isTutorialInitial);
  const [isTutorial, setIsTutorial] = useState(isTutorialInitial);

  const tutorialGameFactory = useCallback<LocalGameFactory>(
    (characterIds) => {
      const mutableCharacterIds: [typeof characterIds[0], typeof characterIds[1]] = [
        characterIds[0],
        characterIds[1],
      ];
      if (isTutorialRef.current) {
        return createInitialGame({
          characterIds: mutableCharacterIds,
          seed: TUTORIAL_SEED,
        });
      }
      return createGame
        ? createGame(characterIds)
        : createInitialGame({ characterIds: mutableCharacterIds });
    },
    [createGame],
  );

  const defaultSessionInitializer = useCallback((): LocalGameSessionState => {
    if (createSession) {
      return createSession();
    }
    if (isTutorialRef.current) {
      const game = createInitialGame({
        characterIds: ["laboratory_teacher", "chemical_factory_ceo"],
        seed: TUTORIAL_SEED,
      });
      return {
        mode: "playing",
        characterIds: ["laboratory_teacher", "chemical_factory_ceo"],
        playerControllers: ["human", "ai"],
        revision: 0,
        game,
        error: null,
      };
    }
    return createConfiguringLocalGameSession();
  }, [createSession]);

  const [session, dispatch] = useLocalGameDebug({
    createGame: tutorialGameFactory,
    reduceGame,
    createSession: defaultSessionInitializer,
    policy,
    aiDelayMs,
    random,
  });

  const handleSkipTutorial = useCallback(() => {
    isTutorialRef.current = false;
    setIsTutorial(false);
    if (typeof window !== "undefined" && window.location.search.includes("tutorial=1")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("tutorial");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
    }
    dispatch({ type: "RESTART_CURRENT_LINEUP" });
  }, [dispatch]);

  useEffect(() => {
    if (session.mode === "configuring") {
      isTutorialRef.current = false;
      setIsTutorial(false);
    }
  }, [session.mode]);

  const [aboutOpen, setAboutOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<PendingSessionConfirmation | null>(null);
  const [guidanceVisible, setGuidanceVisible] = useState(true);
  const [guidanceCollapsed, setGuidanceCollapsed] = useState(true);
  const aboutTriggerRef = useRef<HTMLButtonElement>(null);
  const confirmationExecutedRef = useRef(false);
  const playingPhase = session.mode === "playing" ? session.game.phase : session.mode;
  const modalOpen = aboutOpen || confirmation !== null;

  const restoreFocus = useCallback((target: HTMLElement | null) => {
    queueMicrotask(() => {
      if (target?.isConnected) target.focus();
    });
  }, []);

  const closeAbout = useCallback(() => {
    setAboutOpen(false);
    restoreFocus(aboutTriggerRef.current);
  }, [restoreFocus]);

  const openAbout = useCallback(() => {
    confirmationExecutedRef.current = false;
    setConfirmation(null);
    setAboutOpen(true);
  }, []);

  const requestSessionExit = useCallback((
    kind: SessionConfirmationKind,
    trigger: HTMLButtonElement,
  ) => {
    if (session.mode !== "playing") return;
    setAboutOpen(false);
    if (!requiresSessionExitConfirmation(session.game)) {
      dispatch({ type: kind === "restart" ? "RESTART_CURRENT_LINEUP" : "RETURN_TO_CHARACTER_SELECTION" });
      return;
    }
    confirmationExecutedRef.current = false;
    setConfirmation({ kind, trigger });
  }, [dispatch, session]);

  const cancelConfirmation = useCallback(() => {
    const trigger = confirmation?.trigger ?? null;
    confirmationExecutedRef.current = false;
    setConfirmation(null);
    restoreFocus(trigger);
  }, [confirmation, restoreFocus]);

  const confirmSessionExit = useCallback(() => {
    if (!confirmation || confirmationExecutedRef.current) return;
    confirmationExecutedRef.current = true;
    const { kind, trigger } = confirmation;
    setConfirmation(null);
    dispatch({ type: kind === "restart" ? "RESTART_CURRENT_LINEUP" : "RETURN_TO_CHARACTER_SELECTION" });
    restoreFocus(trigger);
  }, [confirmation, dispatch, restoreFocus]);

  useEffect(() => {
    confirmationExecutedRef.current = false;
    setConfirmation(null);
    setAboutOpen(false);
  }, [playingPhase, session.mode, session.revision]);

  return (
    <>
      <div
        aria-hidden={modalOpen ? "true" : undefined}
        className="application-shell"
        inert={modalOpen}
      >
        <header className="release-bar">
          <div>
            <strong>
              {releaseMetadata.displayName}
              {session.mode === "configuring" ? (
                <span className="secondary-brand">{releaseMetadata.secondaryName}</span>
              ) : null}
            </strong>
            <span>
              {releaseMetadata.channel} · v{releaseMetadata.version} · {releaseMetadata.rulesVersion}
            </span>
          </div>
          <div className="release-bar__actions">
            <LocaleSwitch />
            <FeedbackLink />
            <button
              className="secondary-button"
              onClick={openAbout}
              ref={aboutTriggerRef}
              type="button"
            >
              {isEnglish ? "About & help" : "关于与帮助"}
            </button>
          </div>
        </header>

        {session.mode === "configuring" ? (
          <CharacterSelectionPanel
            dispatch={dispatch}
            guidanceCollapsed={guidanceCollapsed}
            guidanceVisible={guidanceVisible}
            isDebug={isDebug}
            onGuidanceCollapsedChange={setGuidanceCollapsed}
            onGuidanceVisibleChange={setGuidanceVisible}
            session={session}
          />
        ) : session.mode === "playing" ? (
          isDebug ? (
            <PlayingGame
              dispatch={dispatch}
              guidanceCollapsed={guidanceCollapsed}
              guidanceVisible={guidanceVisible}
              isDebug={isDebug}
              isTutorial={isTutorial}
              onGuidanceCollapsedChange={setGuidanceCollapsed}
              onGuidanceVisibleChange={setGuidanceVisible}
              onRequestSessionExit={requestSessionExit}
              session={session}
            />
          ) : (
            <DeskTable
              dispatch={dispatch}
              isTutorial={isTutorial}
              onCompleteTutorial={handleSkipTutorial}
              onRequestSessionExit={requestSessionExit}
              onSkipTutorial={handleSkipTutorial}
              session={session}
            />
          )
        ) : (
          <FatalSessionPage dispatch={dispatch} session={session} />
        )}
      </div>

      {aboutOpen ? (
        <AboutDialog isDebug={isDebug} onClose={closeAbout} />
      ) : confirmation ? (
        <ConfirmationDialog
          kind={confirmation.kind}
          onCancel={cancelConfirmation}
          onConfirm={confirmSessionExit}
        />
      ) : null}
    </>
  );
}
