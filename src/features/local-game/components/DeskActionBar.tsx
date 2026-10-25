import {
  Children,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { useLocale } from "../../../app/locale";
import type { ActivateCharacterSkillAction, GameAction } from "../../../game/engine/actions";
import { getLegalCharacterSkillActions } from "../../../game/engine/characterSkills";
import {
  validatePassAction,
  validatePlayMainActionCard,
  validatePlayReferenceCard,
} from "../../../game/engine/resolution";
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
import type { TutorialStepKey } from "../tutorial/tutorialScript";

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
  tutorialStepKey?: TutorialStepKey;
}>;

const MAX_DESK_ACTION_BUTTONS = 3;

type DeskButtonKind = "play" | "skill" | "end" | "diy";

type MainActionItem = Readonly<{
  key: string;
  kind: DeskButtonKind;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  highlighted?: boolean;
  skillAction?: ActivateCharacterSkillAction;
}>;

function DeskActionButtons({ children }: { children: ReactNode }) {
  return (
    <div className="desk-action-bar__buttons">
      {Children.toArray(children).slice(0, MAX_DESK_ACTION_BUTTONS)}
    </div>
  );
}

function MainActionButton({ item, inMenu = false }: { item: MainActionItem; inMenu?: boolean }) {
  const variant = item.kind === "skill" ? "skill" : item.kind === "play" ? "primary" : "secondary";
  return (
    <button
      className={`${inMenu ? "desk-action-menu__item" : `desk-action-btn desk-action-btn--${variant}`}${item.highlighted ? " coach-highlight" : ""}`}
      data-skill-id={item.skillAction?.skillId}
      data-skill-card-id={item.skillAction && "cardInstanceId" in item.skillAction ? item.skillAction.cardInstanceId : undefined}
      disabled={item.disabled}
      onClick={item.onSelect}
      role={inMenu ? "menuitem" : undefined}
      type="button"
    >
      {item.label}
    </button>
  );
}

const MENU_ITEM_SELECTOR = '[role="menuitem"]:not(:disabled)';
const MENU_ITEM_ANY_SELECTOR = '[role="menuitem"]';

type ActivationKey = "Enter" | " ";

function normalizeActivationKey(key: string): ActivationKey | null {
  if (key === "Enter") return "Enter";
  if (key === " " || key === "Spacebar") return " ";
  return null;
}

function isMenuNavigationKey(key: string): boolean {
  return key === "ArrowDown" || key === "ArrowUp" || key === "Home" || key === "End";
}

export function DeskActionOverflowMenu({ items, isEnglish }: { items: readonly MainActionItem[]; isEnglish: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pendingFocusRef = useRef<"first" | "last" | null>(null);
  const pointerActivationRef = useRef(false);
  const heldActivationKeyRef = useRef<ActivationKey | null>(null);
  const focusInsideRef = useRef(false);
  const menuLabel = isEnglish ? "More actions" : "更多操作";

  const getMenuItems = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>(MENU_ITEM_SELECTOR) ?? []);

  const focusMenuEdge = (edge: "first" | "last") => {
    const targets = getMenuItems();
    const target = edge === "first" ? targets[0] : targets[targets.length - 1];
    (target ?? menuRef.current)?.focus();
  };

  const focusMenuFallback = () => {
    const menu = menuRef.current;
    if (!menu) return;
    const targets = getMenuItems();
    if (targets.length > 0) {
      targets[0]?.focus();
      return;
    }
    if (menu.querySelectorAll(MENU_ITEM_ANY_SELECTOR).length > 0) {
      menu.focus();
      return;
    }
    setIsOpen(false);
    const trigger = triggerRef.current;
    if (trigger?.isConnected && !trigger.disabled) trigger.focus();
  };

  const openMenu = (focusIntent: "first" | "last" | null) => {
    pendingFocusRef.current = focusIntent;
    setIsOpen(true);
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      pendingFocusRef.current = null;
      return;
    }
    const focusIntent = pendingFocusRef.current;
    if (focusIntent) {
      pendingFocusRef.current = null;
      focusMenuEdge(focusIntent);
      return;
    }
    const menu = menuRef.current;
    if (!menu) return;
    const active = document.activeElement;
    const focusWasLost = active === document.body || active === document.documentElement;
    const activeIsDisabledItem =
      active instanceof HTMLButtonElement && active.disabled && menu.contains(active);
    if ((!focusWasLost && !activeIsDisabledItem) || !focusInsideRef.current) return;
    // Props updates can remove or disable the focused menu item. Chromium then drops focus to
    // <body>; restore it to the menu instead of stranding keyboard users outside the menu.
    focusMenuFallback();
  }, [isOpen, items]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== "Escape") return;
      setIsOpen(false);
      const trigger = triggerRef.current;
      if (trigger?.isConnected && !trigger.disabled) trigger.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const releaseHeldActivation = () => {
      heldActivationKeyRef.current = null;
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (normalizeActivationKey(event.key) === heldActivationKeyRef.current) {
        releaseHeldActivation();
      }
    };
    document.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", releaseHeldActivation);
    return () => {
      document.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", releaseHeldActivation);
    };
  }, []);

  const handleTriggerClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const wasPointerActivation = pointerActivationRef.current;
    pointerActivationRef.current = false;
    if (event.detail === 0 && heldActivationKeyRef.current !== null) {
      // A click synthesized by the key that is still held opened this menu; the keydown
      // handler owns the toggle and the hold must not close or re-activate it.
      return;
    }
    const activatedByKeyboard = event.detail === 0 && !wasPointerActivation;
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    openMenu(activatedByKeyboard ? "first" : null);
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const activationKey = normalizeActivationKey(event.key);
    if (activationKey) {
      // Prevent the native activation so keyboard activation cannot toggle twice. The key
      // stays marked until its keyup (or a window blur), which covers auto-repeat and Space's
      // keyup activation on whichever menu item receives focus next.
      event.preventDefault();
      if (event.repeat || heldActivationKeyRef.current !== null) return;
      heldActivationKeyRef.current = activationKey;
      if (isOpen) {
        setIsOpen(false);
        return;
      }
      openMenu("first");
      return;
    }
    if (isOpen && (event.key === "Home" || event.key === "End")) {
      // A pointer-opened menu keeps focus on the trigger; Home/End still belong to the menu
      // and must not scroll the page while it is open.
      event.preventDefault();
      focusMenuEdge(event.key === "Home" ? "first" : "last");
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const focusIntent = event.key === "ArrowDown" ? "first" : "last";
    if (isOpen) {
      focusMenuEdge(focusIntent);
      return;
    }
    openMenu(focusIntent);
  };

  const handleRootFocus = () => {
    focusInsideRef.current = true;
  };

  const handleRootBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
    if (!isOpen) return;
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && rootRef.current?.contains(nextTarget)) return;
    const lostTarget = event.target as HTMLElement;
    const lostBecauseUnavailable =
      !lostTarget.isConnected ||
      (lostTarget instanceof HTMLButtonElement && lostTarget.disabled);
    if (lostBecauseUnavailable && focusInsideRef.current) {
      // The focused item was removed or disabled by a props update. The layout effect
      // repairs focus after the commit; do not silently close and leave focus on <body>.
      return;
    }
    focusInsideRef.current = false;
    setIsOpen(false);
  };

  const handleRootKeyUp = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const activationKey = normalizeActivationKey(event.key);
    if (activationKey === null || heldActivationKeyRef.current !== activationKey) return;
    // Space activates a focused button on keyup. The key that opened the menu must not
    // activate whichever menu item received focus, even if the keydown was consumed earlier.
    event.preventDefault();
    heldActivationKeyRef.current = null;
  };

  const handleMenuClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.detail === 0 && heldActivationKeyRef.current !== null) {
      // Defensive guard for keyboard-synthesized clicks (e.g. an Enter repeat) that raced
      // past the keydown guard; pointer activations use detail > 0 and stay untouched.
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const activationKey = normalizeActivationKey(event.key);
    if (activationKey) {
      if (event.repeat || heldActivationKeyRef.current !== null) {
        // The sustained key that opened the menu must never activate a menu item.
        event.preventDefault();
      }
      return;
    }
    if (!isMenuNavigationKey(event.key)) return;
    // The menu owns these navigation keys even when every item is disabled and none can take
    // focus; without this the browser would scroll the page behind the menu.
    event.preventDefault();
    const targets = getMenuItems();
    if (targets.length === 0) return;
    const current = targets.indexOf(document.activeElement as HTMLButtonElement);
    let next: number;
    if (event.key === "ArrowDown") next = current < 0 ? 0 : (current + 1) % targets.length;
    else if (event.key === "ArrowUp") next = current < 0 ? targets.length - 1 : (current - 1 + targets.length) % targets.length;
    else if (event.key === "Home") next = 0;
    else next = targets.length - 1;
    targets[next]?.focus();
  };

  return (
    <div
      className="desk-action-overflow"
      onBlur={handleRootBlur}
      onFocus={handleRootFocus}
      onKeyUp={handleRootKeyUp}
      ref={rootRef}
    >
      <button
        aria-controls="desk-action-overflow-menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="desk-action-menu__trigger"
        data-testid="desk-action-menu-trigger"
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        onPointerDown={() => {
          pointerActivationRef.current = true;
        }}
        ref={triggerRef}
        type="button"
      >
        {menuLabel}
      </button>
      {isOpen ? (
        <div
          aria-label={menuLabel}
          className="desk-action-menu"
          id="desk-action-overflow-menu"
          onClickCapture={handleMenuClickCapture}
          onKeyDown={handleMenuKeyDown}
          ref={menuRef}
          role="menu"
          tabIndex={-1}
        >
          {items.map((item) => (
            <MainActionButton
              inMenu
              item={{ ...item, onSelect: () => {
                setIsOpen(false);
                const trigger = triggerRef.current;
                if (trigger?.isConnected && !trigger.disabled) trigger.focus();
                item.onSelect();
              } }}
              key={item.key}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function makeSkillActionLabel(
  action: ActivateCharacterSkillAction,
  game: GameState,
  locale: "zh-CN" | "en",
  variants: readonly ActivateCharacterSkillAction[],
): string {
  const name = `${locale === "en" ? "Activate " : "发动"}${getSkillDisplayName(action.skillId, locale)}`;
  if (variants.length < 2) return name;

  if ("cardInstanceId" in action) {
    const displayName = getOptionalCardDisplayName(getCardDefinition(game, action.cardInstanceId), locale);
    const sameDefinition = variants.filter((variant) =>
      "cardInstanceId" in variant &&
      game.cardInstances[variant.cardInstanceId]?.definitionId === game.cardInstances[action.cardInstanceId]?.definitionId,
    );
    const handIndex = game.players.find((player) => player.id === action.playerId)?.hand.indexOf(action.cardInstanceId);
    const copy = sameDefinition.length > 1 && handIndex !== undefined && handIndex >= 0
      ? (locale === "en" ? ` (${handIndex + 1})` : `（第${handIndex + 1}张）`)
      : "";
    return `${name} · ${displayName}${copy}`;
  }

  if ("targetPlayerId" in action) {
    return `${name} · ${getPlayerDisplayName(getPlayer(game, action.targetPlayerId), locale)}`;
  }

  return name;
}

function skillActionKey(action: ActivateCharacterSkillAction): string {
  return `${action.skillId}-${"cardInstanceId" in action ? action.cardInstanceId : "targetPlayerId" in action ? action.targetPlayerId : "solo"}`;
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
  tutorialStepKey,
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
            className={`desk-action-btn desk-action-btn--primary${tutorialStepKey === "PREPARATION" ? " coach-highlight" : ""}`}
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
            className={`desk-action-btn desk-action-btn--primary${tutorialStepKey === "RESPOND_WITH_CARD" && canRespond ? " coach-highlight" : ""}`}
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
  const canAct = Boolean(
    !isAi && activePlayer && validatePassAction(game, activePlayer.id),
  );
  const legalSkillActions =
    !isAi && activePlayer ? getLegalCharacterSkillActions(game, activePlayer.id) : [];

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
    canAct &&
      activePlayer &&
      !activePlayer.usedDIYThisCycle &&
      activePlayer.hand.some((id) =>
        getCardDefinition(game, id)?.allowedTimings.includes("diy-component"),
      ),
  );

  const selectedCardDef = selectedCardId && activePlayer
    ? getCardDefinition(game, selectedCardId)
    : undefined;
  const isOxygen = selectedCardDef?.id === "substance_o2";
  const targetPlayerId = isOxygen ? activePlayer?.id : targets[0]?.id;
  const canExecute = Boolean(
    !isAi &&
      activePlayer &&
      selectedCardId &&
      canExecuteMainActionEffect(game, activePlayer, selectedCardId) &&
      validatePlayMainActionCard(game, activePlayer.id, selectedCardId, targetPlayerId),
  );
  const canAssociate = Boolean(
    !isAi &&
      activePlayer &&
      selectedCardId &&
      canPlayAgainstCurrentTableReference(game, activePlayer, selectedCardId) &&
      validatePlayReferenceCard(game, activePlayer.id, selectedCardId),
  );

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

  const playItems: MainActionItem[] = [];
  if (!isAi && activePlayer && selectedCardId) {
    const effectItem: MainActionItem = {
      key: "play-effect",
      kind: "play",
      label: isEnglish ? "Run Effect" : "执行效果",
      onSelect: () => dispatchGameAction({
        type: "PLAY_CARD",
        playerId: activePlayer.id,
        cardInstanceId: selectedCardId,
        targetPlayerId,
      }),
    };
    const referenceItem: MainActionItem = {
      key: "play-reference",
      kind: "play",
      label: isEnglish ? "Play" : "普通出牌",
      highlighted: tutorialStepKey === "PLAY_REFERENCE_CARD",
      onSelect: () => dispatchGameAction({
        type: "PLAY_REFERENCE_CARD",
        playerId: activePlayer.id,
        cardInstanceId: selectedCardId,
      }),
    };

    if (canExecute && canAssociate) {
      playItems.push(...(tutorialStepKey === "PLAY_REFERENCE_CARD"
        ? [referenceItem, effectItem]
        : [effectItem, referenceItem]));
    } else if (canExecute) {
      playItems.push(effectItem);
    } else if (canAssociate) {
      playItems.push(referenceItem);
    }
  } else if (isAi && activePlayer && selectedCardId) {
    playItems.push({
      key: "play-blocked",
      kind: "play",
      label: isEnglish ? "Cannot Play" : "不可出牌",
      disabled: true,
      onSelect: () => undefined,
    });
  }

  if (!isAi && activePlayer && selectedCardId && !canExecute && !canAssociate) {
    playItems.push({
      key: "play-blocked",
      kind: "play",
      label: isEnglish ? "Cannot Play" : "不可出牌",
      disabled: true,
      onSelect: () => undefined,
    });
  }

  const skillGroups = new Map<string, ActivateCharacterSkillAction[]>();
  for (const action of legalSkillActions) {
    skillGroups.set(action.skillId, [...(skillGroups.get(action.skillId) ?? []), action]);
  }
  const skillItems: MainActionItem[] = legalSkillActions.map((action) => ({
    key: `skill-${skillActionKey(action)}`,
    kind: "skill",
    label: makeSkillActionLabel(action, game, locale, skillGroups.get(action.skillId) ?? [action]),
    skillAction: action,
    onSelect: () => dispatchGameAction(action),
  }));
  const firstSkillById = [...skillGroups.values()].map((actions) => {
    const selected = selectedCardId
      ? actions.find((action) => "cardInstanceId" in action && action.cardInstanceId === selectedCardId)
      : undefined;
    return skillItems.find((item) => item.skillAction === (selected ?? actions[0]))!;
  });
  const firstSkillKeys = new Set(firstSkillById.map((item) => item.key));
  const additionalSkillItems = skillItems.filter((item) => !firstSkillKeys.has(item.key));

  const passItem: MainActionItem | undefined = canAct && activePlayer
    ? {
        key: "end-action",
        kind: "end",
        label: isEnglish ? "End Action" : "结束本次行动",
        onSelect: () => dispatchGameAction({ type: "PASS_ACTION", playerId: activePlayer.id }),
      }
    : undefined;
  const diyItem: MainActionItem | undefined = canAct && activePlayer && canDiy
    ? {
        key: "enter-diy",
        kind: "diy",
        label: isEnglish ? "Active DIY" : "进入主动 DIY",
        onSelect: () => onEnterDiy?.(),
      }
    : undefined;

  const actionItems = tutorialStepKey === "PLAY_REFERENCE_CARD"
    ? [
        ...playItems,
        ...firstSkillById,
        ...(passItem ? [passItem] : []),
        ...(diyItem ? [diyItem] : []),
        ...additionalSkillItems,
      ]
    : [
        ...playItems.slice(0, 1),
        ...firstSkillById,
        ...(passItem ? [passItem] : []),
        ...(diyItem ? [diyItem] : []),
        ...playItems.slice(1),
        ...additionalSkillItems,
      ];
  const primaryItems = actionItems.slice(0, MAX_DESK_ACTION_BUTTONS);
  const overflowItems = actionItems.slice(MAX_DESK_ACTION_BUTTONS);

  return (
    <nav aria-label={isEnglish ? "Main action bar" : "主行动操作条"} className="desk-action-bar">
      <div className="desk-action-bar__info">
        <span className="desk-action-bar__phase-tag">
          {isEnglish ? "Main Action" : "主行动"}
        </span>
        <span className="desk-action-bar__hint">{hintText}</span>
      </div>
      <div className="desk-action-bar__buttons">
        {primaryItems.map((item) => <MainActionButton item={item} key={item.key} />)}
        {overflowItems.length > 0 ? <DeskActionOverflowMenu items={overflowItems} isEnglish={isEnglish} /> : null}
      </div>
    </nav>
  );
}
