import type { CardInstanceId, GameState } from "../../../game/engine/types";

export const TUTORIAL_SEED = 20260906;

export const TUTORIAL_TARGET_PLAY_CARD_ID: CardInstanceId = "substance_naoh_dilute_02";
export const TUTORIAL_TARGET_RESPONSE_CARD_ID: CardInstanceId = "substance_koh_dilute_02";

export const TUTORIAL_PRESET_PREPARATION_CARD_IDS: readonly CardInstanceId[] = Object.freeze([
  "substance_naoh_dilute_02",
  "element_c_03",
  "substance_hcl_dilute_03",
  "substance_co2_01",
  "ion_cl_04",
  "ion_so4_01",
  "substance_o2_02",
  "element_o_02",
  "substance_koh_dilute_02",
  "substance_caoh2_limewater_02",
]);

export type TutorialStepKey =
  | "PREPARATION"
  | "SELECT_HAND_CARD"
  | "PLAY_REFERENCE_CARD"
  | "AWAIT_AI_ATTACK"
  | "RESPOND_WITH_CARD"
  | "COMPLETED";

export type TutorialStepInfo = Readonly<{
  key: TutorialStepKey;
  stepNumber: number;
  totalSteps: number;
  title: Readonly<{ zh: string; en: string }>;
  instruction: Readonly<{ zh: string; en: string }>;
  targetId: string;
}>;

export const TUTORIAL_STEPS: Record<TutorialStepKey, TutorialStepInfo> = {
  PREPARATION: {
    key: "PREPARATION",
    stepNumber: 1,
    totalSteps: 4,
    title: {
      zh: "步骤 1/4 · 备课阶段",
      en: "Step 1/4 · Preparation",
    },
    instruction: {
      zh: "实验室老师拥有备课特权，可从 20 张候选牌中挑选 10 张手牌。已为您预选好推荐配置，点击【确认备课选择】进入对局。",
      en: "Laboratory Teacher selects 10 cards from 20 candidates. Recommended cards are preset; click [Confirm preparation selection].",
    },
    targetId: "preparation-confirm",
  },
  SELECT_HAND_CARD: {
    key: "SELECT_HAND_CARD",
    stepNumber: 2,
    totalSteps: 4,
    title: {
      zh: "步骤 2/4 · 看手牌与选牌",
      en: "Step 2/4 · Inspect hand & select card",
    },
    instruction: {
      zh: "你的手牌在下方横排展示。点击选中有【碱】属性的手牌【稀 NaOH】将其抬起。",
      en: "Your hand is shown below. Click to select the alkaline card [Dilute NaOH] to lift it up.",
    },
    targetId: `card:${TUTORIAL_TARGET_PLAY_CARD_ID}`,
  },
  PLAY_REFERENCE_CARD: {
    key: "PLAY_REFERENCE_CARD",
    stepNumber: 3,
    totalSteps: 4,
    title: {
      zh: "步骤 3/4 · 普通出牌建立基准",
      en: "Step 3/4 · Play card as table reference",
    },
    instruction: {
      zh: "在右侧主行动面板中，点击高亮的【普通出牌】按钮，将选中的稀 NaOH 打出作为场面基准。",
      en: "In the main action panel on the right, click the highlighted [Play] button to establish dilute NaOH as table reference.",
    },
    targetId: "action:play-reference-card",
  },
  AWAIT_AI_ATTACK: {
    key: "AWAIT_AI_ATTACK",
    stepNumber: 3,
    totalSteps: 4,
    title: {
      zh: "观察对手行动",
      en: "Observing opponent turn",
    },
    instruction: {
      zh: "对手正在思考并行动...",
      en: "Opponent is thinking and taking an action...",
    },
    targetId: "none",
  },
  RESPOND_WITH_CARD: {
    key: "RESPOND_WITH_CARD",
    stepNumber: 4,
    totalSteps: 4,
    title: {
      zh: "步骤 4/4 · 响应酸性伤害",
      en: "Step 4/4 · Respond to acid damage",
    },
    instruction: {
      zh: "对手合成了稀 HCl 对你造成 1 点酸性伤害！在右侧响应面板中，点击高亮的【稀 KOH】进行酸碱中和响应，抵消伤害。",
      en: "Opponent synthesized dilute HCl and dealt 1 acid damage! In the response panel, click highlighted [Dilute KOH] to neutralize and negate damage.",
    },
    targetId: `response:${TUTORIAL_TARGET_RESPONSE_CARD_ID}`,
  },
  COMPLETED: {
    key: "COMPLETED",
    stepNumber: 4,
    totalSteps: 4,
    title: {
      zh: "教学完成！",
      en: "Tutorial completed!",
    },
    instruction: {
      zh: "🎉 恭喜！你成功通过酸碱中和抵消了伤害并生成 H2O。你可以继续体验本局，或点击【进入人机对局】开始全新对局！",
      en: "🎉 Congratulations! You successfully neutralized the damage with acid-base reaction and produced H2O. You can continue or click [Start solo vs AI] for a fresh game!",
    },
    targetId: "none",
  },
};

export function hasRecordedReaction(game: GameState): boolean {
  return game.log.some((entry) => entry.eventKey === "reaction");
}

export function deriveTutorialStep(
  game: GameState,
  selectedCardId?: CardInstanceId,
): TutorialStepKey {
  if (game.phase === "preparationSelection") {
    return "PREPARATION";
  }

  if (game.phase === "responseWindow") {
    if (game.pendingResponse?.responderId === "player_1") {
      return "RESPOND_WITH_CARD";
    }
    return "AWAIT_AI_ATTACK";
  }

  if (hasRecordedReaction(game)) {
    return "COMPLETED";
  }

  if (game.phase === "mainAction") {
    if (game.activePlayerId === "player_1") {
      if (selectedCardId === TUTORIAL_TARGET_PLAY_CARD_ID) {
        return "PLAY_REFERENCE_CARD";
      }
      return "SELECT_HAND_CARD";
    }
    return "AWAIT_AI_ATTACK";
  }

  if (game.phase === "gameOver") {
    return "COMPLETED";
  }

  return "COMPLETED";
}
