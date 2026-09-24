// @vitest-environment happy-dom

import { StrictMode, act, type MutableRefObject, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../app/locale";
import type { GameAction } from "../../game/engine/actions";
import { createInitialGame } from "../../game/engine/createInitialGame";
import { engineReducer } from "../../game/engine/reducer";
import { LocalGamePage } from "./LocalGamePage";
import { DeskTable } from "./components/DeskTable";
import type { PlayingLocalGameSession } from "./localGameSession";
import {
  TUTORIAL_PRESET_PREPARATION_CARD_IDS,
  TUTORIAL_SEED,
  TUTORIAL_TARGET_PLAY_CARD_ID,
  TUTORIAL_TARGET_RESPONSE_CARD_ID,
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

function tutorialPlayingSession(): PlayingLocalGameSession {
  return {
    mode: "playing",
    characterIds: ["laboratory_teacher", "chemical_factory_ceo"],
    playerControllers: ["human", "ai"],
    revision: 0,
    game: createInitialGame({
      characterIds: ["laboratory_teacher", "chemical_factory_ceo"],
      seed: TUTORIAL_SEED,
    }),
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
    // 1. PREPARATION step: ONLY CONFIRM_LABORATORY_PREPARATION allowed
    expect(
      isAllowedTutorialGameAction(
        { type: "CONFIRM_LABORATORY_PREPARATION", playerId: "player_1", keptCardInstanceIds: [] },
        "PREPARATION",
      ),
    ).toBe(true);
    expect(
      isAllowedTutorialGameAction(
        { type: "PASS_ACTION", playerId: "player_1" },
        "PREPARATION",
      ),
    ).toBe(false);
    expect(
      isAllowedTutorialGameAction(
        { type: "ACTIVATE_CHARACTER_SKILL", playerId: "player_1", skillId: "extra_lesson" },
        "PREPARATION",
      ),
    ).toBe(false);

    // 2. PLAY_REFERENCE_CARD step: ONLY dilute NaOH PLAY_REFERENCE_CARD allowed
    expect(
      isAllowedTutorialGameAction(
        {
          type: "PLAY_REFERENCE_CARD",
          playerId: "player_1",
          cardInstanceId: TUTORIAL_TARGET_PLAY_CARD_ID,
        },
        "PLAY_REFERENCE_CARD",
      ),
    ).toBe(true);
    expect(
      isAllowedTutorialGameAction(
        {
          type: "PLAY_REFERENCE_CARD",
          playerId: "player_1",
          cardInstanceId: "substance_other_card",
        },
        "PLAY_REFERENCE_CARD",
      ),
    ).toBe(false);
    expect(
      isAllowedTutorialGameAction(
        {
          type: "PLAY_DIY_SELECTION",
          playerId: "player_1",
          componentCardInstanceIds: [],
        },
        "PLAY_REFERENCE_CARD",
      ),
    ).toBe(false);
    expect(
      isAllowedTutorialGameAction(
        { type: "PASS_ACTION", playerId: "player_1" },
        "PLAY_REFERENCE_CARD",
      ),
    ).toBe(false);

    // 3. RESPOND_WITH_CARD step: dilute KOH or PASS_RESPONSE allowed
    expect(
      isAllowedTutorialGameAction(
        {
          type: "RESPOND_WITH_CARD",
          playerId: "player_1",
          cardInstanceId: TUTORIAL_TARGET_RESPONSE_CARD_ID,
        },
        "RESPOND_WITH_CARD",
      ),
    ).toBe(true);
    expect(
      isAllowedTutorialGameAction(
        { type: "PASS_RESPONSE", playerId: "player_1" },
        "RESPOND_WITH_CARD",
      ),
    ).toBe(true);
    expect(
      isAllowedTutorialGameAction(
        {
          type: "RESPOND_WITH_CARD",
          playerId: "player_1",
          cardInstanceId: "substance_other_card",
        },
        "RESPOND_WITH_CARD",
      ),
    ).toBe(false);

    // 4. Other steps: All game actions disallowed
    expect(
      isAllowedTutorialGameAction(
        {
          type: "PLAY_REFERENCE_CARD",
          playerId: "player_1",
          cardInstanceId: TUTORIAL_TARGET_PLAY_CARD_ID,
        },
        "SELECT_HAND_CARD",
      ),
    ).toBe(false);
    expect(
      isAllowedTutorialGameAction(
        { type: "PASS_ACTION", playerId: "player_1" },
        "AWAIT_AI_ATTACK",
      ),
    ).toBe(false);
    expect(
      isAllowedTutorialGameAction(
        { type: "PASS_ACTION", playerId: "player_1" },
        "COMPLETED",
      ),
    ).toBe(false);
  });

  it("drops non-whitelist actions sent through DeskTable.dispatchGameAction", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const dispatch = vi.fn();
    const dispatchGameActionRef: MutableRefObject<((action: GameAction) => void) | null> = {
      current: null,
    };

    const root = await renderInto(
      container,
      <DeskTable
        dispatch={dispatch}
        dispatchGameActionRef={dispatchGameActionRef}
        isTutorial
        onRequestSessionExit={() => undefined}
        session={tutorialPlayingSession()}
      />,
    );

    try {
      expect(container.querySelector('[data-testid="desk-table"]')).not.toBeNull();
      expect(dispatchGameActionRef.current).toEqual(expect.any(Function));

      await act(async () => {
        dispatchGameActionRef.current?.(blockedDiyAction);
        dispatchGameActionRef.current?.(blockedStatusAction);
      });

      expect(dispatch).not.toHaveBeenCalled();

      // Known gap: preparation whitelist does not pin the preset 10 cards.
      const alternateKept = [
        ...TUTORIAL_PRESET_PREPARATION_CARD_IDS.slice(0, 9),
        "substance_other_kept_card",
      ];
      await act(async () => {
        dispatchGameActionRef.current?.({
          type: "CONFIRM_LABORATORY_PREPARATION",
          playerId: "player_1",
          keptCardInstanceIds: alternateKept,
        });
      });

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({
        type: "DISPATCH_GAME_ACTION",
        action: {
          type: "CONFIRM_LABORATORY_PREPARATION",
          playerId: "player_1",
          keptCardInstanceIds: alternateKept,
        },
      });
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  });

  it("executes full interactive tutorial flow on official landscape desk (DeskTable)", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    try {
      await act(async () => {
        root.render(
          <StrictMode>
            <LocalGamePage aiDelayMs={0} initialTutorial={true} isDebug={false} />
          </StrictMode>,
        );
      });

      // 1. Direct entry into tutorial playing mode (DeskTable)
      expect(container.querySelector('[data-testid="desk-table"]')).not.toBeNull();
      const coachBanner = container.querySelector('[data-testid="coach-banner"]');
      expect(coachBanner).not.toBeNull();
      expect(coachBanner?.textContent).toContain("步骤 1/4 · 备课阶段");

      // Confirm preparation button is highlighted
      const confirmPrepButton = container.querySelector(".desk-action-bar button.desk-action-btn--primary") as HTMLButtonElement;
      expect(confirmPrepButton).not.toBeNull();
      expect(confirmPrepButton.classList.contains("coach-highlight")).toBe(true);

      // Step 1: Click confirm preparation
      await act(async () => {
        confirmPrepButton.click();
      });

      // 2. Step 2/4: Inspect hand & select card
      expect(container.querySelector(".coach-banner")?.textContent).toContain("步骤 2/4 · 看手牌与选牌");
      const ownZone = container.querySelector(".desk-table__own-zone");
      expect(ownZone).not.toBeNull();

      // Find the highlighted card (dilute NaOH)
      const highlightedCards = ownZone?.querySelectorAll(".official-card.coach-highlight");
      expect(highlightedCards?.length).toBe(1);
      const naohCard = highlightedCards?.[0];
      expect(naohCard?.textContent).toContain("稀 NaOH");

      // Click to select the card
      const naohButton = naohCard?.querySelector("button.official-card__button") as HTMLButtonElement;
      expect(naohButton).not.toBeNull();
      await act(async () => {
        naohButton.click();
      });

      // 3. Step 3/4: Play card as table reference
      expect(container.querySelector(".coach-banner")?.textContent).toContain("步骤 3/4 · 普通出牌建立基准");
      const playButtons = Array.from(container.querySelectorAll(".desk-action-bar button")) as HTMLButtonElement[];
      const playRefButton = playButtons.find((btn) => btn.textContent?.includes("普通出牌"));
      expect(playRefButton).toBeDefined();
      expect(playRefButton?.classList.contains("coach-highlight")).toBe(true);

      // Click Play to establish table reference
      await act(async () => {
        playRefButton?.click();
      });

      // 4. AI takes turn (aiDelayMs=0) -> deals 1 acid damage -> enters Step 4/4 Response Window
      expect(container.querySelector(".coach-banner")?.textContent).toContain("步骤 4/4 · 响应酸性伤害");

      // Target response card (dilute KOH) is highlighted in hand
      const highlightedResponseCards = ownZone?.querySelectorAll(".official-card.coach-highlight");
      expect(highlightedResponseCards?.length).toBe(1);
      const kohCard = highlightedResponseCards?.[0];
      expect(kohCard?.textContent).toContain("稀 KOH");

      // Select KOH card
      const kohButton = kohCard?.querySelector("button.official-card__button") as HTMLButtonElement;
      expect(kohButton).not.toBeNull();
      await act(async () => {
        kohButton.click();
      });

      // Response button is highlighted
      const playResponseButton = container.querySelector(".desk-action-bar button.desk-action-btn--primary") as HTMLButtonElement;
      expect(playResponseButton).not.toBeNull();
      expect(playResponseButton.textContent).toContain("打出响应");
      expect(playResponseButton.classList.contains("coach-highlight")).toBe(true);

      // Click play response
      await act(async () => {
        playResponseButton.click();
      });

      // 5. Reaction recorded & Step 5: Tutorial Completed!
      expect(container.querySelector(".coach-banner")?.textContent).toContain("教学完成");
      expect(container.querySelector(".coach-banner")?.textContent).toContain("本局教学已结束");
      expect(container.querySelector(".coach-banner")?.textContent).not.toContain("继续体验本局");

      // Complete button is shown
      const completeButton = container.querySelector('[data-testid="coach-banner-complete"]') as HTMLButtonElement;
      expect(completeButton).not.toBeNull();
      expect(completeButton.textContent).toContain("进入人机对局");

      // Click complete -> transitions into fresh normal Solo vs AI
      await act(async () => {
        completeButton.click();
      });

      // Coach banner is removed
      expect(container.querySelector('[data-testid="coach-banner"]')).toBeNull();
      // Desk table remains active
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
