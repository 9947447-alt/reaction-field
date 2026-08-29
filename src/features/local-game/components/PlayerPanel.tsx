import { getCharacterDefinition } from "../../../game/data/characterDefinitions";
import { useLocale } from "../../../app/locale";
import type {
  CardInstanceId,
  GameState,
  Player,
} from "../../../game/engine/types";
import type { PlayerController } from "../localGameSession";
import { CharacterSkillList } from "./CharacterSelectionPanel";
import { formatSkillDebugText } from "../characterPresentation";
import { CardDebugCard } from "./CardDebugCard";
import {
  getCharacterDisplayName,
  getPlayerControllerDisplayName,
  getPlayerDisplayName,
  getStatusDisplayName,
} from "../presentationLocale";

type PlayerPanelProps = {
  game: GameState;
  player: Player;
  controller?: PlayerController;
  selectedCardId?: CardInstanceId;
  onSelectCard: (cardInstanceId: CardInstanceId) => void;
  handReveal?: "contents" | "backs";
  handSelectionDisabled?: boolean;
  showActivePlayerIndicator?: boolean;
};

export function PlayerPanel({
  game,
  player,
  controller,
  selectedCardId,
  onSelectCard,
  handReveal = "contents",
  handSelectionDisabled = false,
  showActivePlayerIndicator = true,
}: PlayerPanelProps) {
  const character = getCharacterDefinition(player.characterId);
  const { locale } = useLocale();
  const isEnglish = locale === "en";
  const isAi = controller === "ai";
  const effectiveHandDisabled = handSelectionDisabled || isAi;
  const statusText = player.statuses.length > 0
    ? player.statuses.map((status) => `${status.statusId} (${status.id})`).join(", ")
    : "无";

  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const hpToneClass = hpPercent <= 25 ? "is-critical" : hpPercent <= 50 ? "is-low" : "is-healthy";

  return (
    <section className="debug-section player-panel" aria-labelledby={`${player.id}-title`}>
      <div className="player-panel__header">
        <div className="player-panel__identity">
          <h2 id={`${player.id}-title`}>{getPlayerDisplayName(player, locale)}</h2>
          <p>
            {getCharacterDisplayName(character.id, locale)}
            {controller ? ` · ${getPlayerControllerDisplayName(controller, locale)}` : ""}
          </p>
        </div>
        <div className="player-panel__badges">
          {showActivePlayerIndicator && game.activePlayerId === player.id ? (
            <span className="active-pill">{isEnglish ? "Active" : "当前行动"}</span>
          ) : null}
          {player.eliminated ? (
            <span className="status-pill is-eliminated">{isEnglish ? "Eliminated" : "已淘汰"}</span>
          ) : null}
        </div>
      </div>

      <div className="player-hp-meter">
        <div className="player-hp-header">
          <span className="player-hp-label">{isEnglish ? "HP Gauge" : "生命值"}</span>
          <strong className="player-hp-val">{player.hp}/{player.maxHp}</strong>
        </div>
        <div
          aria-valuemax={player.maxHp}
          aria-valuemin={0}
          aria-valuenow={player.hp}
          className="player-hp-track"
          role="progressbar"
        >
          <div
            className={`player-hp-fill ${hpToneClass}`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      <div className="player-status-chips">
        {player.statuses.length > 0 ? (
          player.statuses.map((status) => (
            <span className="status-pill is-active-status" key={status.id}>
              {getStatusDisplayName(status.statusId, locale)}
            </span>
          ))
        ) : (
          <span className="status-pill is-normal">{isEnglish ? "Normal" : "状态正常"}</span>
        )}
        <span className={player.usedDIYThisCycle ? "warn-pill" : "ok-pill"}>
          {player.usedDIYThisCycle
            ? (isEnglish ? "DIY: Used" : "DIY: 已用")
            : (isEnglish ? "DIY: Unused" : "DIY: 可用")}
        </span>
        <span className="hand-count-pill">
          {isEnglish ? `Hand: ${player.hand.length}` : `手牌: ${player.hand.length} 张`}
        </span>
      </div>

      <dl className="player-stats">
        {([
          [isEnglish ? "HP" : "生命值", `${player.hp} / ${player.maxHp}`],
          [isEnglish ? "Eliminated" : "淘汰", player.eliminated ? (isEnglish ? "Yes" : "是") : (isEnglish ? "No" : "否")],
          [isEnglish ? "Pending status" : "待处理状态", player.statuses.length > 0 ? (isEnglish ? "Yes" : "有") : (isEnglish ? "No" : "无")],
          [isEnglish ? "DIY this cycle" : "本周期 DIY", player.usedDIYThisCycle ? (isEnglish ? "Used" : "已用") : (isEnglish ? "Unused" : "未用")],
          [isEnglish ? "Hand" : "手牌", player.hand.length],
        ] as const).map(([l, v]) => (
          <div key={l}><dt>{l}</dt><dd>{v}</dd></div>
        ))}
      </dl>
      <p className="status-line">{isEnglish ? "Current status" : "当前状态"}：{player.statuses.length > 0 ? (isEnglish ? "Pending status" : "有待处理状态") : (isEnglish ? "Normal" : "正常")}</p>
      <details className="debug-details">
        <summary>{isEnglish ? "Debug details" : "调试详情"}</summary>
        <p>{player.id} · {statusText}</p>
      </details>
      <div className="character-readout">
        <div className="character-readout__heading">
          <h3>{isEnglish ? "Character skills" : "角色技能"}</h3>
          <span>{getCharacterDisplayName(character.id, locale)}</span>
        </div>
        <CharacterSkillList character={character} locale={locale} />
        <details className="debug-details">
          <summary>{isEnglish ? "Debug details" : "调试详情"}</summary>
          {character.skills.map((skill) => (
            <p key={skill.id}>{formatSkillDebugText(skill, locale)}</p>
          ))}
        </details>
      </div>
      <div className="hand-grid" aria-label={isEnglish ? `${getPlayerDisplayName(player, locale)}'s hand` : `${getPlayerDisplayName(player, locale)}的手牌`}>
        {handReveal === "backs"
          ? player.hand.map((_, index) => (
              <article
                aria-label={
                  isEnglish
                    ? `Face-down card ${index + 1} of ${player.hand.length}`
                    : `牌背 ${index + 1}/${player.hand.length}`
                }
                className="debug-card card-back"
                key={`${player.id}-back-${index}`}
              >
                <span aria-hidden="true" className="card-back__mark">RF</span>
                <span className="card-back__caption">{isEnglish ? "Face down" : "牌背"}</span>
              </article>
            ))
          : player.hand.map((cardInstanceId) => (
              <CardDebugCard
                cardInstanceId={cardInstanceId}
                disabled={effectiveHandDisabled}
                game={game}
                key={cardInstanceId}
                onSelect={effectiveHandDisabled ? undefined : onSelectCard}
                selected={!effectiveHandDisabled && selectedCardId === cardInstanceId}
              />
            ))}
      </div>
    </section>
  );
}
