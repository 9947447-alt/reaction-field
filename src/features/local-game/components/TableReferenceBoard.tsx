import { cardDefinitionsById } from "../../../game/data/cardDefinitions";
import { useLocale } from "../../../app/locale";
import type { GameState } from "../../../game/engine/types";
import {
  formatPublicRecentAction,
  getPublicRecentAction,
} from "../publicRecentAction";
import {
  getCardDisplayName,
  getCardTypeDisplayName,
  getPlayerDisplayNameById,
} from "../presentationLocale";
import { PublicPlayedCard } from "./PublicPlayedCard";

type TableReferenceBoardProps = Readonly<{
  game: GameState;
}>;

const recentKindLabels = {
  "card-play": ["打出", "Played"],
  response: ["响应", "Responded with"],
  "status-handling": ["处理状态", "Handled status with"],
  diy: ["主动 DIY", "Active DIY"],
} as const;

export function TableReferenceBoard({ game }: TableReferenceBoardProps) {
  const { locale } = useLocale();
  const isEnglish = locale === "en";
  const ref = game.tableReference;
  const refDefinition = ref ? cardDefinitionsById.get(ref.definitionId) : undefined;
  const refName = ref
    ? getCardDisplayName(ref.definitionId, ref.displayName, locale)
    : undefined;
  const refType = refDefinition ? getCardTypeDisplayName(refDefinition.type, locale) : undefined;
  const recent = getPublicRecentAction(game);
  const recentView = recent ? formatPublicRecentAction(recent, locale) : undefined;

  return (
    <section
      aria-label={isEnglish ? "Table reference and benchmarks" : "场面基准与牌堆基准"}
      className="table-center-board"
    >
      <div className="table-center-reference">
        <div className="table-center-reference__header">
          <span className="table-center-label">
            {isEnglish ? "Table Reference" : "场面基准牌"}
          </span>
          {ref ? (
            <span className="table-center-turn">
              {isEnglish ? `Cycle ${ref.cycle} · Round ${ref.round}` : `周期 ${ref.cycle} · 轮次 ${ref.round}`}
            </span>
          ) : null}
        </div>
        {ref && refName ? (
          <div className="table-reference-card">
            {refType ? (
              <span className={`card-face__type-badge ${refDefinition?.type === "ion" ? "is-ion" : "is-substance"}`}>
                {refType}
              </span>
            ) : null}
            <strong className="table-reference-card__name">{refName}</strong>
            <span className="table-reference-card__author">
              {isEnglish ? "Played by " : "由 "}{getPlayerDisplayNameById(ref.playedBy, locale, game.logPresentationContext)}{isEnglish ? "" : " 打出"}
            </span>
          </div>
        ) : (
          <div className="table-reference-card is-empty">
            <span className="table-reference-card__name">
              {isEnglish ? "No reference card yet" : "暂无场面基准牌"}
            </span>
            <span className="table-reference-card__author">
              {isEnglish ? "Play any eligible card to set the first reference" : "可打出任意符合条件的牌建立首张基准"}
            </span>
          </div>
        )}
      </div>

      {recentView ? (
        <div
          aria-label={isEnglish ? "Most recent public play" : "最近公开行动"}
          className="recent-public-action"
        >
          <div className="table-center-reference__header">
            <span className="table-center-label">
              {isEnglish ? "Latest play" : "最近行动"}
            </span>
            <span className="table-center-turn">
              {getPlayerDisplayNameById(recentView.actorId, locale, game.logPresentationContext)}
              {" · "}
              {recentKindLabels[recentView.kind][isEnglish ? 1 : 0]}
            </span>
          </div>
          {recent?.definitionId ? (
            <PublicPlayedCard definitionId={recent.definitionId} />
          ) : (
            <div className="table-reference-card">
              <span className="card-face__type-badge is-substance">{recentView.typeLabel}</span>
              <strong className="table-reference-card__name">{recentView.name}</strong>
            </div>
          )}
        </div>
      ) : null}

      <div className="table-center-piles">
        <div className="pile-stat-chip">
          <span className="pile-stat-label">{isEnglish ? "Deck" : "牌堆"}</span>
          <strong className="pile-stat-count">{game.deck.length}</strong>
        </div>
        <div className="pile-stat-chip">
          <span className="pile-stat-label">{isEnglish ? "Discard" : "弃牌堆"}</span>
          <strong className="pile-stat-count">{game.discardPile.length}</strong>
        </div>
      </div>
    </section>
  );
}
