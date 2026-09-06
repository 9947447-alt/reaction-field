import { useLocale } from "../../../app/locale";
import {
  TUTORIAL_STEPS,
  type TutorialStepKey,
} from "../tutorial/tutorialScript";

export type CoachBannerProps = Readonly<{
  stepKey: TutorialStepKey;
  onSkip: () => void;
}>;

export function CoachBanner({ stepKey, onSkip }: CoachBannerProps) {
  const { locale } = useLocale();
  const isEnglish = locale === "en";
  const stepInfo = TUTORIAL_STEPS[stepKey];
  const langKey = isEnglish ? "en" : "zh";

  return (
    <aside
      aria-label={isEnglish ? "Tutorial coach" : "新手教学教练条"}
      className="coach-banner"
    >
      <div className="coach-banner__content">
        <div className="coach-banner__heading">
          <span className="coach-banner__badge">
            {stepKey === "COMPLETED"
              ? (isEnglish ? "Completed" : "教学完成")
              : stepKey === "AWAIT_AI_ATTACK"
                ? (isEnglish ? "Opponent turn" : "对手回合")
                : (isEnglish
                    ? `Step ${stepInfo.stepNumber}/${stepInfo.totalSteps}`
                    : `新手教学 · 第 ${stepInfo.stepNumber}/${stepInfo.totalSteps} 步`)}
          </span>
          <h2 className="coach-banner__title">{stepInfo.title[langKey]}</h2>
        </div>
        <p className="coach-banner__instruction">{stepInfo.instruction[langKey]}</p>
      </div>
      <div className="coach-banner__actions">
        {stepKey === "COMPLETED" ? (
          <button
            className="primary-button coach-banner__complete-btn"
            onClick={onSkip}
            type="button"
          >
            {isEnglish ? "Start solo vs AI" : "进入人机对局"}
          </button>
        ) : (
          <button
            className="secondary-button coach-banner__skip"
            onClick={onSkip}
            type="button"
          >
            {isEnglish ? "Skip tutorial" : "跳过教学"}
          </button>
        )}
      </div>
    </aside>
  );
}
