import type { GameState } from "../../../game/engine/types";
import { useLocale } from "../../../app/locale";
import { getPublicReactionLogView } from "../localGameView";
import { renderGameLogEntry } from "../gameLogRenderer";

type GameLogProps = {
  game: GameState;
  isDebug?: boolean;
};

export function GameLog({ game, isDebug = true }: GameLogProps) {
  const { locale } = useLocale();
  const isEnglish = locale === "en";
  const context = game.logPresentationContext;

  return (
    <section className="debug-section game-log" aria-labelledby="game-log-title">
      <h2 id="game-log-title">{isEnglish ? "Full game log" : "完整游戏日志"}</h2>
      <ol>
        {game.log.map((entry, index) => {
          const reaction = getPublicReactionLogView(game, entry, locale, context);
          const isLatest = index === game.log.length - 1;

          return (
            <li className={isLatest ? "is-latest" : undefined} key={entry.id}>
              <div className="game-log__message">
                {renderGameLogEntry(entry, locale, context)}
                {isDebug ? (
                  <details className="debug-details game-log__details">
                    <summary>{isEnglish ? "Debug details" : "调试详情"}</summary>
                    <span className="game-log__entry-id">{isEnglish ? "Log ID" : "日志编号"}：{entry.id}</span>
                    {reaction ? <span className="game-log__entry-id">{JSON.stringify(entry.reaction)}</span> : null}
                  </details>
                ) : null}
              </div>
              {reaction ? (
                <div className="game-log__reaction" aria-label={`${isEnglish ? "Successful reaction" : "成功反应"}：${reaction.name}`}>
                  <strong>{isEnglish ? "Successful reaction" : "成功反应"} · {reaction.name}</strong>
                  <span>{isEnglish ? "Entry" : "入口"}：{reaction.trigger}</span>
                  {reaction.participants.map((participant) => (
                    <span key={participant}>{participant}</span>
                  ))}
                  <span>{isEnglish ? "Result" : "结果"}：{reaction.outcome}</span>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
