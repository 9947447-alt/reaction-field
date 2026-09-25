// @vitest-environment happy-dom

import { StrictMode, act, type MutableRefObject, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../app/locale";
import type { GameAction } from "../../game/engine/actions";
import { getAIObservation } from "../../game/engine/aiObservation";
import { createInitialGame } from "../../game/engine/createInitialGame";
import { getDecisionContext } from "../../game/engine/decisionContext";
import { getLegalActions } from "../../game/engine/legalActions";
import { engineReducer } from "../../game/engine/reducer";
import type { CardInstanceId, GameState } from "../../game/engine/types";
import { natba1xSelfPlayTunedPolicy } from "../../game/natba/natba1HeuristicPolicy";
import { LocalGamePage } from "./LocalGamePage";
import { DeskTable } from "./components/DeskTable";
import type { PlayingLocalGameSession } from "./localGameSession";
import { getCardDefinition } from "./localGameView";
import { getCardDisplayName } from "./presentationLocale";
import {
  TUTORIAL_PRESET_PREPARATION_CARD_IDS,
  TUTORIAL_SEED,
  TUTORIAL_TARGET_PLAY_CARD_ID,
  TUTORIAL_TARGET_RESPONSE_CARD_ID,
  deriveTutorialStep,
  isAllowedTutorialGameAction,
} from "./tutorial/tutorialScript";

const blockedDiyAction: GameAction = {
  type: "PLAY_DIY_SELECTION",
  playerId: "player_1",
  componentCardInstanceIds: ["substance_naoh_dilute_02", "substance_hcl_dilute_03"],
};

const blockedStatusAction: GameAction = {
  type: "PASS_STATUS_HANDLING",
  playerId: "player_1",
  statusInstanceId: "status_fire_01",
};

const presetPreparation: Extract<GameAction, { type: "CONFIRM_LABORATORY_PREPARATION" }> = {
  type: "CONFIRM_LABORATORY_PREPARATION",
  playerId: "player_1",
  keptCardInstanceIds: [...TUTORIAL_PRESET_PREPARATION_CARD_IDS],
};

function createTutorialGame(): GameState {
  return createInitialGame({
    characterIds: ["laboratory_teacher", "chemical_factory_ceo"],
    seed: TUTORIAL_SEED,
  });
}

function alternatePreparation(game: GameState): GameAction {
  const candidates = game.pendingLaboratoryPreparation?.candidateCardInstanceIds ?? [];
  const outsider = candidates.find((id) => !TUTORIAL_PRESET_PREPARATION_CARD_IDS.includes(id));
  if (!outsider) throw new Error("Tutorial seed must offer a non-preset candidate.");
  return {
    type: "CONFIRM_LABORATORY_PREPARATION",
    playerId: "player_1",
    keptCardInstanceIds: [
      ...TUTORIAL_PRESET_PREPARATION_CARD_IDS.filter((id) => id !== TUTORIAL_TARGET_RESPONSE_CARD_ID),
      outsider,
    ],
  };
}

function zhCardName(game: GameState, cardInstanceId: CardInstanceId): string {
  const definition = getCardDefinition(game, cardInstanceId);
  if (!definition) throw new Error(`Unknown card instance: ${cardInstanceId}`);
  return getCardDisplayName(definition.id, definition.name, "zh-CN");
}

function runOpponentTurn(game: GameState, random: () => number): GameState {
  let current = game;
  for (let guard = 0; guard < 10; guard += 1) {
    const context = getDecisionContext(current);
    if (context.kind !== "finite-actions" || context.playerId !== "player_2") return current;
    const action = natba1xSelfPlayTunedPolicy(getAIObservation(current, "player_2"), context, random);
    if (!action) return current;
    current = engineReducer(current, action);
  }
  return current;
}

function tutorialPlayingSession(): PlayingLocalGameSession {
  return {
    mode: "playing",
    characterIds: ["laboratory_teacher", "chemical_factory_ceo"],
    playerControllers: ["human", "ai"],
    revision: 0,
    game: createTutorialGame(),
    error: null,
  };
}

async function renderInto(container: HTMLDivElement, node: ReactNode) {
  const root = createRoot(container);
  await act(async () => {
    root.render(<StrictMode>{node}</StrictMode>);
  });
  return root;
}

describe("Phase 20 Tutorial Dispatch Gate and Interactive Tutorial", () => {
  it("strictly enforces action whitelist per step: rejects unallowed actions", () => {
    const game = createTutorialGame();

    // 1. PREPARATION step: ONLY the scripted 10 kept cards are allowed
    expect(isAllowedTutorialGameAction(presetPreparation, "PREPARATION")).toBe(true);
    expect(
      isAllowedTutorialGameAction(
        {
          ...presetPreparation,
          keptCardInstanceIds: [...TUTORIAL_PRESET_PREPARATION_CARD_IDS].reverse(),
        },
        "PREPARATION",
      ),
    ).toBe(true);
    for (const keptCardInstanceIds of [
      [],
      TUTORIAL_PRESET_PREPARATION_CARD_IDS.slice(0, 9),
      [...TUTORIAL_PRESET_PREPARATION_CARD_IDS.slice(0, 9), TUTORIAL_PRESET_PREPARATION_CARD_IDS[0]],
    ]) {
      expect(
        isAllowedTutorialGameAction({ ...presetPreparation, keptCardInstanceIds }, "PREPARATION"),
      ).toBe(false);
    }
    expect(isAllowedTutorialGameAction(alternatePreparation(game), "PREPARATION")).toBe(false);
    expect(
      isAllowedTutorialGameAction({ ...presetPreparation, playerId: "player_2" }, "PREPARATION"),
    ).toBe(false);
    expect(
      isAllowedTutorialGameAction({ type: "PASS_ACTION", playerId: "player_1" }, "PREPARATION"),
    ).toBe(false);
    expect(
      isAllowedTutorialGameAction(
        { type: "ACTIVATE_CHARACTER_SKILL", playerId: "player_1", skillId: "extra_lesson" },
        "PREPARATION",
      ),
    ).toBe(false);

    // 2. PLAY_REFERENCE_CARD step: ONLY dilute NaOH PLAY_REFERENCE_CARD allowed
    const playReference = {
      type: "PLAY_REFERENCE_CARD",
      playerId: "player_1",
      cardInstanceId: TUTORIAL_TARGET_PLAY_CARD_ID,
    } as const satisfies GameAction;
    expect(isAllowedTutorialGameAction(playReference, "PLAY_REFERENCE_CARD")).toBe(true);
    for (const action of [
      { ...playReference, cardInstanceId: "element_c_03" },
      { type: "PLAY_CARD", playerId: "player_1", cardInstanceId: TUTORIAL_TARGET_PLAY_CARD_ID },
      blockedDiyAction,
      blockedStatusAction,
      { type: "PASS_ACTION", playerId: "player_1" },
    ] satisfies GameAction[]) {
      expect(isAllowedTutorialGameAction(action, "PLAY_REFERENCE_CARD")).toBe(false);
    }

    // 3. RESPOND_WITH_CARD step: dilute KOH or PASS_RESPONSE allowed
    const respond = {
      type: "RESPOND_WITH_CARD",
      playerId: "player_1",
      cardInstanceId: TUTORIAL_TARGET_RESPONSE_CARD_ID,
    } as const satisfies GameAction;
    expect(isAllowedTutorialGameAction(respond, "RESPOND_WITH_CARD")).toBe(true);
    expect(
      isAllowedTutorialGameAction({ type: "PASS_RESPONSE", playerId: "player_1" }, "RESPOND_WITH_CARD"),
    ).toBe(true);
    expect(
      isAllowedTutorialGameAction(
        { ...respond, cardInstanceId: "substance_caoh2_limewater_02" },
        "RESPOND_WITH_CARD",
      ),
    ).toBe(false);
    expect(isAllowedTutorialGameAction(blockedDiyAction, "RESPOND_WITH_CARD")).toBe(false);

    // 4. Other steps: All game actions disallowed
    for (const stepKey of ["SELECT_HAND_CARD", "AWAIT_AI_ATTACK", "COMPLETED"] as const) {
      for (const action of [playReference, presetPreparation, respond, { type: "PASS_ACTION", playerId: "player_1" }] satisfies GameAction[]) {
        expect(isAllowedTutorialGameAction(action, stepKey)).toBe(false);
      }
    }
  });

  it("pins the scripted instance ids to TUTORIAL_SEED through engineReducer", () => {
    const initial = createTutorialGame();
    const candidates = initial.pendingLaboratoryPreparation?.candidateCardInstanceIds ?? [];
    expect(initial.pendingLaboratoryPreparation?.playerId).toBe("player_1");
    expect(TUTORIAL_PRESET_PREPARATION_CARD_IDS).toHaveLength(10);
    expect(candidates).toEqual(expect.arrayContaining([...TUTORIAL_PRESET_PREPARATION_CARD_IDS]));

    const alternate = engineReducer(initial, alternatePreparation(initial));
    expect(alternate.phase).toBe("mainAction");
    expect(alternate.players[0].hand).not.toContain(TUTORIAL_TARGET_RESPONSE_CARD_ID);

    const prepared = engineReducer(initial, presetPreparation);
    expect(prepared.phase).toBe("mainAction");
    expect(prepared.activePlayerId).toBe("player_1");
    expect(deriveTutorialStep(prepared)).toBe("SELECT_HAND_CARD");
    expect(deriveTutorialStep(prepared, TUTORIAL_TARGET_PLAY_CARD_ID)).toBe("PLAY_REFERENCE_CARD");
    expect(getLegalActions(prepared, "player_1")).toContainEqual({
      type: "PLAY_REFERENCE_CARD",
      playerId: "player_1",
      cardInstanceId: TUTORIAL_TARGET_PLAY_CARD_ID,
    });

    const played = engineReducer(prepared, {
      type: "PLAY_REFERENCE_CARD",
      playerId: "player_1",
      cardInstanceId: TUTORIAL_TARGET_PLAY_CARD_ID,
    });
    expect(deriveTutorialStep(played)).toBe("AWAIT_AI_ATTACK");

    for (const random of [() => 0, () => 0.999]) {
      const attacked = runOpponentTurn(played, random);
      expect(attacked.phase).toBe("responseWindow");
      expect(attacked.pendingResponse?.responderId).toBe("player_1");
      expect(attacked.pendingResponse?.sourceEffect).toMatchObject({
        type: "DAMAGE",
        context: { targetPlayerId: "player_1", baseAmount: 1, tags: ["acid"] },
      });
      expect(deriveTutorialStep(attacked)).toBe("RESPOND_WITH_CARD");
      expect(getLegalActions(attacked, "player_1")).toEqual(
        expect.arrayContaining([
          { type: "RESPOND_WITH_CARD", playerId: "player_1", cardInstanceId: TUTORIAL_TARGET_RESPONSE_CARD_ID },
          { type: "PASS_RESPONSE", playerId: "player_1" },
        ]),
      );

      const responded = engineReducer(attacked, {
        type: "RESPOND_WITH_CARD",
        playerId: "player_1",
        cardInstanceId: TUTORIAL_TARGET_RESPONSE_CARD_ID,
      });
      expect(responded.players[0].hp).toBe(10);
      expect(deriveTutorialStep(responded)).toBe("COMPLETED");

      const passed = engineReducer(attacked, { type: "PASS_RESPONSE", playerId: "player_1" });
      expect(passed.players[0].hp).toBe(9);
      expect(passed.phase).toBe("mainAction");
      expect(passed.activePlayerId).toBe("player_1");
      expect(deriveTutorialStep(passed)).toBe("COMPLETED");
    }
  });

  it("drops non-whitelist actions sent through DeskTable.dispatchGameAction", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const dispatch = vi.fn();
    const dispatchGameActionRef: MutableRefObject<((action: GameAction) => void) | null> = {
      current: null,
    };
    const session = tutorialPlayingSession();

    const root = await renderInto(
      container,
      <DeskTable
        dispatch={dispatch}
        dispatchGameActionRef={dispatchGameActionRef}
        isTutorial
        onRequestSessionExit={() => undefined}
        session={session}
      />,
    );

    try {
      expect(container.querySelector('[data-testid="desk-table"]')).not.toBeNull();
      expect(dispatchGameActionRef.current).toEqual(expect.any(Function));

      await act(async () => {
        dispatchGameActionRef.current?.(blockedDiyAction);
        dispatchGameActionRef.current?.(blockedStatusAction);
        dispatchGameActionRef.current?.(alternatePreparation(session.game));
      });
      expect(dispatch).not.toHaveBeenCalled();

      await act(async () => {
        dispatchGameActionRef.current?.(presetPreparation);
      });
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: "DISPATCH_GAME_ACTION", action: presetPreparation });
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it("plays the 4 scripted steps on the official desk and keeps every wrong click out of the engine", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const reduceGame = vi.fn(engineReducer);
    const dispatchGameActionRef: MutableRefObject<((action: GameAction) => void) | null> = {
      current: null,
    };
    const seedGame = createTutorialGame();
    const opponentHandNames = [...new Set(seedGame.players[1].hand.map((id) => zhCardName(seedGame, id)))];
    const humanCalls = () =>
      reduceGame.mock.calls.filter(([, action]) => action.playerId === "player_1").length;
    const banner = () => container.querySelector('[data-testid="coach-banner"]')?.textContent ?? "";
    const actionButton = (label: string) =>
      Array.from(container.querySelectorAll<HTMLButtonElement>(".desk-action-bar button")).find(
        (button) => button.textContent?.includes(label),
      );
    const clickEnabledAction = (label: string) => {
      const button = actionButton(label);
      expect(button?.disabled).toBe(false);
      button?.click();
    };
    const clickOwnCard = async (cardInstanceId: CardInstanceId) => {
      const name = zhCardName(seedGame, cardInstanceId);
      const cards = Array.from(
        container.querySelectorAll(".desk-table__own-zone .official-card"),
      ).filter((card) => card.querySelector(".official-card__name")?.textContent === name);
      expect(cards).toHaveLength(1);
      await act(async () => {
        cards[0].querySelector<HTMLButtonElement>("button.official-card__button")?.click();
      });
    };
    const expectBlocked = async (step: string, attempt: () => void) => {
      const before = humanCalls();
      await act(async () => {
        attempt();
      });
      expect(humanCalls()).toBe(before);
      expect(banner()).toContain(step);
    };
    const expectOpponentHandHidden = () => {
      const opponentZone = container.querySelector(".desk-table__opponent-zone");
      expect(opponentZone?.querySelectorAll(".official-card--back").length).toBeGreaterThan(0);
      expect(opponentZone?.querySelectorAll(".official-card__name")).toHaveLength(0);
      for (const name of opponentHandNames) {
        expect(opponentZone?.textContent).not.toContain(name);
      }
    };

    const root = await renderInto(
      container,
      <LocalGamePage
        aiDelayMs={0}
        dispatchGameActionRef={dispatchGameActionRef}
        initialTutorial={true}
        isDebug={false}
        reduceGame={reduceGame}
      />,
    );

    try {
      // Step 1: preparation, only the scripted 10 cards pass the gate
      expect(container.querySelector('[data-testid="desk-table"]')).not.toBeNull();
      expect(banner()).toContain("步骤 1/4 · 备课阶段");
      expectOpponentHandHidden();
      const confirmPrepButton = container.querySelector<HTMLButtonElement>(
        ".desk-action-bar button.desk-action-btn--primary",
      );
      expect(confirmPrepButton?.classList.contains("coach-highlight")).toBe(true);

      const presetSwap = "substance_o2_02";
      const outsiderSwap = "substance_h2o_02";
      await clickOwnCard(presetSwap);
      await clickOwnCard(outsiderSwap);
      expect(confirmPrepButton?.textContent).toContain("10/10");
      expect(confirmPrepButton?.disabled).toBe(false);
      await expectBlocked("步骤 1/4", () => confirmPrepButton?.click());
      await expectBlocked("步骤 1/4", () => {
        dispatchGameActionRef.current?.(blockedDiyAction);
        dispatchGameActionRef.current?.(blockedStatusAction);
      });

      await clickOwnCard(outsiderSwap);
      await clickOwnCard(presetSwap);
      await act(async () => {
        confirmPrepButton?.click();
      });
      expect(reduceGame).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: "CONFIRM_LABORATORY_PREPARATION",
          keptCardInstanceIds: expect.arrayContaining([...TUTORIAL_PRESET_PREPARATION_CARD_IDS]),
        }),
      );

      // Step 2: select dilute NaOH
      expect(banner()).toContain("步骤 2/4 · 看手牌与选牌");
      expectOpponentHandHidden();
      const highlightedCards = container.querySelectorAll(".desk-table__own-zone .official-card.coach-highlight");
      expect(highlightedCards).toHaveLength(1);
      expect(highlightedCards[0].textContent).toContain(zhCardName(seedGame, TUTORIAL_TARGET_PLAY_CARD_ID));

      await clickOwnCard("element_c_03");
      await expectBlocked("步骤 2/4", () => clickEnabledAction("普通出牌"));
      await expectBlocked("步骤 2/4", () => clickEnabledAction("结束本次行动"));
      await expectBlocked("步骤 2/4", () => dispatchGameActionRef.current?.(blockedDiyAction));
      await clickOwnCard("element_c_03");
      await clickOwnCard(TUTORIAL_TARGET_PLAY_CARD_ID);

      // Step 3: PLAY_REFERENCE_CARD with dilute NaOH
      expect(banner()).toContain("步骤 3/4 · 普通出牌建立基准");
      await expectBlocked("步骤 3/4", () => clickEnabledAction("执行效果"));
      await expectBlocked("步骤 3/4", () => dispatchGameActionRef.current?.(blockedStatusAction));
      const playRefButton = actionButton("普通出牌");
      expect(playRefButton?.classList.contains("coach-highlight")).toBe(true);
      await act(async () => {
        playRefButton?.click();
      });
      expect(reduceGame).toHaveBeenCalledWith(expect.anything(), {
        type: "PLAY_REFERENCE_CARD",
        playerId: "player_1",
        cardInstanceId: TUTORIAL_TARGET_PLAY_CARD_ID,
      });

      // Step 4: the AI attacks publicly (aiDelayMs=0), then respond with dilute KOH
      expect(banner()).toContain("步骤 4/4 · 响应酸性伤害");
      expectOpponentHandHidden();
      const highlightedResponseCards = container.querySelectorAll(
        ".desk-table__own-zone .official-card.coach-highlight",
      );
      expect(highlightedResponseCards).toHaveLength(1);
      expect(highlightedResponseCards[0].textContent).toContain(
        zhCardName(seedGame, TUTORIAL_TARGET_RESPONSE_CARD_ID),
      );

      await clickOwnCard("substance_caoh2_limewater_02");
      await expectBlocked("步骤 4/4", () => clickEnabledAction("打出响应"));
      await expectBlocked("步骤 4/4", () => dispatchGameActionRef.current?.(blockedDiyAction));
      await clickOwnCard("substance_caoh2_limewater_02");
      await clickOwnCard(TUTORIAL_TARGET_RESPONSE_CARD_ID);
      const playResponseButton = actionButton("打出响应");
      expect(playResponseButton?.classList.contains("coach-highlight")).toBe(true);
      await act(async () => {
        playResponseButton?.click();
      });
      expect(reduceGame).toHaveBeenCalledWith(expect.anything(), {
        type: "RESPOND_WITH_CARD",
        playerId: "player_1",
        cardInstanceId: TUTORIAL_TARGET_RESPONSE_CARD_ID,
      });

      // Completed: every further GameAction stays out of the engine
      expect(banner()).toContain("教学完成");
      expect(banner()).toContain("本局教学已结束");
      expectOpponentHandHidden();
      await expectBlocked("教学完成", () => {
        dispatchGameActionRef.current?.({ type: "PASS_ACTION", playerId: "player_1" });
        dispatchGameActionRef.current?.(blockedDiyAction);
      });

      const completeButton = container.querySelector<HTMLButtonElement>('[data-testid="coach-banner-complete"]');
      expect(completeButton?.textContent).toContain("进入人机对局");
      await act(async () => {
        completeButton?.click();
      });
      expect(container.querySelector('[data-testid="coach-banner"]')).toBeNull();
      expect(container.querySelector('[data-testid="desk-table"]')).not.toBeNull();
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it("removes tutorial=1 on skip and then lets an out-of-script action reach the engine", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    window.history.pushState({}, "", "/play?mode=solo_ai&tutorial=1");
    const container = document.createElement("div");
    document.body.append(container);
    const reduceGame = vi.fn(engineReducer);
    const dispatchGameActionRef: MutableRefObject<((action: GameAction) => void) | null> = {
      current: null,
    };

    const root = await renderInto(
      container,
      <LocalGamePage
        aiDelayMs={0}
        dispatchGameActionRef={dispatchGameActionRef}
        initialTutorial={true}
        isDebug={false}
        reduceGame={reduceGame}
      />,
    );

    try {
      expect(container.querySelector('[data-testid="coach-banner"]')).not.toBeNull();
      expect(window.location.search).toContain("tutorial=1");

      await act(async () => {
        dispatchGameActionRef.current?.(blockedDiyAction);
      });
      expect(reduceGame).not.toHaveBeenCalled();

      const skipButton = container.querySelector('[data-testid="coach-banner-skip"]') as HTMLButtonElement;
      expect(skipButton).not.toBeNull();
      expect(skipButton.textContent).toContain("跳过教学");

      await act(async () => {
        skipButton.click();
      });

      expect(container.querySelector('[data-testid="coach-banner"]')).toBeNull();
      expect(container.querySelector('[data-testid="desk-table"]')).not.toBeNull();
      expect(window.location.search).not.toContain("tutorial=1");
      expect(`${window.location.pathname}${window.location.search}`).toBe("/play?mode=solo_ai");

      reduceGame.mockClear();
      await act(async () => {
        dispatchGameActionRef.current?.(blockedDiyAction);
      });
      expect(reduceGame).toHaveBeenCalled();
      expect(reduceGame.mock.calls.some((call) => call[1]?.type === "PLAY_DIY_SELECTION")).toBe(true);
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
      window.history.pushState({}, "", "/");
    }
  });

  it("keeps /debug without a tutorial query on the debug lab", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    window.history.pushState({}, "", "/debug");
    const container = document.createElement("div");
    document.body.append(container);

    const root = await renderInto(container, <LocalGamePage isDebug />);

    try {
      expect(container.querySelector('[data-testid="coach-banner"]')).toBeNull();
      expect(container.querySelector('[data-testid="desk-table"]')).toBeNull();
      expect(container.textContent).toContain("角色选择");
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
      window.history.pushState({}, "", "/");
    }
  });

  it("renders tutorial coach banner in English when locale is en", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          <StrictMode>
            <LocaleProvider>
              <LocalGamePage aiDelayMs={0} initialTutorial={true} isDebug={false} />
            </LocaleProvider>
          </StrictMode>,
        );
      });

      // Switch to English via locale switch button
      const enButton = Array.from(container.querySelectorAll(".locale-switch__button")).find(
        (btn) => btn.textContent?.includes("English"),
      ) as HTMLButtonElement | undefined;
      expect(enButton).toBeDefined();

      await act(async () => {
        enButton?.click();
      });

      const coachBanner = container.querySelector('[data-testid="coach-banner"]');
      expect(coachBanner?.textContent).toContain("Step 1/4 · Preparation");
      expect(coachBanner?.textContent).toContain("Skip Tutorial");
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });
});
