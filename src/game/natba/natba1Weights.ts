export type NATBA1Weights = {
  readonly finiteActions: {
    readonly passAction: number;
    readonly passResponse: number;
    readonly passStatusHandling: number;
    readonly playReferenceCard: number;

    readonly response: {
      readonly base: number;
      readonly carbonateBonus: number;
      readonly ionBonus: number;
      readonly otherBonus: number;
      readonly lowHpBonus: number;
    };

    readonly handleStatus: {
      readonly base: number;
      readonly extinguishH2oCo2Bonus: number;
      readonly ionOhBonus: number;
      readonly lowHpBonus: number;
    };

    readonly counterattack: {
      readonly recoverBase: number;
      readonly recoverMissingHp2Bonus: number;
      readonly recoverLowHpBonus: number;
      readonly recoverFullHpScore: number;
      readonly pursuitBase: number;
      readonly pursuitLethalBonus: number;
      readonly pursuitFullHpBonus: number;
    };

    readonly playCard: {
      readonly unknownDef: number;
      readonly o2MissingHp2Base: number;
      readonly o2LowHpBonus: number;
      readonly o2MissingHp1Base: number;
      readonly o2FullHpScore: number;
      readonly so2NewBase: number;
      readonly so2LethalBonus: number;
      readonly so2ExistingScore: number;
      readonly attackBase: number;
      readonly opponentLowHp2Bonus: number;
      readonly opponentLowHp4Bonus: number;
      readonly opponentHandEmptyBonus: number;
      readonly opponentHandLow2Bonus: number;
      readonly acidKingStrongAcidBonus: number;
      readonly causticSodaStrongAlkaliBonus: number;
      readonly factoryDirectorH2so4Bonus: number;
    };

    readonly playDiy: {
      readonly fireExtinguishFireScore: number;
      readonly fireExtinguishNoFireScore: number;
      readonly so2NewScore: number;
      readonly so2ExistingScore: number;
      readonly attackBase: number;
      readonly opponentLowHp2Bonus: number;
      readonly opponentHandEmptyBonus: number;
      readonly chemistryEnthusiastBonus: number;
    };

    readonly skills: {
      readonly extraLesson: number;
      readonly emergencySupply: number;
      readonly alkaliRecoveryMissingHp2: number;
      readonly alkaliRecoveryMissingHp1: number;
      readonly alkaliRecoveryFullHp: number;
      readonly exhaustDischargeNewSo2: number;
      readonly exhaustDischargeExistingSo2: number;
      readonly exhaustLeakBase: number;
      readonly exhaustLeakLethalBonus: number;
      readonly exothermicAccidentLethal: number;
      readonly exothermicAccidentSelfLethal: number;
      readonly exothermicAccidentNormal: number;
      readonly labFireSelfFire: number;
      readonly labFireHealthyOrLethal: number;
      readonly labFireLowHp: number;
      readonly labFireNormal: number;
      readonly defaultSkill: number;
    };
  };

  readonly prep: {
    readonly baseScore: number;
    readonly strongAcid: number;
    readonly strongAlkali: number;
    readonly substanceO2: number;
    readonly substanceSo2: number;
    readonly ionHOrOh: number;
    readonly carbonate: number;
    readonly fireExtinguish: number;

    readonly charAcidKingBonus: number;
    readonly charCausticSodaBonus: number;
    readonly charFactoryDirectorBonus: number;

    readonly fireExtinguishDup1Penalty: number;
    readonly fireExtinguishDup2Penalty: number;
    readonly o2Dup2Penalty: number;
    readonly so2Dup2Penalty: number;

    readonly ionHSynergy: number;
    readonly ionOhSynergy: number;
    readonly elementSSynergy: number;
    readonly elementOSynergy: number;
  };
};

export const NATBA1_BASE_WEIGHTS: NATBA1Weights = {
  finiteActions: {
    passAction: 10,
    passResponse: 0,
    passStatusHandling: 0,
    playReferenceCard: 5,

    response: {
      base: 160,
      carbonateBonus: 40,
      ionBonus: 25,
      otherBonus: 5,
      lowHpBonus: 80,
    },

    handleStatus: {
      base: 190,
      extinguishH2oCo2Bonus: 35,
      ionOhBonus: 25,
      lowHpBonus: 80,
    },

    counterattack: {
      recoverBase: 150,
      recoverMissingHp2Bonus: 40,
      recoverLowHpBonus: 60,
      recoverFullHpScore: 0,
      pursuitBase: 180,
      pursuitLethalBonus: 70,
      pursuitFullHpBonus: 30,
    },

    playCard: {
      unknownDef: 40,
      o2MissingHp2Base: 130,
      o2LowHpBonus: 50,
      o2MissingHp1Base: 70,
      o2FullHpScore: 0,
      so2NewBase: 120,
      so2LethalBonus: 30,
      so2ExistingScore: 20,
      attackBase: 115,
      opponentLowHp2Bonus: 80,
      opponentLowHp4Bonus: 40,
      opponentHandEmptyBonus: 40,
      opponentHandLow2Bonus: 20,
      acidKingStrongAcidBonus: 80,
      causticSodaStrongAlkaliBonus: 40,
      factoryDirectorH2so4Bonus: 35,
    },

    playDiy: {
      fireExtinguishFireScore: 180,
      fireExtinguishNoFireScore: 0,
      so2NewScore: 125,
      so2ExistingScore: 20,
      attackBase: 135,
      opponentLowHp2Bonus: 80,
      opponentHandEmptyBonus: 35,
      chemistryEnthusiastBonus: 60,
    },

    skills: {
      extraLesson: 160,
      emergencySupply: 160,
      alkaliRecoveryMissingHp2: 130,
      alkaliRecoveryMissingHp1: 80,
      alkaliRecoveryFullHp: 10,
      exhaustDischargeNewSo2: 125,
      exhaustDischargeExistingSo2: 25,
      exhaustLeakBase: 135,
      exhaustLeakLethalBonus: 60,
      exothermicAccidentLethal: 300,
      exothermicAccidentSelfLethal: -100,
      exothermicAccidentNormal: 140,
      labFireSelfFire: 110,
      labFireHealthyOrLethal: 100,
      labFireLowHp: -30,
      labFireNormal: 75,
      defaultSkill: 60,
    },
  },

  prep: {
    baseScore: 35,
    strongAcid: 130,
    strongAlkali: 125,
    substanceO2: 95,
    substanceSo2: 90,
    ionHOrOh: 80,
    carbonate: 70,
    fireExtinguish: 55,

    charAcidKingBonus: 35,
    charCausticSodaBonus: 35,
    charFactoryDirectorBonus: 30,

    fireExtinguishDup1Penalty: 25,
    fireExtinguishDup2Penalty: 60,
    o2Dup2Penalty: 40,
    so2Dup2Penalty: 50,

    ionHSynergy: 25,
    ionOhSynergy: 25,
    elementSSynergy: 20,
    elementOSynergy: 15,
  },
};

function cloneNATBA1Weights(weights: NATBA1Weights): NATBA1Weights {
  return {
    finiteActions: {
      passAction: weights.finiteActions.passAction,
      passResponse: weights.finiteActions.passResponse,
      passStatusHandling: weights.finiteActions.passStatusHandling,
      playReferenceCard: weights.finiteActions.playReferenceCard,
      response: { ...weights.finiteActions.response },
      handleStatus: { ...weights.finiteActions.handleStatus },
      counterattack: { ...weights.finiteActions.counterattack },
      playCard: { ...weights.finiteActions.playCard },
      playDiy: { ...weights.finiteActions.playDiy },
      skills: { ...weights.finiteActions.skills },
    },
    prep: { ...weights.prep },
  };
}

const natba1xWeightDraft = cloneNATBA1Weights(NATBA1_BASE_WEIGHTS);

export const NATBA1X_TUNED_WEIGHTS: NATBA1Weights = {
  finiteActions: {
    ...natba1xWeightDraft.finiteActions,
    counterattack: {
      ...natba1xWeightDraft.finiteActions.counterattack,
      pursuitLethalBonus: 85,
    },
    playCard: {
      ...natba1xWeightDraft.finiteActions.playCard,
      opponentLowHp2Bonus: 95,
      opponentHandEmptyBonus: 45,
    },
    skills: {
      ...natba1xWeightDraft.finiteActions.skills,
      exothermicAccidentLethal: 350,
      exhaustLeakLethalBonus: 70,
    },
  },
  prep: natba1xWeightDraft.prep,
};
