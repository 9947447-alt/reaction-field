import { useLocale } from "../../../app/locale";
import type { GameState } from "../../../game/engine/types";
import { getPlayerDisplayNameById } from "../presentationLocale";

type TableReferenceBoardProps = Readonly<{
  game: GameState;
}>;

export function TableReferenceBoard({ game }: TableReferenceBoardProps) {
  const { locale } = useLocale();
  const isEnglish = locale === "en";
  const ref = game.tableReference;

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
        {ref ? (
          <div className="table-reference-card">
            <strong className="table-reference-card__name">{ref.displayName}</strong>
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
