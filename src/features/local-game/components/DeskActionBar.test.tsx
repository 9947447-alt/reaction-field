// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider, type DisplayLocale } from "../../../app/locale";
import { characterDefinitions, getCharacterDefinition } from "../../../game/data/characterDefinitions";
import { cardDefinitionsById } from "../../../game/data/cardDefinitions";
import { createInitialGame } from "../../../game/engine/createInitialGame";
import { getLegalCharacterSkillActions } from "../../../game/engine/characterSkills";
import { engineReducer } from "../../../game/engine/reducer";
import type { ActivateCharacterSkillAction } from "../../../game/engine/actions";
import type {
  CardInstanceId,
  CharacterId,
  GameState,
  PlayerId,
} from "../../../game/engine/types";
import { identityShuffle } from "../../../shared/random";
import { getOptionalCardDisplayName, getSkillDisplayName } from "../presentationLocale";
import { DeskActionBar, DeskActionOverflowMenu, type DeskActionBarProps } from "./DeskActionBar";

function publicButtons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll(".desk-action-btn"));
}

function skillButtons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll("button[data-skill-id]"));
}

function findSkillButton(
  container: HTMLElement,
  skillId: string,
): HTMLButtonElement | undefined {
  return (
    (container.querySelector(`button[data-skill-id="${skillId}"]`) as HTMLButtonElement | null) ??
    undefined
  );
}

function findOverflowMenu(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[role="menu"][aria-label="更多操作"], [role="menu"][aria-label="More actions"]');
}

async function openOverflowMenu(container: HTMLElement): Promise<HTMLElement | null> {
  const trigger = container.querySelector<HTMLButtonElement>(
    'button[data-testid="desk-action-menu-trigger"]',
  );
  if (!trigger) return null;

  await act(async () => {
    trigger.click();
  });
  return findOverflowMenu(container);
}

function findInstanceId(game: GameState, definitionId: string): CardInstanceId {
  const instance = Object.values(game.cardInstances).find(
    (card) => card.definitionId === definitionId,
  );
  if (!instance) {
    throw new Error(`Missing card instance for ${definitionId}`);
  }
  return instance.id;
}

function confirmPreparation(state: GameState): GameState {
  const pending = state.pendingLaboratoryPreparation;
  if (!pending) {
    return state;
  }
  return engineReducer(state, {
    type: "CONFIRM_LABORATORY_PREPARATION",
    playerId: pending.playerId,
    keptCardInstanceIds: pending.candidateCardInstanceIds.slice(0, 10),
  });
}

function setPlayerHandSize(
  state: GameState,
  playerId: PlayerId,
  handSize: number,
): GameState {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player || handSize > player.hand.length) {
    throw new Error(`Cannot set ${playerId} hand size to ${handSize}.`);
  }

  const discardedIds = player.hand.slice(handSize);
  const discardedIdSet = new Set(discardedIds);
  const cardInstances = { ...state.cardInstances };

  for (const cardId of discardedIds) {
    cardInstances[cardId] = {
      ...cardInstances[cardId],
      ownerId: undefined,
      zone: { type: "discard" },
    };
  }

  return {
    ...state,
    cardInstances,
    discardPile: [...state.discardPile, ...discardedIds],
    players: state.players.map((candidate) =>
      candidate.id === playerId
        ? {
            ...candidate,
            hand: candidate.hand.filter((cardId) => !discardedIdSet.has(cardId)),
          }
        : candidate,
    ),
  };
}

function withPlayerHand(
  game: GameState,
  playerId: "player_1" | "player_2",
  extraHandIds: readonly CardInstanceId[],
  hp?: number,
): GameState {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new Error(`Missing ${playerId}`);
  }

  const extra = extraHandIds.filter((id) => !player.hand.includes(id));
  const hand = [...player.hand, ...extra];
  const taken = new Set(extra);

  return {
    ...game,
    deck: game.deck.filter((id) => !taken.has(id)),
    discardPile: game.discardPile.filter((id) => !taken.has(id)),
    cardInstances: {
      ...game.cardInstances,
      ...Object.fromEntries(
        extra.map((id) => [
          id,
          {
            ...game.cardInstances[id],
            ownerId: playerId,
            zone: { type: "hand" as const, playerId },
          },
        ]),
      ),
    },
    players: game.players.map((candidate) =>
      candidate.id === playerId
        ? { ...candidate, hand, hp: hp ?? candidate.hp }
        : candidate,
    ),
  };
}

function createMainActionGame(characterIds: [CharacterId, CharacterId]): GameState {
  return createInitialGame({
    characterIds,
    shuffle: identityShuffle,
  });
}

function createTeacherGame(handSize = 4): GameState {
  const base = createInitialGame({
    characterIds: ["laboratory_teacher", "acid_king"],
    shuffle: identityShuffle,
  });
  const ready = confirmPreparation(base);
  return setPlayerHandSize(ready, "player_1", handSize);
}

function createCeoGame(handSize = 4): GameState {
  const base = createInitialGame({
    characterIds: ["chemical_factory_ceo", "acid_king"],
    shuffle: identityShuffle,
  });
  return setPlayerHandSize(base, "player_1", handSize);
}

function createCaptainGame(): GameState {
  const base = createMainActionGame(["caustic_soda_captain", "acid_king"]);
  const alkaliId = findInstanceId(base, "substance_naoh_dilute");
  return withPlayerHand(base, "player_1", [alkaliId], base.players[0].maxHp - 1);
}

function createDirectorGame(): GameState {
  return createMainActionGame(["sulfuric_acid_factory_director", "acid_king"]);
}

function createSecretaryGame(): GameState {
  return createMainActionGame(["clumsy_party_secretary", "acid_king"]);
}

function createCounterattackGame(): GameState {
  const base = createInitialGame({
    characterIds: ["clumsy_party_secretary", "chemistry_enthusiast"],
    shuffle: identityShuffle,
  });
  return {
    ...base,
    pendingLaboratoryPreparation: undefined,
    phase: "experimentCounterattackWindow",
    pendingExperimentCounterattack: {
      attackerPlayerId: "player_1",
      continuation: { kind: "single-response" },
      legalMetalCardInstanceIds: [],
      legalOptions: ["recover"],
      legalPursuitCardInstanceIds: [],
      originalDamageContext: {
        baseAmount: 1,
        responsePolicy: "acid-base",
        source: {
          cardDefinitionId: "substance_hcl_dilute",
          cardInstanceId: "substance_hcl_dilute_01",
          kind: "card",
          sourcePlayerId: "player_1",
        },
        tags: [],
        targetPlayerId: "player_2",
      },
      responderPlayerId: "player_1",
      responseType: "acid-base",
    },
  } as GameState;
}

describe("Official desk action bar character skills", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  async function renderDeskActionBar(
    props: DeskActionBarProps,
    locale: DisplayLocale = "zh-CN",
  ) {
    Object.defineProperty(navigator, "languages", {
      value: locale === "en" ? ["en-US"] : ["zh-CN"],
      configurable: true,
    });
    Object.defineProperty(navigator, "language", {
      value: locale === "en" ? "en-US" : "zh-CN",
      configurable: true,
    });

    await act(async () => {
      root.render(
        <LocaleProvider key={locale}>
          <DeskActionBar {...props} />
        </LocaleProvider>,
      );
    });
  }

  it("renders teacher extra_lesson only when hand is <= 4, matching canonical names and dispatching skillId", async () => {
    const dispatchGameAction = vi.fn();

    // 1. Teacher with hand > 4 (e.g. 10 cards): extra_lesson is NOT legal, must NOT appear in UI
    const fullHandTeacherGame = createTeacherGame(10);
    expect(fullHandTeacherGame.players[0].hand).toHaveLength(10);
    expect(
      getLegalCharacterSkillActions(fullHandTeacherGame, "player_1").some(
        (action) => action.skillId === "extra_lesson",
      ),
    ).toBe(false);

    await renderDeskActionBar({
      dispatchGameAction,
      game: fullHandTeacherGame,
      playerControllers: ["human", "ai"],
    }, "zh-CN");
    expect(findSkillButton(container, "extra_lesson")).toBeUndefined();
    expect(publicButtons(container).some((btn) => /补课|加课/u.test(btn.textContent ?? ""))).toBe(false);

    await renderDeskActionBar({
      dispatchGameAction,
      game: fullHandTeacherGame,
      playerControllers: ["human", "ai"],
    }, "en");
    expect(findSkillButton(container, "extra_lesson")).toBeUndefined();
    expect(publicButtons(container).some((btn) => /Extra Lesson/u.test(btn.textContent ?? ""))).toBe(false);

    // 2. Teacher with hand <= 4 (4 cards): extra_lesson is legal and must appear
    const teacherGame = createTeacherGame(4);
    expect(teacherGame.players[0].hand).toHaveLength(4);
    const legalActions = getLegalCharacterSkillActions(teacherGame, "player_1");
    expect(legalActions).toContainEqual<ActivateCharacterSkillAction>({
      playerId: "player_1",
      skillId: "extra_lesson",
      type: "ACTIVATE_CHARACTER_SKILL",
    });

    // Test Chinese display: canonical name is "补课" (getSkillDisplayName), NEVER "加课"
    await renderDeskActionBar({
      dispatchGameAction,
      game: teacherGame,
      playerControllers: ["human", "ai"],
    }, "zh-CN");
    const teacherBtnZh = findSkillButton(container, "extra_lesson");
    expect(teacherBtnZh).toBeDefined();
    expect(teacherBtnZh?.disabled).toBe(false);
    const expectedLabelZh = `发动${getSkillDisplayName("extra_lesson", "zh-CN")}`;
    expect(expectedLabelZh).toBe("发动补课");
    expect(teacherBtnZh?.textContent).toBe(expectedLabelZh);
    expect(teacherBtnZh?.textContent).not.toContain("加课");
    expect(publicButtons(container).length).toBeLessThanOrEqual(3);

    // Test English display: "Activate Extra Lesson"
    await renderDeskActionBar({
      dispatchGameAction,
      game: teacherGame,
      playerControllers: ["human", "ai"],
    }, "en");
    const teacherBtnEn = findSkillButton(container, "extra_lesson");
    expect(teacherBtnEn).toBeDefined();
    expect(teacherBtnEn?.disabled).toBe(false);
    const expectedLabelEn = `Activate ${getSkillDisplayName("extra_lesson", "en")}`;
    expect(expectedLabelEn).toBe("Activate Extra Lesson");
    expect(teacherBtnEn?.textContent).toBe(expectedLabelEn);

    // Click dispatches exact skill action
    await act(async () => {
      teacherBtnEn?.click();
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      playerId: "player_1",
      skillId: "extra_lesson",
      type: "ACTIVATE_CHARACTER_SKILL",
    });

    // 3. Card selected: skill slot remains, <= 3 buttons, DIY does not squeeze out skill
    dispatchGameAction.mockClear();
    const selectedCardId = teacherGame.players[0].hand[0];
    await renderDeskActionBar({
      dispatchGameAction,
      game: teacherGame,
      playerControllers: ["human", "ai"],
      selectedCardId,
    }, "zh-CN");

    const selectedSkillBtn = findSkillButton(container, "extra_lesson");
    expect(selectedSkillBtn).toBeDefined();
    expect(publicButtons(container).length).toBeLessThanOrEqual(3);
    const labelsAfterSelect = publicButtons(container).map((btn) => btn.textContent ?? "");
    expect(labelsAfterSelect.some((label) => /进入主动 DIY|Active DIY/u.test(label))).toBe(false);

    await act(async () => {
      selectedSkillBtn?.click();
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      playerId: "player_1",
      skillId: "extra_lesson",
      type: "ACTIVATE_CHARACTER_SKILL",
    });
  });

  it("renders CEO emergency_supply with canonical '紧急调货' in zh-CN and 'Emergency Supply' in en", async () => {
    const dispatchGameAction = vi.fn();

    // CEO with 14 cards (capital reserve full hand): emergency_supply is not legal
    const fullHandCeoGame = createCeoGame(14);
    expect(fullHandCeoGame.players[0].hand).toHaveLength(14);
    expect(
      getLegalCharacterSkillActions(fullHandCeoGame, "player_1").some(
        (action) => action.skillId === "emergency_supply",
      ),
    ).toBe(false);
    await renderDeskActionBar({
      dispatchGameAction,
      game: fullHandCeoGame,
      playerControllers: ["human", "ai"],
    }, "zh-CN");
    expect(findSkillButton(container, "emergency_supply")).toBeUndefined();

    // CEO with hand <= 4: emergency_supply is legal
    const ceoGame = createCeoGame(4);
    expect(ceoGame.players[0].hand).toHaveLength(4);
    const legalActions = getLegalCharacterSkillActions(ceoGame, "player_1");
    expect(legalActions).toContainEqual<ActivateCharacterSkillAction>({
      playerId: "player_1",
      skillId: "emergency_supply",
      type: "ACTIVATE_CHARACTER_SKILL",
    });

    // Chinese: canonical name is "紧急调货" (getSkillDisplayName), NEVER "应急调货"
    await renderDeskActionBar({
      dispatchGameAction,
      game: ceoGame,
      playerControllers: ["human", "ai"],
    }, "zh-CN");
    const ceoBtnZh = findSkillButton(container, "emergency_supply");
    expect(ceoBtnZh).toBeDefined();
    expect(ceoBtnZh?.disabled).toBe(false);
    const expectedLabelZh = `发动${getSkillDisplayName("emergency_supply", "zh-CN")}`;
    expect(expectedLabelZh).toBe("发动紧急调货");
    expect(ceoBtnZh?.textContent).toBe(expectedLabelZh);
    expect(ceoBtnZh?.textContent).not.toContain("应急调货");
    expect(publicButtons(container).length).toBeLessThanOrEqual(3);

    // English: "Activate Emergency Supply"
    await renderDeskActionBar({
      dispatchGameAction,
      game: ceoGame,
      playerControllers: ["human", "ai"],
    }, "en");
    const ceoBtnEn = findSkillButton(container, "emergency_supply");
    expect(ceoBtnEn).toBeDefined();
    expect(ceoBtnEn?.disabled).toBe(false);
    const expectedLabelEn = `Activate ${getSkillDisplayName("emergency_supply", "en")}`;
    expect(expectedLabelEn).toBe("Activate Emergency Supply");
    expect(ceoBtnEn?.textContent).toBe(expectedLabelEn);

    // Click dispatches exact skillId
    await act(async () => {
      ceoBtnEn?.click();
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      playerId: "player_1",
      skillId: "emergency_supply",
      type: "ACTIVATE_CHARACTER_SKILL",
    });

    // Card selected: skill slot remains, <= 3 buttons, DIY does not squeeze out skill
    dispatchGameAction.mockClear();
    const selectedCardId = ceoGame.players[0].hand[0];
    await renderDeskActionBar({
      dispatchGameAction,
      game: ceoGame,
      playerControllers: ["human", "ai"],
      selectedCardId,
    }, "zh-CN");
    const selectedCeoBtn = findSkillButton(container, "emergency_supply");
    expect(selectedCeoBtn).toBeDefined();
    expect(publicButtons(container).length).toBeLessThanOrEqual(3);
    const labelsAfterSelect = publicButtons(container).map((btn) => btn.textContent ?? "");
    expect(labelsAfterSelect.some((label) => /进入主动 DIY|Active DIY/u.test(label))).toBe(false);
    expect(labelsAfterSelect.some((label) => /结束本次行动|End Action/u.test(label))).toBe(true);

    await act(async () => {
      selectedCeoBtn?.click();
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      playerId: "player_1",
      skillId: "emergency_supply",
      type: "ACTIVATE_CHARACTER_SKILL",
    });
  });

  it("renders engine-legal main-action skills for captain, director, and secretary unselected", async () => {
    const dispatchGameAction = vi.fn();

    // Captain
    const captainGame = createCaptainGame();
    const alkaliId = findInstanceId(captainGame, "substance_naoh_dilute");
    const captainLegal = getLegalCharacterSkillActions(captainGame, "player_1");
    expect(captainLegal).toContainEqual<ActivateCharacterSkillAction>({
      cardInstanceId: alkaliId,
      playerId: "player_1",
      skillId: "alkali_recovery",
      type: "ACTIVATE_CHARACTER_SKILL",
    });

    await renderDeskActionBar({
      dispatchGameAction,
      game: captainGame,
      playerControllers: ["human", "ai"],
    }, "zh-CN");
    const captainBtnZh = findSkillButton(container, "alkali_recovery");
    expect(captainBtnZh).toBeDefined();
    expect(captainBtnZh?.textContent).toBe(`发动${getSkillDisplayName("alkali_recovery", "zh-CN")}`);
    expect(publicButtons(container).length).toBeLessThanOrEqual(3);

    await renderDeskActionBar({
      dispatchGameAction,
      game: captainGame,
      playerControllers: ["human", "ai"],
    }, "en");
    const captainBtnEn = findSkillButton(container, "alkali_recovery");
    expect(captainBtnEn).toBeDefined();
    expect(captainBtnEn?.textContent).toBe(`Activate ${getSkillDisplayName("alkali_recovery", "en")}`);

    await act(async () => {
      captainBtnEn?.click();
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      cardInstanceId: alkaliId,
      playerId: "player_1",
      skillId: "alkali_recovery",
      type: "ACTIVATE_CHARACTER_SKILL",
    });

    // Director
    dispatchGameAction.mockClear();
    const directorGame = createDirectorGame();
    const directorLegal = getLegalCharacterSkillActions(directorGame, "player_1");
    expect(directorLegal).toContainEqual<ActivateCharacterSkillAction>({
      playerId: "player_1",
      skillId: "exhaust_discharge",
      targetPlayerId: "player_2",
      type: "ACTIVATE_CHARACTER_SKILL",
    });

    await renderDeskActionBar({
      dispatchGameAction,
      game: directorGame,
      playerControllers: ["human", "ai"],
    }, "zh-CN");
    const directorBtnZh = findSkillButton(container, "exhaust_discharge");
    expect(directorBtnZh).toBeDefined();
    expect(directorBtnZh?.textContent).toBe(`发动${getSkillDisplayName("exhaust_discharge", "zh-CN")}`);
    expect(publicButtons(container).length).toBeLessThanOrEqual(3);

    await renderDeskActionBar({
      dispatchGameAction,
      game: directorGame,
      playerControllers: ["human", "ai"],
    }, "en");
    const directorBtnEn = findSkillButton(container, "exhaust_discharge");
    expect(directorBtnEn).toBeDefined();
    expect(directorBtnEn?.textContent).toBe(`Activate ${getSkillDisplayName("exhaust_discharge", "en")}`);

    await act(async () => {
      directorBtnEn?.click();
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      playerId: "player_1",
      skillId: "exhaust_discharge",
      targetPlayerId: "player_2",
      type: "ACTIVATE_CHARACTER_SKILL",
    });

    // Secretary
    dispatchGameAction.mockClear();
    const secretaryGame = createSecretaryGame();
    const secretaryLegal = getLegalCharacterSkillActions(secretaryGame, "player_1");
    expect(secretaryLegal).toHaveLength(3);
    expect(secretaryLegal.map((a) => a.skillId)).toEqual([
      "exhaust_leak",
      "lab_fire",
      "exothermic_accident",
    ]);

    await renderDeskActionBar({
      dispatchGameAction,
      game: secretaryGame,
      playerControllers: ["human", "ai"],
    }, "zh-CN");
    const secBtnsZh = skillButtons(container);
    expect(secBtnsZh).toHaveLength(3);
    expect(publicButtons(container).length).toBeLessThanOrEqual(3);
    for (const skillId of ["exhaust_leak", "lab_fire", "exothermic_accident"] as const) {
      const btn = findSkillButton(container, skillId);
      expect(btn).toBeDefined();
      expect(btn?.textContent).toBe(`发动${getSkillDisplayName(skillId, "zh-CN")}`);
    }

    await renderDeskActionBar({
      dispatchGameAction,
      game: secretaryGame,
      playerControllers: ["human", "ai"],
    }, "en");
    const secBtnsEn = skillButtons(container);
    expect(secBtnsEn).toHaveLength(3);
    for (const skillId of ["exhaust_leak", "lab_fire", "exothermic_accident"] as const) {
      const btn = findSkillButton(container, skillId);
      expect(btn).toBeDefined();
      expect(btn?.textContent).toBe(`Activate ${getSkillDisplayName(skillId, "en")}`);
    }

    // Click exhaust_leak
    await act(async () => {
      findSkillButton(container, "exhaust_leak")?.click();
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      playerId: "player_1",
      skillId: "exhaust_leak",
      type: "ACTIVATE_CHARACTER_SKILL",
    });

    // Click lab_fire
    dispatchGameAction.mockClear();
    await act(async () => {
      findSkillButton(container, "lab_fire")?.click();
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      playerId: "player_1",
      skillId: "lab_fire",
      type: "ACTIVATE_CHARACTER_SKILL",
    });

    // Click exothermic_accident
    dispatchGameAction.mockClear();
    await act(async () => {
      findSkillButton(container, "exothermic_accident")?.click();
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      playerId: "player_1",
      skillId: "exothermic_accident",
      type: "ACTIVATE_CHARACTER_SKILL",
    });
  });

  it("keeps alkali recovery when a hand card is selected and binds the selected strong alkali", async () => {
    const dispatchGameAction = vi.fn();
    const game = createCaptainGame();
    const alkaliId = findInstanceId(game, "substance_naoh_dilute");
    const otherCardId = game.players[0].hand.find((id) => id !== alkaliId);
    expect(otherCardId).toBeDefined();

    // Selecting non-alkali card keeps alkali recovery bound to available alkali in hand
    await renderDeskActionBar({
      dispatchGameAction,
      game,
      playerControllers: ["human", "ai"],
      selectedCardId: otherCardId,
    }, "zh-CN");

    const skillAfterSelect = findSkillButton(container, "alkali_recovery");
    expect(skillAfterSelect).toBeDefined();
    expect(publicButtons(container).length).toBeLessThanOrEqual(3);

    await act(async () => {
      skillAfterSelect?.click();
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      cardInstanceId: alkaliId,
      playerId: "player_1",
      skillId: "alkali_recovery",
      type: "ACTIVATE_CHARACTER_SKILL",
    });

    // Selecting the alkali card binds directly to it
    dispatchGameAction.mockClear();
    await renderDeskActionBar({
      dispatchGameAction,
      game,
      playerControllers: ["human", "ai"],
      selectedCardId: alkaliId,
    }, "zh-CN");

    const boundButton = findSkillButton(container, "alkali_recovery");
    expect(boundButton).toBeDefined();
    expect(publicButtons(container).length).toBeLessThanOrEqual(3);

    await act(async () => {
      boundButton?.click();
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      cardInstanceId: alkaliId,
      playerId: "player_1",
      skillId: "alkali_recovery",
      type: "ACTIVATE_CHARACTER_SKILL",
    });
  });

  it("trims secretary skills to fit 3-button budget when a card is selected, preserving at least 1 skill slot", async () => {
    const dispatchGameAction = vi.fn();
    const secretaryGame = createSecretaryGame();
    const selectedCardId = secretaryGame.players[0].hand[0];

    await renderDeskActionBar({
      dispatchGameAction,
      game: secretaryGame,
      playerControllers: ["human", "ai"],
      selectedCardId,
    }, "zh-CN");

    const buttons = publicButtons(container);
    expect(buttons.length).toBeLessThanOrEqual(3);

    // Play card button takes 1 slot
    const playButtons = buttons.filter((btn) => !btn.hasAttribute("data-skill-id"));
    expect(playButtons.length).toBeGreaterThanOrEqual(1);

    // Secretary has 3 skills, but 3-button budget trims the 3rd.
    // Invariant: at least 1 skill slot must remain, total <= 3, and NOT all 3 need to be present.
    const activeSkills = skillButtons(container);
    expect(activeSkills.length).toBeGreaterThanOrEqual(1);
    expect(activeSkills.length).toBeLessThanOrEqual(2);
    expect(activeSkills.length).toBeLessThan(3);

    // Clicking visible skill dispatches valid engine action
    const visibleSkill = activeSkills[0];
    const skillId = visibleSkill.getAttribute("data-skill-id");
    expect(skillId).toBeDefined();

    await act(async () => {
      visibleSkill.click();
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      playerId: "player_1",
      skillId,
      type: "ACTIVATE_CHARACTER_SKILL",
    });
  });

  it("keeps every secretary skill, PASS, and DIY reachable when the three primary slots are full", async () => {
    const dispatchGameAction = vi.fn();
    const onEnterDiy = vi.fn();
    const game = createSecretaryGame();
    const legalSkills = getLegalCharacterSkillActions(game, "player_1");
    expect(legalSkills.map((action) => action.skillId)).toEqual([
      "exhaust_leak",
      "lab_fire",
      "exothermic_accident",
    ]);

    await renderDeskActionBar({
      dispatchGameAction,
      game,
      playerControllers: ["human", "ai"],
      onEnterDiy,
    });

    expect(publicButtons(container)).toHaveLength(3);
    expect(skillButtons(container)).toHaveLength(3);
    const menu = await openOverflowMenu(container);
    expect(menu).not.toBeNull();
    const trigger = container.querySelector<HTMLButtonElement>(
      'button[data-testid="desk-action-menu-trigger"]',
    );
    await act(async () => {
      trigger?.click();
    });
    expect(findOverflowMenu(container)).toBeNull();
    await openOverflowMenu(container);
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    });
    expect(findOverflowMenu(container)).toBeNull();
    await openOverflowMenu(container);
    await act(async () => {
      document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    expect(findOverflowMenu(container)).toBeNull();

    const reopenedMenu = await openOverflowMenu(container);
    const menuItems = Array.from(reopenedMenu?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
    const passButton = menuItems.find((button) => /结束本次行动/u.test(button.textContent ?? ""));
    const diyButton = menuItems.find((button) => /进入主动 DIY/u.test(button.textContent ?? ""));
    expect(passButton).toBeDefined();
    expect(diyButton).toBeDefined();
    await act(async () => {
      passButton?.click();
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      playerId: "player_1",
      type: "PASS_ACTION",
    });
    expect(findOverflowMenu(container)).toBeNull();

    await openOverflowMenu(container);
    const currentDiyButton = Array.from(
      findOverflowMenu(container)?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
    ).find((button) => /进入主动 DIY/u.test(button.textContent ?? ""));
    await act(async () => {
      currentDiyButton?.click();
    });
    expect(onEnterDiy).toHaveBeenCalledOnce();
  });

  it("keeps each legal card-bound alkali recovery action reachable and identifies its card", async () => {
    const dispatchGameAction = vi.fn();
    const base = createCaptainGame();
    const alkaliIds = [
      findInstanceId(base, "substance_naoh_dilute"),
      findInstanceId(base, "substance_koh_dilute"),
      findInstanceId(base, "substance_caoh2_limewater"),
    ];
    const game = withPlayerHand(base, "player_1", alkaliIds);
    const legalActions = getLegalCharacterSkillActions(game, "player_1").filter(
      (action) => action.skillId === "alkali_recovery" && "cardInstanceId" in action,
    );
    const legalCardIds = legalActions.map((action) =>
      "cardInstanceId" in action ? action.cardInstanceId : "",
    );
    expect(alkaliIds.every((id) => legalCardIds.includes(id))).toBe(true);

    const selectedCardId = game.players[0].hand.find((id) => !legalCardIds.includes(id));
    expect(selectedCardId).toBeDefined();
    await renderDeskActionBar({
      dispatchGameAction,
      game,
      playerControllers: ["human", "ai"],
      selectedCardId,
    });

    const menu = await openOverflowMenu(container);
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>(
      'button[data-skill-id="alkali_recovery"][data-skill-card-id]',
    ));
    const reachableIds = buttons.map((button) => button.dataset.skillCardId);
    expect(legalCardIds.every((id) => reachableIds.includes(id))).toBe(true);

    const primaryCardId = buttons.find((button) => !menu?.contains(button))?.dataset.skillCardId;
    const selectedVariantId = legalCardIds.find((id) => id !== primaryCardId);
    expect(selectedVariantId).toBeDefined();
    await renderDeskActionBar({
      dispatchGameAction,
      game,
      playerControllers: ["human", "ai"],
      selectedCardId: selectedVariantId,
    });
    const updatedMenu = findOverflowMenu(container);
    expect(updatedMenu).not.toBeNull();
    const selectedVariantButton = container.querySelector<HTMLButtonElement>(
      `button[data-skill-id="alkali_recovery"][data-skill-card-id="${selectedVariantId}"]`,
    );
    expect(selectedVariantButton).toBeDefined();
    expect(updatedMenu?.contains(selectedVariantButton!)).toBe(false);

    const updatedButtons = Array.from(container.querySelectorAll<HTMLButtonElement>(
      'button[data-skill-id="alkali_recovery"][data-skill-card-id]',
    ));
    const overflowVariant = updatedButtons.find(
      (button) => updatedMenu?.contains(button) && button.dataset.skillCardId !== selectedVariantId,
    );
    expect(overflowVariant).toBeDefined();
    const overflowCardId = overflowVariant?.dataset.skillCardId;
    const cardDefinition = overflowCardId
      ? cardDefinitionsById.get(game.cardInstances[overflowCardId].definitionId)
      : undefined;
    expect(overflowVariant?.textContent).toContain(getOptionalCardDisplayName(cardDefinition, "zh-CN"));

    await act(async () => {
      overflowVariant?.click();
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      cardInstanceId: overflowCardId,
      playerId: "player_1",
      skillId: "alkali_recovery",
      type: "ACTIVATE_CHARACTER_SKILL",
    });
    expect(findOverflowMenu(container)).toBeNull();
  });

  it("keeps both legal actions for a selected card reachable when its effect and reference play are both valid", async () => {
    const dispatchGameAction = vi.fn();
    const game = createSecretaryGame();
    const hclId = findInstanceId(game, "substance_hcl_dilute");
    const handGame = withPlayerHand(game, "player_1", [hclId]);

    await renderDeskActionBar({
      dispatchGameAction,
      game: handGame,
      playerControllers: ["human", "ai"],
      selectedCardId: hclId,
    });

    const effectButton = publicButtons(container).find((button) => /执行效果/u.test(button.textContent ?? ""));
    expect(effectButton).toBeDefined();
    await act(async () => {
      effectButton?.click();
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      cardInstanceId: hclId,
      playerId: "player_1",
      targetPlayerId: "player_2",
      type: "PLAY_CARD",
    });
    dispatchGameAction.mockClear();

    expect(publicButtons(container).some((button) => /执行效果/u.test(button.textContent ?? ""))).toBe(true);
    expect(publicButtons(container).some((button) => /普通出牌/u.test(button.textContent ?? ""))).toBe(false);
    const menu = await openOverflowMenu(container);
    const referencePlay = Array.from(
      menu?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
    ).find((button) => /普通出牌/u.test(button.textContent ?? ""));
    expect(referencePlay).toBeDefined();

    await act(async () => {
      referencePlay?.click();
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      cardInstanceId: hclId,
      playerId: "player_1",
      type: "PLAY_REFERENCE_CARD",
    });
  });

  it("excludes spent skills, spent DIY, invalid unowned card choices, and AI actions", async () => {
    const dispatchGameAction = vi.fn();
    const base = createSecretaryGame();
    const exhausted: GameState = {
      ...base,
      players: base.players.map((player) => player.id === "player_1"
        ? {
            ...player,
            usedDIYThisCycle: true,
            characterUsage: {
              ...player.characterUsage,
              perCycle: {
                ...player.characterUsage.perCycle,
                clumsy_party_secretary_shared_active: 1,
              },
            },
          }
        : player),
    };
    expect(getLegalCharacterSkillActions(exhausted, "player_1")).toEqual([]);
    await renderDeskActionBar({
      dispatchGameAction,
      game: exhausted,
      playerControllers: ["human", "ai"],
    });
    expect(skillButtons(container)).toHaveLength(0);
    expect(publicButtons(container).some((button) => /主动 DIY/u.test(button.textContent ?? ""))).toBe(false);
    expect(container.querySelector('[data-testid="desk-action-menu-trigger"]')).toBeNull();

    const unownedCardId = base.players[1].hand[0];
    await renderDeskActionBar({
      dispatchGameAction,
      game: base,
      playerControllers: ["human", "ai"],
      selectedCardId: unownedCardId,
    });
    expect(publicButtons(container).some((button) => /不可出牌/u.test(button.textContent ?? ""))).toBe(true);
    const invalidMenu = await openOverflowMenu(container);
    expect(Array.from(invalidMenu?.querySelectorAll('[role="menuitem"]') ?? []).some(
      (item) => /执行效果|普通出牌/u.test(item.textContent ?? ""),
    )).toBe(false);
    expect(dispatchGameAction).not.toHaveBeenCalled();

    await renderDeskActionBar({
      dispatchGameAction,
      game: base,
      playerControllers: ["ai", "human"],
      selectedCardId: base.players[0].hand[0],
    });
    expect(container.querySelector('[data-testid="desk-action-menu-trigger"]')).toBeNull();
    expect(publicButtons(container).every((button) => button.disabled)).toBe(true);
    expect(skillButtons(container)).toHaveLength(0);
    expect(dispatchGameAction).not.toHaveBeenCalled();
  });

  it("preserves skill slot and <= 3 buttons for all active skill characters after card selection without DIY crowding out", async () => {
    const dispatchGameAction = vi.fn();

    const activeCases = [
      { name: "Teacher", game: createTeacherGame(4), skillId: "extra_lesson" },
      { name: "CEO", game: createCeoGame(4), skillId: "emergency_supply" },
      { name: "Captain", game: createCaptainGame(), skillId: "alkali_recovery" },
      { name: "Director", game: createDirectorGame(), skillId: "exhaust_discharge" },
    ];

    for (const testCase of activeCases) {
      const selectedCardId = testCase.game.players[0].hand[0];
      await renderDeskActionBar({
        dispatchGameAction,
        game: testCase.game,
        playerControllers: ["human", "ai"],
        selectedCardId,
      }, "zh-CN");

      const buttons = publicButtons(container);
      expect(buttons.length, `${testCase.name} button count`).toBeLessThanOrEqual(3);

      const skillBtn = findSkillButton(container, testCase.skillId);
      expect(skillBtn, `${testCase.name} skill button`).toBeDefined();

      const labels = buttons.map((b) => b.textContent ?? "");
      expect(
        labels.some((l) => /进入主动 DIY|Active DIY/u.test(l)),
        `${testCase.name} DIY should not crowd out skill`,
      ).toBe(false);
    }
  });

  it("does not show a main-action skill button for enthusiast or acid king in zh-CN and en", async () => {
    const dispatchGameAction = vi.fn();

    const activeSkillIds = [
      "extra_lesson",
      "emergency_supply",
      "alkali_recovery",
      "exhaust_discharge",
      "exhaust_leak",
      "lab_fire",
      "exothermic_accident",
    ] as const;

    for (const characterId of ["chemistry_enthusiast", "acid_king"] as const) {
      const opponentId = characterId === "acid_king" ? "chemistry_enthusiast" : "acid_king";
      const game = createMainActionGame([characterId, opponentId]);
      expect(game.phase).toBe("mainAction");
      expect(getLegalCharacterSkillActions(game, "player_1")).toEqual([]);

      const characterSkills = getCharacterDefinition(characterId).skills;

      for (const locale of ["zh-CN", "en"] as const) {
        await renderDeskActionBar({
          dispatchGameAction,
          game,
          playerControllers: ["human", "ai"],
        }, locale);

        // No skill button by data attribute
        expect(skillButtons(container)).toHaveLength(0);

        // No button with skill activation text prefix
        expect(
          publicButtons(container).some((button) =>
            /^(?:发动|Activate )/u.test(button.textContent ?? ""),
          ),
        ).toBe(false);

        // Assert neither their own skills nor any active desk skills appear as skill buttons
        for (const skill of characterSkills) {
          expect(findSkillButton(container, skill.id)).toBeUndefined();
          const canonicalName = getSkillDisplayName(skill.id, locale);
          const activationLabel = locale === "en" ? `Activate ${canonicalName}` : `发动${canonicalName}`;
          expect(
            publicButtons(container).some((button) =>
              button.textContent?.includes(activationLabel),
            ),
          ).toBe(false);
        }

        for (const skillId of activeSkillIds) {
          expect(findSkillButton(container, skillId)).toBeUndefined();
          const canonicalName = getSkillDisplayName(skillId, locale);
          const activationLabel = locale === "en" ? `Activate ${canonicalName}` : `发动${canonicalName}`;
          expect(
            publicButtons(container).some((button) =>
              button.textContent?.includes(activationLabel),
            ),
          ).toBe(false);
        }
      }
    }
  });

  it("does not render a clickable metal counterattack button on the official desk", async () => {
    const dispatchGameAction = vi.fn();
    const game = createCounterattackGame();

    await renderDeskActionBar({
      dispatchGameAction,
      game,
      playerControllers: ["human", "human"],
      selectedCardId: game.players[0].hand[0],
    }, "zh-CN");

    const metalButtons = publicButtons(container).filter((button) =>
      /金属反击|Metal Counterattack/u.test(button.textContent ?? ""),
    );
    expect(metalButtons).toHaveLength(0);
    expect(
      publicButtons(container).some(
        (button) => button.disabled === false && /金属/u.test(button.textContent ?? ""),
      ),
    ).toBe(false);
    expect(dispatchGameAction).not.toHaveBeenCalled();
  });

  it("fails if teacher or CEO skills are blacklisted or omit canonical Chinese names", async () => {
    // 1. Verify getSkillDisplayName authority mapping against characterDefinitions
    const teacherDef = getCharacterDefinition("laboratory_teacher");
    const teacherSkillDef = teacherDef.skills.find((s) => s.id === "extra_lesson");
    expect(teacherSkillDef?.name).toBe("补课");
    expect(getSkillDisplayName("extra_lesson", "zh-CN")).toBe("补课");
    expect(getSkillDisplayName("extra_lesson", "zh-CN")).not.toBe("加课");

    const ceoDef = getCharacterDefinition("chemical_factory_ceo");
    const ceoSkillDef = ceoDef.skills.find((s) => s.id === "emergency_supply");
    expect(ceoSkillDef?.name).toBe("紧急调货");
    expect(getSkillDisplayName("emergency_supply", "zh-CN")).toBe("紧急调货");
    expect(getSkillDisplayName("emergency_supply", "zh-CN")).not.toBe("应急调货");

    // 2. Both teacher extra_lesson and CEO emergency_supply must be present when legal (not blocked)
    const teacherGame = createTeacherGame(4);
    const ceoGame = createCeoGame(4);
    const dispatchGameAction = vi.fn();

    await renderDeskActionBar({
      dispatchGameAction,
      game: teacherGame,
      playerControllers: ["human", "ai"],
    }, "zh-CN");
    const teacherBtn = findSkillButton(container, "extra_lesson");
    expect(teacherBtn).toBeDefined();
    expect(teacherBtn?.textContent).toBe("发动补课");
    expect(teacherBtn?.textContent).not.toContain("加课");

    await renderDeskActionBar({
      dispatchGameAction,
      game: ceoGame,
      playerControllers: ["human", "ai"],
    }, "zh-CN");
    const ceoBtn = findSkillButton(container, "emergency_supply");
    expect(ceoBtn).toBeDefined();
    expect(ceoBtn?.textContent).toBe("发动紧急调货");
    expect(ceoBtn?.textContent).not.toContain("应急调货");
  });

  describe("official desk overflow menu keyboard accessibility", () => {
    type OverflowMenuItems = Parameters<typeof DeskActionOverflowMenu>[0]["items"];

    function getTrigger(): HTMLButtonElement | null {
      return container.querySelector<HTMLButtonElement>(
        'button[data-testid="desk-action-menu-trigger"]',
      );
    }

    function getAllMenuItems(): HTMLButtonElement[] {
      return Array.from(
        findOverflowMenu(container)?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
      );
    }

    function getEnabledMenuItems(): HTMLButtonElement[] {
      return Array.from(
        findOverflowMenu(container)?.querySelectorAll<HTMLButtonElement>(
          '[role="menuitem"]:not(:disabled)',
        ) ?? [],
      );
    }

    async function keyDown(
      target: Element,
      key: string,
      options: { shiftKey?: boolean } = {},
    ): Promise<void> {
      await act(async () => {
        target.dispatchEvent(new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key,
          shiftKey: options.shiftKey ?? false,
        }));
      });
    }

    async function pressEscape(): Promise<void> {
      await act(async () => {
        document.dispatchEvent(new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: "Escape",
        }));
      });
    }

    async function focusElement(element: Element): Promise<void> {
      await act(async () => {
        (element as HTMLElement).focus();
      });
    }

    async function dispatchKeyDown(
      target: Element,
      key: string,
      options: { repeat?: boolean; shiftKey?: boolean } = {},
    ): Promise<KeyboardEvent> {
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key,
        repeat: options.repeat ?? false,
        shiftKey: options.shiftKey ?? false,
      });
      await act(async () => {
        target.dispatchEvent(event);
      });
      return event;
    }

    async function dispatchKeyUp(
      target: Element,
      key: string,
    ): Promise<KeyboardEvent> {
      const event = new KeyboardEvent("keyup", {
        bubbles: true,
        cancelable: true,
        key,
      });
      await act(async () => {
        target.dispatchEvent(event);
      });
      return event;
    }

    async function dispatchKeyboardClick(target: EventTarget): Promise<void> {
      await act(async () => {
        target.dispatchEvent(new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          detail: 0,
        }));
      });
    }

    async function dispatchPointerClick(target: EventTarget): Promise<void> {
      await act(async () => {
        target.dispatchEvent(new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          detail: 1,
        }));
      });
    }

    async function renderOverflowMenu(items: OverflowMenuItems): Promise<void> {
      await act(async () => {
        root.render(<DeskActionOverflowMenu isEnglish={false} items={items} />);
      });
    }

    async function renderSecretary(
      dispatchGameAction: DeskActionBarProps["dispatchGameAction"],
      onEnterDiy?: () => void,
    ): Promise<void> {
      await renderDeskActionBar({
        dispatchGameAction,
        game: createSecretaryGame(),
        playerControllers: ["human", "ai"],
        onEnterDiy,
      });
    }

    it("opens from Enter and moves real focus to the first enabled item exactly once", async () => {
      const dispatchGameAction = vi.fn();
      await renderSecretary(dispatchGameAction);
      const trigger = getTrigger();
      expect(trigger).not.toBeNull();
      expect(trigger?.getAttribute("aria-expanded")).toBe("false");
      expect(trigger?.getAttribute("aria-haspopup")).toBe("menu");

      trigger?.focus();
      await keyDown(trigger!, "Enter");

      const menu = findOverflowMenu(container);
      expect(menu).not.toBeNull();
      expect(container.querySelectorAll('[role="menu"]')).toHaveLength(1);
      expect(trigger?.getAttribute("aria-expanded")).toBe("true");
      expect(trigger?.getAttribute("aria-controls")).toBe(menu?.id);
      expect(trigger).not.toBe(document.activeElement);

      const enabledItems = getEnabledMenuItems();
      expect(enabledItems).toHaveLength(2);
      expect(document.activeElement).toBe(enabledItems[0]);
      expect(enabledItems[0]?.textContent).toBe("结束本次行动");
      expect(dispatchGameAction).not.toHaveBeenCalled();
    });

    it("opens from Space and moves real focus to the first enabled item exactly once", async () => {
      const dispatchGameAction = vi.fn();
      await renderSecretary(dispatchGameAction);
      const trigger = getTrigger()!;
      trigger.focus();
      await keyDown(trigger, " ");

      expect(container.querySelectorAll('[role="menu"]')).toHaveLength(1);
      const enabledItems = getEnabledMenuItems();
      expect(document.activeElement).toBe(enabledItems[0]);
      expect(enabledItems[0]?.textContent).toBe("结束本次行动");
      expect(dispatchGameAction).not.toHaveBeenCalled();
    });

    it("opens with ArrowDown on the trigger and focuses the first enabled item", async () => {
      const dispatchGameAction = vi.fn();
      await renderSecretary(dispatchGameAction);
      const trigger = getTrigger()!;
      trigger.focus();
      await keyDown(trigger, "ArrowDown");

      const enabledItems = getEnabledMenuItems();
      expect(findOverflowMenu(container)).not.toBeNull();
      expect(document.activeElement).toBe(enabledItems[0]);
      expect(enabledItems[0]?.textContent).toBe("结束本次行动");
      expect(dispatchGameAction).not.toHaveBeenCalled();
    });

    it("opens with ArrowUp on the trigger and focuses the last enabled item", async () => {
      const dispatchGameAction = vi.fn();
      await renderSecretary(dispatchGameAction);
      const trigger = getTrigger()!;
      trigger.focus();
      await keyDown(trigger, "ArrowUp");

      const enabledItems = getEnabledMenuItems();
      expect(findOverflowMenu(container)).not.toBeNull();
      expect(document.activeElement).toBe(enabledItems[enabledItems.length - 1]);
      expect(enabledItems[enabledItems.length - 1]?.textContent).toBe("进入主动 DIY");
      expect(dispatchGameAction).not.toHaveBeenCalled();
    });

    it("cycles ArrowUp/ArrowDown and honours Home/End inside the menu", async () => {
      const dispatchGameAction = vi.fn();
      await renderSecretary(dispatchGameAction);
      const trigger = getTrigger()!;
      trigger.focus();
      await keyDown(trigger, "ArrowDown");

      let enabledItems = getEnabledMenuItems();
      expect(enabledItems[0]?.textContent).toBe("结束本次行动");
      expect(enabledItems[1]?.textContent).toBe("进入主动 DIY");

      await keyDown(document.activeElement!, "ArrowDown");
      expect(document.activeElement).toBe(enabledItems[1]);
      await keyDown(document.activeElement!, "ArrowDown");
      expect(document.activeElement).toBe(enabledItems[0]);
      await keyDown(document.activeElement!, "ArrowUp");
      expect(document.activeElement).toBe(enabledItems[1]);
      await keyDown(document.activeElement!, "Home");
      expect(document.activeElement).toBe(enabledItems[0]);
      await keyDown(document.activeElement!, "End");
      expect(document.activeElement).toBe(enabledItems[1]);
      expect(dispatchGameAction).not.toHaveBeenCalled();
    });

    it("skips disabled items during every keyboard navigation path", async () => {
      const items: OverflowMenuItems = [
        { key: "alpha", kind: "play", label: "Alpha", onSelect: vi.fn() },
        { key: "beta", disabled: true, kind: "play", label: "Beta", onSelect: vi.fn() },
        { key: "gamma", kind: "end", label: "Gamma", onSelect: vi.fn() },
      ];
      await act(async () => {
        root.render(<DeskActionOverflowMenu isEnglish={false} items={items} />);
      });
      const trigger = getTrigger()!;
      trigger.focus();
      await keyDown(trigger, "ArrowDown");

      const menu = findOverflowMenu(container);
      expect(menu).not.toBeNull();
      const itemsInDom = getAllMenuItems();
      expect(itemsInDom).toHaveLength(3);
      expect(itemsInDom[1]?.disabled).toBe(true);
      const enabledItems = getEnabledMenuItems();
      expect(enabledItems).toHaveLength(2);
      expect(document.activeElement).toBe(enabledItems[0]);
      expect(document.activeElement?.textContent).toBe("Alpha");

      await keyDown(document.activeElement!, "ArrowDown");
      expect(document.activeElement?.textContent).toBe("Gamma");
      await keyDown(document.activeElement!, "ArrowUp");
      expect(document.activeElement?.textContent).toBe("Alpha");
      await keyDown(document.activeElement!, "End");
      expect(document.activeElement?.textContent).toBe("Gamma");
      await keyDown(document.activeElement!, "Home");
      expect(document.activeElement?.textContent).toBe("Alpha");
    });

    it("keeps the menu reachable when every item is disabled", async () => {
      const items: OverflowMenuItems = [
        { key: "alpha", disabled: true, kind: "play", label: "Alpha", onSelect: vi.fn() },
        { key: "beta", disabled: true, kind: "end", label: "Beta", onSelect: vi.fn() },
      ];
      await act(async () => {
        root.render(<DeskActionOverflowMenu isEnglish={false} items={items} />);
      });
      const trigger = getTrigger()!;
      trigger.focus();
      await keyDown(trigger, "ArrowDown");

      expect(findOverflowMenu(container)).not.toBeNull();
      expect(document.activeElement).toBe(findOverflowMenu(container));
      await keyDown(document.activeElement!, "ArrowDown");
      expect(document.activeElement).toBe(findOverflowMenu(container));
      await pressEscape();
      expect(findOverflowMenu(container)).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it("closes on Escape and restores focus to the trigger", async () => {
      const dispatchGameAction = vi.fn();
      await renderSecretary(dispatchGameAction);
      const trigger = getTrigger()!;
      trigger.focus();
      await keyDown(trigger, "Enter");
      expect(getEnabledMenuItems()[0]).toBe(document.activeElement);

      await pressEscape();
      expect(findOverflowMenu(container)).toBeNull();
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(document.activeElement).toBe(trigger);
      expect(dispatchGameAction).not.toHaveBeenCalled();
    });

    it("closes after Tab or Shift+Tab leaves the menu without pulling focus back to the trigger", async () => {
      const dispatchGameAction = vi.fn();
      await renderSecretary(dispatchGameAction);
      const trigger = getTrigger()!;
      const beforeButton = document.createElement("button");
      beforeButton.textContent = "before overflow";
      const afterButton = document.createElement("button");
      afterButton.textContent = "after overflow";
      container.before(beforeButton);
      container.after(afterButton);

      try {
        trigger.focus();
        await keyDown(trigger, "Enter");
        let enabledItems = getEnabledMenuItems();
        expect(document.activeElement).toBe(enabledItems[0]);
        await dispatchKeyUp(document.activeElement!, "Enter");

        await keyDown(document.activeElement!, "Tab");
        await focusElement(enabledItems[1]!);
        expect(findOverflowMenu(container)).not.toBeNull();

        await keyDown(document.activeElement!, "Tab");
        await focusElement(afterButton);
        expect(findOverflowMenu(container)).toBeNull();
        expect(document.activeElement).toBe(afterButton);
        expect(document.activeElement).not.toBe(trigger);

        trigger.focus();
        await keyDown(trigger, "Enter");
        expect(document.activeElement).toBe(getEnabledMenuItems()[0]);
        await dispatchKeyUp(document.activeElement!, "Enter");
        await keyDown(document.activeElement!, "Tab", { shiftKey: true });
        await focusElement(trigger);
        expect(findOverflowMenu(container)).not.toBeNull();

        await keyDown(document.activeElement!, "Tab", { shiftKey: true });
        await focusElement(beforeButton);
        expect(findOverflowMenu(container)).toBeNull();
        expect(document.activeElement).toBe(beforeButton);
        expect(dispatchGameAction).not.toHaveBeenCalled();
      } finally {
        beforeButton.remove();
        afterButton.remove();
      }
    });

    it("dispatches the selected action, closes the menu, and returns focus to the trigger", async () => {
      const dispatchGameAction = vi.fn();
      const onEnterDiy = vi.fn();
      await renderSecretary(dispatchGameAction, onEnterDiy);
      const trigger = getTrigger()!;
      trigger.focus();
      await keyDown(trigger, "Enter");
      const passItem = getEnabledMenuItems().find(
        (item) => item.textContent === "结束本次行动",
      )!;
      await dispatchKeyUp(document.activeElement!, "Enter");

      await act(async () => {
        passItem.click();
      });
      expect(dispatchGameAction).toHaveBeenCalledWith({
        playerId: "player_1",
        type: "PASS_ACTION",
      });
      expect(findOverflowMenu(container)).toBeNull();
      expect(document.activeElement).toBe(trigger);

      await keyDown(trigger, "Enter");
      const diyItem = getEnabledMenuItems().find(
        (item) => item.textContent === "进入主动 DIY",
      )!;
      await dispatchKeyUp(document.activeElement!, "Enter");
      await act(async () => {
        diyItem.click();
      });
      expect(onEnterDiy).toHaveBeenCalledOnce();
      expect(findOverflowMenu(container)).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it("keeps control when legal overflow items change while the menu is open", async () => {
      const dispatchGameAction = vi.fn();
      const game = createSecretaryGame();
      await renderDeskActionBar({
        dispatchGameAction,
        game,
        playerControllers: ["human", "ai"],
      });
      const trigger = getTrigger()!;
      trigger.focus();
      await keyDown(trigger, "ArrowDown");
      expect(getEnabledMenuItems()).toHaveLength(2);

      const gameWithoutDiy = {
        ...game,
        players: game.players.map((player) =>
          player.id === "player_1" ? { ...player, usedDIYThisCycle: true } : player,
        ),
      };
      await renderDeskActionBar({
        dispatchGameAction,
        game: gameWithoutDiy,
        playerControllers: ["human", "ai"],
      });

      expect(findOverflowMenu(container)).not.toBeNull();
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      const remainingItems = getEnabledMenuItems();
      expect(remainingItems).toHaveLength(1);
      expect(remainingItems[0]?.textContent).toBe("结束本次行动");

      await pressEscape();
      expect(findOverflowMenu(container)).toBeNull();
      expect(document.activeElement).toBe(trigger);
      expect(dispatchGameAction).not.toHaveBeenCalled();
    });

    it("unmounts the open menu without errors when the action bar switches phase", async () => {
      const dispatchGameAction = vi.fn();
      const game = createSecretaryGame();
      await renderDeskActionBar({
        dispatchGameAction,
        game,
        playerControllers: ["human", "ai"],
      });
      const trigger = getTrigger()!;
      trigger.focus();
      await keyDown(trigger, "Enter");
      expect(findOverflowMenu(container)).not.toBeNull();

      await renderDeskActionBar({
        dispatchGameAction,
        game: { ...game, phase: "gameOver" },
        playerControllers: ["human", "ai"],
      });
      expect(getTrigger()).toBeNull();
      expect(findOverflowMenu(container)).toBeNull();

      await pressEscape();
      await act(async () => {
        document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      });
      expect(findOverflowMenu(container)).toBeNull();
    });

    it("keeps focus on the trigger for pointer activation while keyboard navigation still works", async () => {
      const dispatchGameAction = vi.fn();
      await renderSecretary(dispatchGameAction);
      const trigger = getTrigger()!;
      trigger.focus();

      await act(async () => {
        trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }));
        trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
      });
      expect(findOverflowMenu(container)).not.toBeNull();
      expect(document.activeElement).toBe(trigger);
      expect(dispatchGameAction).not.toHaveBeenCalled();

      await keyDown(trigger, "ArrowDown");
      expect(document.activeElement).toBe(getEnabledMenuItems()[0]);
    });

    it("ignores Enter auto-repeat for the whole key hold and activates exactly once after release", async () => {
      const dispatchGameAction = vi.fn();
      await renderSecretary(dispatchGameAction);
      const trigger = getTrigger()!;
      trigger.focus();

      await dispatchKeyDown(trigger, "Enter");
      const endActionItem = getEnabledMenuItems()[0]!;
      expect(findOverflowMenu(container)).not.toBeNull();
      expect(document.activeElement).toBe(endActionItem);
      expect(dispatchGameAction).not.toHaveBeenCalled();

      for (let repeat = 0; repeat < 3; repeat += 1) {
        const repeatEvent = await dispatchKeyDown(document.activeElement!, "Enter", {
          repeat: true,
        });
        expect(repeatEvent.defaultPrevented).toBe(true);
        expect(findOverflowMenu(container)).not.toBeNull();
        expect(document.activeElement).toBe(endActionItem);
        expect(dispatchGameAction).not.toHaveBeenCalled();
      }

      // Chromium synthesizes this click from an Enter keydown; a held key must never dispatch it.
      await dispatchKeyboardClick(endActionItem);
      expect(findOverflowMenu(container)).not.toBeNull();
      expect(dispatchGameAction).not.toHaveBeenCalled();

      const keyUpEvent = await dispatchKeyUp(endActionItem, "Enter");
      expect(keyUpEvent.defaultPrevented).toBe(true);
      expect(dispatchGameAction).not.toHaveBeenCalled();
      expect(findOverflowMenu(container)).not.toBeNull();

      const freshKeyDown = await dispatchKeyDown(endActionItem, "Enter");
      expect(freshKeyDown.defaultPrevented).toBe(false);
      await dispatchKeyboardClick(endActionItem);
      expect(dispatchGameAction).toHaveBeenCalledTimes(1);
      expect(dispatchGameAction).toHaveBeenCalledWith({
        playerId: "player_1",
        type: "PASS_ACTION",
      });
      expect(findOverflowMenu(container)).toBeNull();
      expect(document.activeElement).toBe(trigger);

      const interactionsAfterActivation = dispatchGameAction.mock.calls.length;
      await dispatchKeyDown(trigger, "Enter", { repeat: true });
      expect(dispatchGameAction).toHaveBeenCalledTimes(interactionsAfterActivation);
    });

    it("does not reopen or execute from an unreleased Enter after focus returns to the trigger", async () => {
      const dispatchGameAction = vi.fn();
      await renderSecretary(dispatchGameAction);
      const trigger = getTrigger()!;
      trigger.focus();

      await dispatchKeyDown(trigger, "Enter");
      const endActionItem = getEnabledMenuItems()[0]!;
      expect(document.activeElement).toBe(endActionItem);

      // Activate with the pointer while the physical Enter key is still down.
      await dispatchPointerClick(endActionItem);
      expect(dispatchGameAction).toHaveBeenCalledTimes(1);
      expect(findOverflowMenu(container)).toBeNull();
      expect(document.activeElement).toBe(trigger);

      const repeatEvent = await dispatchKeyDown(trigger, "Enter", { repeat: true });
      expect(repeatEvent.defaultPrevented).toBe(true);
      expect(findOverflowMenu(container)).toBeNull();
      expect(dispatchGameAction).toHaveBeenCalledTimes(1);

      await dispatchKeyUp(trigger, "Enter");
      await dispatchKeyDown(trigger, "Enter");
      expect(findOverflowMenu(container)).not.toBeNull();
      expect(dispatchGameAction).toHaveBeenCalledTimes(1);
    });

    it("holds Space through auto-repeat and its keyup default activation, then activates once on a fresh press", async () => {
      const dispatchGameAction = vi.fn();
      await renderSecretary(dispatchGameAction);
      const trigger = getTrigger()!;
      trigger.focus();

      await dispatchKeyDown(trigger, " ");
      const endActionItem = getEnabledMenuItems()[0]!;
      expect(findOverflowMenu(container)).not.toBeNull();
      expect(document.activeElement).toBe(endActionItem);
      expect(dispatchGameAction).not.toHaveBeenCalled();

      const repeatEvent = await dispatchKeyDown(endActionItem, " ", { repeat: true });
      expect(repeatEvent.defaultPrevented).toBe(true);
      expect(dispatchGameAction).not.toHaveBeenCalled();

      const keyUpEvent = await dispatchKeyUp(endActionItem, " ");
      expect(keyUpEvent.defaultPrevented).toBe(true);
      expect(dispatchGameAction).not.toHaveBeenCalled();
      expect(findOverflowMenu(container)).not.toBeNull();
      expect(document.activeElement).toBe(endActionItem);

      const freshKeyDown = await dispatchKeyDown(endActionItem, " ");
      expect(freshKeyDown.defaultPrevented).toBe(false);
      const freshKeyUp = await dispatchKeyUp(endActionItem, " ");
      expect(freshKeyUp.defaultPrevented).toBe(false);
      await dispatchKeyboardClick(endActionItem);
      expect(dispatchGameAction).toHaveBeenCalledTimes(1);
      expect(dispatchGameAction).toHaveBeenCalledWith({
        playerId: "player_1",
        type: "PASS_ACTION",
      });
      expect(findOverflowMenu(container)).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it("moves focus to the first enabled item when the focused item is removed by a props update", async () => {
      const onAlpha = vi.fn();
      const onBeta = vi.fn();
      const onGamma = vi.fn();
      const alpha: OverflowMenuItems[number] = {
        key: "alpha",
        kind: "play",
        label: "Alpha",
        onSelect: onAlpha,
      };
      const beta: OverflowMenuItems[number] = {
        key: "beta",
        kind: "end",
        label: "Beta",
        onSelect: onBeta,
      };
      const gamma: OverflowMenuItems[number] = {
        key: "gamma",
        kind: "diy",
        label: "Gamma",
        onSelect: onGamma,
      };

      await renderOverflowMenu([alpha, beta, gamma]);
      const trigger = getTrigger()!;
      trigger.focus();
      await keyDown(trigger, "ArrowDown");
      await keyDown(document.activeElement!, "ArrowDown");
      expect(document.activeElement?.textContent).toBe("Beta");

      await renderOverflowMenu([alpha, gamma]);

      expect(findOverflowMenu(container)).not.toBeNull();
      expect(document.activeElement).not.toBe(document.body);
      expect(document.activeElement?.textContent).toBe("Alpha");
      expect(findOverflowMenu(container)?.contains(document.activeElement)).toBe(true);
      expect(onAlpha).not.toHaveBeenCalled();
      expect(onBeta).not.toHaveBeenCalled();
      expect(onGamma).not.toHaveBeenCalled();
    });

    it("moves focus to the menu when the focused item becomes disabled and no enabled item can take over", async () => {
      const alpha: OverflowMenuItems[number] = {
        key: "alpha",
        disabled: true,
        kind: "play",
        label: "Alpha",
        onSelect: vi.fn(),
      };
      const beta: OverflowMenuItems[number] = {
        key: "beta",
        kind: "end",
        label: "Beta",
        onSelect: vi.fn(),
      };

      await renderOverflowMenu([alpha, beta]);
      const trigger = getTrigger()!;
      trigger.focus();
      await keyDown(trigger, "ArrowDown");
      expect(document.activeElement?.textContent).toBe("Beta");

      await renderOverflowMenu([alpha, { ...beta, disabled: true }]);

      const menu = findOverflowMenu(container);
      expect(menu).not.toBeNull();
      expect(document.activeElement).not.toBe(document.body);
      expect(document.activeElement).toBe(menu);
      expect(getEnabledMenuItems()).toHaveLength(0);
    });

    it("moves focus to the menu when the focused item is removed and every remaining item is disabled", async () => {
      const alpha: OverflowMenuItems[number] = {
        key: "alpha",
        kind: "play",
        label: "Alpha",
        onSelect: vi.fn(),
      };
      const beta: OverflowMenuItems[number] = {
        key: "beta",
        kind: "end",
        label: "Beta",
        onSelect: vi.fn(),
      };
      const gamma: OverflowMenuItems[number] = {
        key: "gamma",
        kind: "diy",
        label: "Gamma",
        onSelect: vi.fn(),
      };

      await renderOverflowMenu([alpha, beta, gamma]);
      const trigger = getTrigger()!;
      trigger.focus();
      await keyDown(trigger, "ArrowDown");
      await keyDown(document.activeElement!, "ArrowDown");
      expect(document.activeElement?.textContent).toBe("Beta");

      await renderOverflowMenu([{ ...alpha, disabled: true }, { ...gamma, disabled: true }]);

      const menu = findOverflowMenu(container);
      expect(menu).not.toBeNull();
      expect(document.activeElement).toBe(menu);
      expect(getEnabledMenuItems()).toHaveLength(0);
    });

    it("closes the menu and restores the trigger when every item is removed", async () => {
      const alpha: OverflowMenuItems[number] = {
        key: "alpha",
        kind: "play",
        label: "Alpha",
        onSelect: vi.fn(),
      };
      const beta: OverflowMenuItems[number] = {
        key: "beta",
        kind: "end",
        label: "Beta",
        onSelect: vi.fn(),
      };

      await renderOverflowMenu([alpha, beta]);
      const trigger = getTrigger()!;
      trigger.focus();
      await keyDown(trigger, "ArrowDown");
      await keyDown(document.activeElement!, "ArrowDown");
      expect(document.activeElement?.textContent).toBe("Beta");

      await renderOverflowMenu([]);

      expect(findOverflowMenu(container)).toBeNull();
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(document.activeElement).toBe(trigger);
    });

    it("does not steal focus the user moved outside before the items update", async () => {
      const alpha: OverflowMenuItems[number] = {
        key: "alpha",
        kind: "play",
        label: "Alpha",
        onSelect: vi.fn(),
      };
      const beta: OverflowMenuItems[number] = {
        key: "beta",
        kind: "end",
        label: "Beta",
        onSelect: vi.fn(),
      };
      const external = document.createElement("button");
      external.textContent = "external";
      document.body.append(external);

      try {
        await renderOverflowMenu([alpha, beta]);
        const trigger = getTrigger()!;
        trigger.focus();
        await keyDown(trigger, "ArrowDown");
        expect(document.activeElement?.textContent).toBe("Alpha");

        await focusElement(external);
        expect(document.activeElement).toBe(external);
        expect(findOverflowMenu(container)).toBeNull();

        await renderOverflowMenu([beta]);
        expect(document.activeElement).toBe(external);
        expect(findOverflowMenu(container)).toBeNull();
      } finally {
        external.remove();
      }
    });

    it("keeps focus on the trigger for pointer activation when the item list updates", async () => {
      const alpha: OverflowMenuItems[number] = {
        key: "alpha",
        kind: "play",
        label: "Alpha",
        onSelect: vi.fn(),
      };
      const beta: OverflowMenuItems[number] = {
        key: "beta",
        kind: "end",
        label: "Beta",
        onSelect: vi.fn(),
      };

      await renderOverflowMenu([alpha, beta]);
      const trigger = getTrigger()!;
      trigger.focus();
      await act(async () => {
        trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }));
        trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
      });
      expect(document.activeElement).toBe(trigger);

      await renderOverflowMenu([alpha]);
      expect(document.activeElement).toBe(trigger);
      expect(findOverflowMenu(container)).not.toBeNull();
    });

    it("prevents page scrolling for menu navigation keys when no item can take focus", async () => {
      const alpha: OverflowMenuItems[number] = {
        key: "alpha",
        disabled: true,
        kind: "play",
        label: "Alpha",
        onSelect: vi.fn(),
      };
      const beta: OverflowMenuItems[number] = {
        key: "beta",
        disabled: true,
        kind: "end",
        label: "Beta",
        onSelect: vi.fn(),
      };

      await renderOverflowMenu([alpha, beta]);
      const trigger = getTrigger()!;
      trigger.focus();
      await keyDown(trigger, "ArrowDown");
      const menu = findOverflowMenu(container)!;
      expect(document.activeElement).toBe(menu);

      for (const key of ["ArrowDown", "ArrowUp", "Home", "End"]) {
        const navigationEvent = await dispatchKeyDown(menu, key);
        expect(navigationEvent.defaultPrevented, key).toBe(true);
        expect(document.activeElement, key).toBe(menu);
      }
    });

    it("prevents page scrolling for Home and End when a pointer-opened menu keeps focus on the trigger", async () => {
      const alpha: OverflowMenuItems[number] = {
        key: "alpha",
        disabled: true,
        kind: "play",
        label: "Alpha",
        onSelect: vi.fn(),
      };
      const beta: OverflowMenuItems[number] = {
        key: "beta",
        disabled: true,
        kind: "end",
        label: "Beta",
        onSelect: vi.fn(),
      };

      await renderOverflowMenu([alpha, beta]);
      const trigger = getTrigger()!;
      trigger.focus();
      await act(async () => {
        trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }));
        trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
      });
      expect(findOverflowMenu(container)).not.toBeNull();
      expect(document.activeElement).toBe(trigger);

      const homeEvent = await dispatchKeyDown(trigger, "Home");
      expect(homeEvent.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(findOverflowMenu(container));

      const endEvent = await dispatchKeyDown(document.activeElement!, "End");
      expect(endEvent.defaultPrevented).toBe(true);
      expect(getEnabledMenuItems()).toHaveLength(0);
    });

    it("does not prevent the page scroll default outside the menu", async () => {
      const alpha: OverflowMenuItems[number] = {
        key: "alpha",
        kind: "play",
        label: "Alpha",
        onSelect: vi.fn(),
      };
      const external = document.createElement("button");
      external.textContent = "external";
      document.body.append(external);

      try {
        await renderOverflowMenu([alpha]);
        const trigger = getTrigger()!;
        trigger.focus();
        await keyDown(trigger, "ArrowDown");
        expect(findOverflowMenu(container)).not.toBeNull();

        for (const key of ["ArrowDown", "ArrowUp", "Home", "End"]) {
          const outsideEvent = await dispatchKeyDown(external, key);
          expect(outsideEvent.defaultPrevented, key).toBe(false);
        }
      } finally {
        external.remove();
      }
    });
  });
});
