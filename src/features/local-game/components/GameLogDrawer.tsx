import { useLocale } from "../../../app/locale";
import type { GameState } from "../../../game/engine/types";
import { GameLog } from "./GameLog";

type GameLogDrawerProps = Readonly<{
  game: GameState;
  isOpen: boolean;
  onClose: () => void;
}>;

export function GameLogDrawer({ game, isOpen, onClose }: GameLogDrawerProps) {
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-label={isEnglish ? "Game log drawer" : "对局日志抽屉"}
      className="game-log-drawer-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <aside
        aria-label={isEnglish ? "Game log drawer content" : "对局日志内容"}
        aria-modal="true"
        className="game-log-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="game-log-drawer__header">
          <div className="game-log-drawer__title-group">
            <h2 className="game-log-drawer__title">
              {isEnglish ? "Game Log" : "对局日志"}
            </h2>
            <span className="game-log-drawer__badge">
              {isEnglish ? `${game.log.length} entries` : `共 ${game.log.length} 条记录`}
            </span>
          </div>
          <button
            aria-label={isEnglish ? "Close log drawer" : "关闭日志抽屉"}
            className="secondary-button game-log-drawer__close"
            onClick={onClose}
            type="button"
          >
            {isEnglish ? "Close" : "关闭"}
          </button>
        </div>
        <div className="game-log-drawer__body">
          <GameLog game={game} isDebug={false} />
        </div>
      </aside>
    </div>
  );
}
