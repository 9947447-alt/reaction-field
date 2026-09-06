import type { CardInstanceId, GameState } from "../../../game/engine/types";
import { useLocale } from "../../../app/locale";
import { formatList, getCardDefinition } from "../localGameView";
import { getCardDisplayName } from "../presentationLocale";
import { PLAY_BRAND_ASSETS } from "../playBrandAssets";

export type OfficialCardProps = {
  cardInstanceId: CardInstanceId;
  game: GameState;
  selected?: boolean;
  disabled?: boolean;
  highlighted?: boolean;
  onSelect?: (cardInstanceId: CardInstanceId) => void;
  isDebug?: boolean;
};

export function OfficialCard({
  cardInstanceId,
  game,
  selected = false,
  disabled = false,
  highlighted = false,
  onSelect,
  isDebug = false,
}: OfficialCardProps) {
  const definition = getCardDefinition(game, cardInstanceId);
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  if (!definition) {
    return (
      <article className="debug-card card-back is-missing official-card official-card--back">
        <img
          alt=""
          aria-hidden="true"
          className="card-back__image"
          src={PLAY_BRAND_ASSETS.cardBack}
        />
        <img
          alt=""
          aria-hidden="true"
          className="card-frame__overlay"
          src={PLAY_BRAND_ASSETS.cardFrame}
        />
        <span className="card-back__caption">{isEnglish ? "Face down" : "牌背"}</span>
      </article>
    );
  }

  const isIon = definition.type === "ion";
  const typeBadgeLabel = isIon
    ? (isEnglish ? "Ion" : "离子")
    : (isEnglish ? "Substance" : "实体");

  return (
    <article
      className={`debug-card card-face official-card${selected ? " is-selected" : ""}${disabled ? " is-disabled" : ""}${highlighted ? " coach-highlight" : ""}`}
    >
      {highlighted ? (
        <span className="coach-pointer coach-pointer--top">
          {isEnglish ? "👆 Select" : "👆 点击选择"}
        </span>
      ) : null}
      <img
        alt=""
        aria-hidden="true"
        className="card-frame__overlay"
        src={PLAY_BRAND_ASSETS.cardFrame}
      />
      <button
        aria-pressed={selected}
        className="debug-card__select card-face__button official-card__button"
        disabled={disabled}
        onClick={() => onSelect?.(cardInstanceId)}
        type="button"
      >
        <div className="card-face__badge-row official-card__top">
          <span className={`card-face__type-badge ${isIon ? "is-ion" : "is-substance"}`}>
            {typeBadgeLabel}
          </span>
          {definition.tags.length > 0 ? (
            <span className="card-face__tag-chip">
              {definition.tags[0]}
            </span>
          ) : null}
        </div>
        <div className="official-card__name-container">
          <span className="debug-card__name card-face__name official-card__name">
            {getCardDisplayName(definition.id, definition.name, locale)}
          </span>
        </div>
        <div className="official-card__bottom">
          <span className="debug-card__line card-face__line official-card__line">
            {isEnglish ? "Selectable in this game" : "可在当前对局中选择"}
          </span>
        </div>
      </button>
      {isDebug ? (
        <details className="debug-details debug-card__details">
          <summary>{isEnglish ? "Debug details" : "调试详情"}</summary>
          <span className="debug-card__meta">
            {cardInstanceId} · {formatList(definition.tags)} · {formatList(definition.allowedTimings)}
          </span>
        </details>
      ) : null}
    </article>
  );
}
