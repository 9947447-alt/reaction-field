import { useCallback, useRef, useState } from "react";
import { FeedbackLink } from "../../app/feedback";
import { LocaleSwitch, useLocale } from "../../app/locale";
import { ProjectRepositoryLink } from "../../app/projectRepository";
import { releaseMetadata } from "../../app/releaseMetadata";
import { resolveAppRoutePath, navigateTo } from "../../app/routes";
import { AboutDialog } from "../local-game/components/AboutDialog";
import { PLAY_BRAND_ASSETS } from "../local-game/playBrandAssets";

export function LobbyPage() {
  const { locale } = useLocale();
  const isEnglish = locale === "en";
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutTriggerRef = useRef<HTMLButtonElement>(null);

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
    setAboutOpen(true);
  }, []);

  const handleStartMode = (targetSubPathWithQuery: string) => {
    const fullTarget = resolveAppRoutePath(
      targetSubPathWithQuery.startsWith("/play") ? "/play" : "/",
    );
    const query = targetSubPathWithQuery.includes("?")
      ? targetSubPathWithQuery.slice(targetSubPathWithQuery.indexOf("?"))
      : "";
    navigateTo(`${fullTarget}${query}`);
  };

  return (
    <div className="lobby-page" data-testid="lobby-page">
      <header className="release-bar">
        <div>
          <strong>
            {releaseMetadata.displayName}
            <span className="secondary-brand">{releaseMetadata.secondaryName}</span>
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

      <main className="lobby-main">
        {/* Banner Slot */}
        <section className="lobby-banner" aria-label={isEnglish ? "Lobby banner" : "大厅横幅"}>
          <div className="lobby-banner__visual">
            <img
              alt=""
              aria-hidden="true"
              className="lobby-banner__image"
              src={PLAY_BRAND_ASSETS.coachBanner}
            />
            <div className="lobby-banner__overlay">
              <span className="lobby-banner__slot-tag">
                {isEnglish ? "Phase 20 Lobby Banner Slot" : "新大厅横幅预留槽 · 占位图"}
              </span>
              <h1 className="lobby-banner__title">
                {releaseMetadata.displayName} · {releaseMetadata.secondaryName}
              </h1>
              <p className="lobby-banner__subtitle">
                {isEnglish
                  ? "Immersive landscape chemical reaction card game · Natural table battle"
                  : "沉浸式横屏卡牌客户端 · 化学反应对局"}
              </p>
            </div>
          </div>
        </section>

        {/* Mode Entry Cards */}
        <section className="lobby-modes-section" aria-labelledby="modes-heading">
          <div className="lobby-modes-heading">
            <h2 id="modes-heading">{isEnglish ? "Select Mode" : "对战模式"}</h2>
          </div>

          <div className="lobby-mode-grid">
            {/* Solo vs AI */}
            <article className="lobby-mode-card" data-testid="mode-card-solo">
              <div className="lobby-mode-card__hero">
                <span className="lobby-mode-card__badge">
                  {isEnglish ? "Default" : "默认人机"}
                </span>
                <img
                  alt=""
                  aria-hidden="true"
                  className="lobby-mode-card__image"
                  src={PLAY_BRAND_ASSETS.modeSolo}
                />
              </div>
              <div className="lobby-mode-card__body">
                <h3 className="lobby-mode-card__title">
                  {isEnglish ? "Solo vs AI" : "单人人机对战"}
                </h3>
                <p className="lobby-mode-card__description">
                  {isEnglish
                    ? "Laboratory Teacher vs Factory CEO; opponent cards face-down, competing against NATBA heuristic AI."
                    : "默认 实验室老师 vs 化工厂 CEO；对手手牌背面私密，与 NATBA 策略交锋。"}
                </p>
                <button
                  className="lobby-mode-card__action"
                  onClick={() => handleStartMode("/play?mode=solo_ai")}
                  type="button"
                >
                  {isEnglish ? "Play vs AI" : "进入人机对局"}
                </button>
              </div>
            </article>

            {/* Local Duo */}
            <article className="lobby-mode-card" data-testid="mode-card-duo">
              <div className="lobby-mode-card__hero">
                <span className="lobby-mode-card__badge lobby-mode-card__badge--secondary">
                  {isEnglish ? "Local" : "本地双人"}
                </span>
                <img
                  alt=""
                  aria-hidden="true"
                  className="lobby-mode-card__image"
                  src={PLAY_BRAND_ASSETS.modeDuo}
                />
              </div>
              <div className="lobby-mode-card__body">
                <h3 className="lobby-mode-card__title">
                  {isEnglish ? "Local Two-Player" : "本地双人对战"}
                </h3>
                <p className="lobby-mode-card__description">
                  {isEnglish
                    ? "Shared screen with both hands visible, suitable for face-to-face chemical reaction battles."
                    : "同屏公开双方手牌与场面，适合现场面对面切磋化学反应。"}
                </p>
                <button
                  className="lobby-mode-card__action lobby-mode-card__action--duo"
                  onClick={() => handleStartMode("/play?mode=two_player")}
                  type="button"
                >
                  {isEnglish ? "Play Local Duo" : "进入双人对局"}
                </button>
              </div>
            </article>

            {/* Tutorial */}
            <article className="lobby-mode-card" data-testid="mode-card-tutorial">
              <div className="lobby-mode-card__hero">
                <span className="lobby-mode-card__badge lobby-mode-card__badge--secondary">
                  {isEnglish ? "Tutorial" : "新手教学"}
                </span>
                <img
                  alt=""
                  aria-hidden="true"
                  className="lobby-mode-card__image"
                  src={PLAY_BRAND_ASSETS.coachBanner}
                />
              </div>
              <div className="lobby-mode-card__body">
                <h3 className="lobby-mode-card__title">
                  {isEnglish ? "Tutorial Guidance" : "交互式教学引导"}
                </h3>
                <p className="lobby-mode-card__description">
                  {isEnglish
                    ? "First game quick start: understand hands, trigger reactions, experience counterattacks."
                    : "新手第一局快速上手：认识手牌、打出反应、体验反击机制。"}
                </p>
                <button
                  className="lobby-mode-card__action lobby-mode-card__action--tutorial"
                  onClick={() => handleStartMode("/play?mode=solo_ai&tutorial=1")}
                  type="button"
                >
                  {isEnglish ? "Start Tutorial" : "进入教学"}
                </button>
              </div>
            </article>
          </div>
        </section>

        {/* Footer */}
        <footer className="lobby-footer">
          <p className="lobby-footer__info">
            {releaseMetadata.displayName} · {releaseMetadata.rulesVersion} · Apache-2.0
          </p>
          <div className="lobby-footer__links">
            <ProjectRepositoryLink />
          </div>
        </footer>
      </main>

      {aboutOpen ? <AboutDialog isDebug={false} onClose={closeAbout} /> : null}
    </div>
  );
}
