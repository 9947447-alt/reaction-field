import { cardDefinitionsById } from "../../../game/data/cardDefinitions";
import { useLocale } from "../../../app/locale";
import { getCardDisplayName, getCardTypeDisplayName } from "../presentationLocale";

type PublicPlayedCardProps = Readonly<{
  definitionId: string;
}>;

export function PublicPlayedCard({ definitionId }: PublicPlayedCardProps) {
  const { locale } = useLocale();
  const isEnglish = locale === "en";
  const definition = cardDefinitionsById.get(definitionId);
  const name = definition
    ? getCardDisplayName(definition.id, definition.name, locale)
    : definitionId;
  const typeLabel = definition
    ? getCardTypeDisplayName(definition.type, locale)
    : (isEnglish ? "Card" : "卡牌");
  const isIon = definition?.type === "ion";

  return (
    <article
      aria-label={`${name} · ${typeLabel}`}
      className={`debug-card card-face is-public-play${isIon ? " is-ion" : ""}`}
    >
      <div className="card-face__badge-row">
        <span className={`card-face__type-badge ${isIon ? "is-ion" : "is-substance"}`}>
          {typeLabel}
        </span>
      </div>
      <strong className="debug-card__name card-face__name">{name}</strong>
    </article>
  );
}
