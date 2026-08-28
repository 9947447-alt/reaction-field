import type { RandomSource } from "../../shared/random";
import { cardDefinitionsById } from "../data/cardDefinitions";
import type { GameAction } from "../engine/actions";
import type { AIObservation, AIObservationOpponent } from "../engine/aiObservation";
import type { DecisionContext } from "../engine/decisionContext";
import type { CardDefinition, CardInstanceId, CharacterId } from "../engine/types";
import {
  NATBA1_BASE_WEIGHTS,
  NATBA1X_TUNED_WEIGHTS,
  type NATBA1Weights,
} from "./natba1Weights";
import type { NATBAPolicy } from "./types";

function getCardDefinition(
  cardInstanceId: CardInstanceId | undefined,
  observation: AIObservation,
): CardDefinition | undefined {
  if (!cardInstanceId) {
    return undefined;
  }
  const selfHandIndex = observation.self.hand.indexOf(cardInstanceId);
  if (selfHandIndex !== -1 && observation.self.handCards[selfHandIndex]) {
    return observation.self.handCards[selfHandIndex];
  }
  const discardCard = observation.discardPileCards.find(
    (card) => card.cardInstanceId === cardInstanceId,
  );
  if (discardCard) {
    return discardCard.definition;
  }
  if (cardDefinitionsById.has(cardInstanceId)) {
    return cardDefinitionsById.get(cardInstanceId);
  }
  const lastUnderscore = cardInstanceId.lastIndexOf("_");
  if (lastUnderscore !== -1) {
    const candidateDefId = cardInstanceId.slice(0, lastUnderscore);
    if (cardDefinitionsById.has(candidateDefId)) {
      return cardDefinitionsById.get(candidateDefId);
    }
  }
  return undefined;
}

export function scoreFiniteAction(
  action: GameAction,
  observation: AIObservation,
  weights: NATBA1Weights = NATBA1_BASE_WEIGHTS,
): number {
  const self = observation.self;
  const opponents = observation.opponents;
  const primaryOpponent: AIObservationOpponent | undefined =
    opponents.find((op) => op.playerId !== self.playerId && !op.eliminated) ??
    opponents[0];

  const opponentHp = primaryOpponent ? primaryOpponent.hp : 10;
  const opponentHandCount = primaryOpponent ? primaryOpponent.handCount : 0;
  const opponentHasSo2 = primaryOpponent
    ? primaryOpponent.statuses.some((s) => s.statusId === "SO2_LEAK")
    : false;
  const selfHasFire = self.statuses.some((s) => s.statusId === "FIRE");
  const missingHp = Math.max(0, self.maxHp - self.hp);
  const w = weights.finiteActions;

  switch (action.type) {
    case "PASS_ACTION": {
      return w.passAction;
    }

    case "PASS_RESPONSE": {
      return w.passResponse;
    }

    case "PASS_STATUS_HANDLING": {
      return w.passStatusHandling;
    }

    case "RESPOND_WITH_CARD": {
      let score = w.response.base;
      const def = getCardDefinition(action.cardInstanceId, observation);
      if (def) {
        if (def.id === "substance_na2co3" || def.id === "ion_co3") {
          score += w.response.carbonateBonus;
        } else if (def.type === "ion") {
          score += w.response.ionBonus;
        } else {
          score += w.response.otherBonus;
        }
      }
      if (self.hp <= 3) {
        score += w.response.lowHpBonus;
      }
      return score;
    }

    case "HANDLE_STATUS_WITH_CARD": {
      let score = w.handleStatus.base;
      const def = getCardDefinition(action.cardInstanceId, observation);
      if (def) {
        if (def.id === "substance_h2o" || def.id === "substance_co2") {
          score += w.handleStatus.extinguishH2oCo2Bonus;
        } else if (def.id === "ion_oh") {
          score += w.handleStatus.ionOhBonus;
        }
      }
      if (self.hp <= 4) {
        score += w.handleStatus.lowHpBonus;
      }
      return score;
    }

    case "RESOLVE_EXPERIMENT_COUNTERATTACK": {
      if (action.option === "recover") {
        let score = w.counterattack.recoverBase;
        if (missingHp >= 2) {
          score += w.counterattack.recoverMissingHp2Bonus;
        }
        if (self.hp <= 3) {
          score += w.counterattack.recoverLowHpBonus;
        }
        if (self.hp === self.maxHp) {
          score = w.counterattack.recoverFullHpScore;
        }
        return score;
      }
      if (action.option === "acid-base-pursuit") {
        let score = w.counterattack.pursuitBase;
        if (opponentHp <= 2) {
          score += w.counterattack.pursuitLethalBonus;
        }
        if (self.hp === self.maxHp) {
          score += w.counterattack.pursuitFullHpBonus;
        }
        return score;
      }
      return 0;
    }

    case "PLAY_CARD": {
      const def = getCardDefinition(action.cardInstanceId, observation);
      if (!def) {
        return w.playCard.unknownDef;
      }

      if (def.id === "substance_o2" || action.targetPlayerId === self.playerId) {
        if (missingHp >= 2) {
          return (
            w.playCard.o2MissingHp2Base +
            (self.hp <= 3 ? w.playCard.o2LowHpBonus : 0)
          );
        }
        if (missingHp === 1) {
          return w.playCard.o2MissingHp1Base;
        }
        return w.playCard.o2FullHpScore;
      }

      if (def.id === "substance_so2") {
        if (!opponentHasSo2) {
          return (
            w.playCard.so2NewBase +
            (opponentHp <= 3 ? w.playCard.so2LethalBonus : 0)
          );
        }
        return w.playCard.so2ExistingScore;
      }

      let score = w.playCard.attackBase;
      if (opponentHp <= 2) {
        score += w.playCard.opponentLowHp2Bonus;
      } else if (opponentHp <= 4) {
        score += w.playCard.opponentLowHp4Bonus;
      }

      if (opponentHandCount === 0) {
        score += w.playCard.opponentHandEmptyBonus;
      } else if (opponentHandCount <= 2) {
        score += w.playCard.opponentHandLow2Bonus;
      }

      if (self.characterId === "acid_king" && def.tags.includes("strong-acid")) {
        score += w.playCard.acidKingStrongAcidBonus;
      } else if (
        self.characterId === "caustic_soda_captain" &&
        def.tags.includes("strong-alkali")
      ) {
        score += w.playCard.causticSodaStrongAlkaliBonus;
      } else if (
        self.characterId === "sulfuric_acid_factory_director" &&
        def.id === "substance_h2so4_dilute"
      ) {
        score += w.playCard.factoryDirectorH2so4Bonus;
      }

      return score;
    }

    case "PLAY_REFERENCE_CARD": {
      return w.playReferenceCard;
    }

    case "PLAY_DIY_SELECTION": {
      const compDefs = action.componentCardInstanceIds
        .map((id) => getCardDefinition(id, observation))
        .filter((d): d is CardDefinition => Boolean(d));

      const hasC = compDefs.some((d) => d.id === "element_c");
      const hasO = compDefs.some((d) => d.id === "element_o");
      const hasS = compDefs.some((d) => d.id === "element_s");
      const hasH = compDefs.some((d) => d.id === "ion_h");
      const hasOH = compDefs.some((d) => d.id === "ion_oh");

      if ((hasC && hasO) || (hasH && hasOH && !action.targetPlayerId)) {
        if (selfHasFire) {
          return w.playDiy.fireExtinguishFireScore;
        }
        return w.playDiy.fireExtinguishNoFireScore;
      }

      if (hasS && hasO) {
        if (!opponentHasSo2) {
          return w.playDiy.so2NewScore;
        }
        return w.playDiy.so2ExistingScore;
      }

      let score = w.playDiy.attackBase;
      if (opponentHp <= 2) {
        score += w.playDiy.opponentLowHp2Bonus;
      }
      if (opponentHandCount === 0) {
        score += w.playDiy.opponentHandEmptyBonus;
      }
      if (self.characterId === "chemistry_enthusiast" && !self.usedDIYThisCycle) {
        score += w.playDiy.chemistryEnthusiastBonus;
      }
      return score;
    }

    case "ACTIVATE_CHARACTER_SKILL": {
      switch (action.skillId) {
        case "extra_lesson":
          return w.skills.extraLesson;
        case "emergency_supply":
          return w.skills.emergencySupply;

        case "alkali_recovery":
          if (missingHp >= 2) {
            return w.skills.alkaliRecoveryMissingHp2;
          }
          if (missingHp === 1) {
            return w.skills.alkaliRecoveryMissingHp1;
          }
          return w.skills.alkaliRecoveryFullHp;

        case "exhaust_discharge":
          if (!opponentHasSo2) {
            return w.skills.exhaustDischargeNewSo2;
          }
          return w.skills.exhaustDischargeExistingSo2;

        case "exhaust_leak":
          return (
            w.skills.exhaustLeakBase +
            (opponentHp <= 2 ? w.skills.exhaustLeakLethalBonus : 0)
          );

        case "exothermic_accident":
          if (opponentHp <= 1) {
            return w.skills.exothermicAccidentLethal;
          }
          if (self.hp <= 1 && opponentHp > 1) {
            return w.skills.exothermicAccidentSelfLethal;
          }
          return w.skills.exothermicAccidentNormal;

        case "lab_fire":
          if (selfHasFire) {
            return w.skills.labFireSelfFire;
          }
          if (self.hp >= 6 || opponentHp <= 3) {
            return w.skills.labFireHealthyOrLethal;
          }
          if (self.hp <= 3) {
            return w.skills.labFireLowHp;
          }
          return w.skills.labFireNormal;

        default:
          return w.skills.defaultSkill;
      }
    }

    default:
      return 0;
  }
}

export function evaluateCandidateCard(
  def: CardDefinition,
  alreadyKept: readonly CardDefinition[],
  selfCharacterId: CharacterId,
  weights: NATBA1Weights = NATBA1_BASE_WEIGHTS,
): number {
  const p = weights.prep;
  let score = p.baseScore;

  if (def.tags.includes("strong-acid")) {
    score = p.strongAcid;
  } else if (def.tags.includes("strong-alkali")) {
    score = p.strongAlkali;
  } else if (def.id === "substance_o2") {
    score = p.substanceO2;
  } else if (def.id === "substance_so2") {
    score = p.substanceSo2;
  } else if (def.id === "ion_h" || def.id === "ion_oh") {
    score = p.ionHOrOh;
  } else if (def.tags.includes("carbonate")) {
    score = p.carbonate;
  } else if (def.tags.includes("fire-extinguish")) {
    score = p.fireExtinguish;
  }

  if (
    selfCharacterId === "acid_king" &&
    (def.tags.includes("acid") || def.id === "ion_h")
  ) {
    score += p.charAcidKingBonus;
  } else if (
    selfCharacterId === "caustic_soda_captain" &&
    (def.tags.includes("base") || def.id === "ion_oh")
  ) {
    score += p.charCausticSodaBonus;
  } else if (
    selfCharacterId === "sulfuric_acid_factory_director" &&
    (def.id === "substance_h2so4_dilute" || def.id === "ion_so4")
  ) {
    score += p.charFactoryDirectorBonus;
  }

  const sameDefCount = alreadyKept.filter((k) => k.id === def.id).length;
  const sameTypeExtinguishCount = alreadyKept.filter((k) =>
    k.tags.includes("fire-extinguish"),
  ).length;

  if (def.tags.includes("fire-extinguish")) {
    if (sameTypeExtinguishCount === 1) {
      score -= p.fireExtinguishDup1Penalty;
    } else if (sameTypeExtinguishCount >= 2) {
      score -= p.fireExtinguishDup2Penalty;
    }
  }

  if (def.id === "substance_o2" && sameDefCount >= 2) {
    score -= p.o2Dup2Penalty;
  }
  if (def.id === "substance_so2" && sameDefCount >= 2) {
    score -= p.so2Dup2Penalty;
  }

  if (
    def.id === "ion_h" &&
    alreadyKept.some(
      (k) => k.id === "ion_oh" || k.id === "ion_cl" || k.id === "ion_so4",
    )
  ) {
    score += p.ionHSynergy;
  }
  if (
    def.id === "ion_oh" &&
    alreadyKept.some(
      (k) =>
        k.id === "ion_h" ||
        k.id === "ion_na" ||
        k.id === "ion_k" ||
        k.id === "ion_ca",
    )
  ) {
    score += p.ionOhSynergy;
  }
  if (def.id === "element_s" && alreadyKept.some((k) => k.id === "element_o")) {
    score += p.elementSSynergy;
  }
  if (def.id === "element_o" && alreadyKept.some((k) => k.id === "element_s")) {
    score += p.elementOSynergy;
  }

  return score;
}

export function selectLaboratoryPreparationCards(
  candidateCardInstanceIds: readonly CardInstanceId[],
  keepCount: number,
  observation: AIObservation,
  random: RandomSource,
  weights: NATBA1Weights = NATBA1_BASE_WEIGHTS,
): CardInstanceId[] {
  const candidates = [...candidateCardInstanceIds];
  const keptCardInstanceIds: CardInstanceId[] = [];
  const keptDefinitions: CardDefinition[] = [];

  while (keptCardInstanceIds.length < keepCount && candidates.length > 0) {
    let bestScore = Number.NEGATIVE_INFINITY;
    const bestCandidates: number[] = [];

    for (let index = 0; index < candidates.length; index += 1) {
      const cardId = candidates[index];
      const def = getCardDefinition(cardId, observation) ?? {
        id: cardId,
        name: "Unknown",
        type: "substance" as const,
        formula: "Unknown",
        tags: [],
        allowedTimings: [],
        rulesText: "",
      };

      const score = evaluateCandidateCard(
        def,
        keptDefinitions,
        observation.self.characterId,
        weights,
      );
      if (score > bestScore) {
        bestScore = score;
        bestCandidates.length = 0;
        bestCandidates.push(index);
      } else if (score === bestScore) {
        bestCandidates.push(index);
      }
    }

    let bestIndex = 0;
    if (bestCandidates.length > 1) {
      const pick = Math.floor(random() * bestCandidates.length);
      bestIndex = bestCandidates[Math.min(Math.max(0, pick), bestCandidates.length - 1)];
    } else {
      bestIndex = bestCandidates[0] ?? 0;
    }

    const [selectedCardId] = candidates.splice(bestIndex, 1);
    keptCardInstanceIds.push(selectedCardId);
    const selectedDef = getCardDefinition(selectedCardId, observation);
    if (selectedDef) {
      keptDefinitions.push(selectedDef);
    }
  }

  return keptCardInstanceIds;
}

export function createNATBA1Policy(
  weights: NATBA1Weights = NATBA1_BASE_WEIGHTS,
): NATBAPolicy {
  return (
    observation: AIObservation,
    context: DecisionContext,
    random: RandomSource = Math.random,
  ): GameAction | undefined => {
    if (context.kind === "finite-actions") {
      if (context.legalActions.length === 0) {
        return undefined;
      }

      let highestScore = Number.NEGATIVE_INFINITY;
      const bestActions: GameAction[] = [];

      for (const action of context.legalActions) {
        const score = scoreFiniteAction(action, observation, weights);
        if (score > highestScore) {
          highestScore = score;
          bestActions.length = 0;
          bestActions.push(action);
        } else if (score === highestScore) {
          bestActions.push(action);
        }
      }

      if (bestActions.length === 0) {
        return context.legalActions[0];
      }

      if (bestActions.length === 1) {
        return bestActions[0];
      }

      const selectedIndex = Math.floor(random() * bestActions.length);
      const clampedIndex = Math.min(
        Math.max(0, selectedIndex),
        bestActions.length - 1,
      );
      return bestActions[clampedIndex];
    }

    if (context.kind === "laboratory-preparation") {
      const keptCardInstanceIds = selectLaboratoryPreparationCards(
        context.candidateCardInstanceIds,
        context.keepCount,
        observation,
        random,
        weights,
      );

      return {
        type: "CONFIRM_LABORATORY_PREPARATION",
        playerId: context.playerId,
        keptCardInstanceIds,
      };
    }

    return undefined;
  };
}

export const natba1HeuristicPolicy: NATBAPolicy = createNATBA1Policy(
  NATBA1_BASE_WEIGHTS,
);

export const natba1xSelfPlayTunedPolicy: NATBAPolicy = createNATBA1Policy(
  NATBA1X_TUNED_WEIGHTS,
);
