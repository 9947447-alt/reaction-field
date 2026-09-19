import { useLocale } from "../../../app/locale";
import type { TutorialStepInfo } from "../tutorial/tutorialScript";

export type CoachBannerProps = Readonly<{
  step: TutorialStepInfo;
  onSkip?: () => void;
  onComplete?: () => void;
}>;

export function CoachBanner({ step, onSkip, onComplete }: CoachBannerProps) {
  const { locale } = useLocale();
  const isEnglish = locale === "en";
  const isCompleted = step.key === "COMPLETED";

  return (
    <section
      aria-label={isEnglish ? "Tutorial coach banner" : "教学引导横幅"}
      className="coach-banner"
      data-testid="coach-banner"
    >
      <div className="coach-banner__content">
        <div className="coach-banner__header">
          <span className="coach-banner__tag">
            {isEnglish ? "Tutorial" : "新手教学"}
          </span>
          <h2 className="coach-banner__title">
            {isEnglish ? step.title.en : step.title.zh}
          </h2>
        </div>
        <p className="coach-banner__instruction">
          {isEnglish ? step.instruction.en : step.instruction.zh}
        </p>
      </div>

      <div className="coach-banner__actions">
        {isCompleted ? (
          <button
            className="desk-action-btn desk-action-btn--primary coach-banner__complete-btn"
            data-testid="coach-banner-complete"
            onClick={onComplete}
            type="button"
          >
            {isEnglish ? "Start Solo vs AI" : "进入人机对局"}
          </button>
        ) : (
          <button
            className="secondary-button coach-banner__skip"
            data-testid="coach-banner-skip"
            onClick={onSkip}
            type="button"
          >
            {isEnglish ? "Skip Tutorial" : "跳过教学"}
          </button>
        )}
      </div>
    </section>
  );
}
