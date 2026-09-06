import type { CardInstanceId } from "../../../game/engine/types";
import { useLocale } from "../../../app/locale";
import { formatList, getCardDefinition } from "../localGameView";
import type { GameState } from "../../../game/engine/types";
import { getCardDisplayName } from "../presentationLocale";
import { PLAY_BRAND_ASSETS } from "../playBrandAssets";

type CardDebugCardProps = {
  cardInstanceId: CardInstanceId;
  game: GameState;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: (cardInstanceId: CardInstanceId) => void;
  isDebug?: boolean;
};

export function CardDebugCard({
  cardInstanceId,
  game,
  selected = false,
  disabled = false,
  onSelect,
  isDebug = true,
}: CardDebugCardProps) {
  const definition = getCardDefinition(game, cardInstanceId);
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  if (!definition) {
    return (
      <article className="debug-card card-back is-missing">
        <img
          alt=""
          aria-hidden="true"
          className="card-back__image"
          src={PLAY_BRAND_ASSETS.cardBack}
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
      className={`debug-card card-face${selected ? " is-selected" : ""}${disabled ? " is-disabled" : ""}`}
    >
      <div className="card-face__badge-row">
        <span className={`card-face__type-badge ${isIon ? "is-ion" : "is-substance"}`}>
          {typeBadgeLabel}
        </span>
        {definition.tags.length > 0 ? (
          <span className="card-face__tag-chip">
            {definition.tags[0]}
          </span>
        ) : null}
      </div>
      <button
        className="debug-card__select card-face__button"
        disabled={disabled}
        onClick={() => onSelect?.(cardInstanceId)}
        type="button"
      >
        <span className="debug-card__name card-face__name">
          {getCardDisplayName(definition.id, definition.name, locale)}
        </span>
        <span className="debug-card__line card-face__line">
          {isEnglish ? "Selectable in this game" : "可在当前对局中选择"}
        </span>
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
