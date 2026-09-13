import { useLocale } from "./locale";

export function LandscapeOrientationBarrier() {
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  return (
    <aside
      aria-label={isEnglish ? "Orientation notice" : "屏幕方向提示"}
      className="orientation-barrier"
      data-testid="orientation-barrier"
      role="region"
    >
      <div className="orientation-barrier__content">
        <svg
          aria-hidden="true"
          className="orientation-barrier__icon"
          fill="none"
          height="64"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="64"
        >
          {/* Phone outline */}
          <rect height="18" rx="2" ry="2" width="12" x="6" y="3" />
          {/* Screen inner lines */}
          <line x1="9" x2="15" y1="7" y2="7" />
          <line x1="11" x2="13" y1="18" y2="18" />
          {/* Curved rotation arrows */}
          <path d="M3 12a9 9 0 0 1 9-9" />
          <polyline points="3 8 3 12 7 12" />
          <path d="M21 12a9 9 0 0 1-9 9" />
          <polyline points="21 16 21 12 17 12" />
        </svg>
        <h2 className="orientation-barrier__title">
          {isEnglish ? "Please Rotate Your Device" : "请横持设备"}
        </h2>
        <p className="orientation-barrier__text">
          {isEnglish
            ? "Reaction Field is designed for landscape tabletop play. Please rotate your device to landscape orientation to continue."
            : "反应域采用沉浸式横屏牌桌设计，请将屏幕旋转至横向以获得最佳体验。"}
        </p>
      </div>
    </aside>
  );
}
