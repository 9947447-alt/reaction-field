import type { CharacterId } from "../../game/engine/types";

export const PLAY_BRAND_ASSETS = Object.freeze({
  tableFelt: "./brand/play/table-felt.png",
  cardBack: "./brand/play/card-back.png",
  cardFrame: "./brand/play/card-frame.png",
  modeSolo: "./brand/play/mode-solo.png",
  modeDuo: "./brand/play/mode-duo.png",
  iconHp: "./brand/play/icon-hp.png",
  iconFire: "./brand/play/icon-fire.png",
  iconSo2: "./brand/play/icon-so2.png",
  iconDiy: "./brand/play/icon-diy.png",
  iconReference: "./brand/play/icon-reference.png",
  coachPointer: "./brand/play/coach-pointer.png",
  coachBanner: "./brand/play/coach-banner.png",
  characters: Object.freeze({
    laboratory_teacher: "./brand/play/char-lab-teacher.png",
    chemical_factory_ceo: "./brand/play/char-ceo.png",
    clumsy_party_secretary: "./brand/play/char-secretary.png",
    caustic_soda_captain: "./brand/play/char-alkali-captain.png",
    acid_king: "./brand/play/char-acid-king.png",
    chemistry_enthusiast: "./brand/play/char-enthusiast.png",
    sulfuric_acid_factory_director: "./brand/play/char-sulfuric-chief.png",
  }),
});

export function getCharacterPlayIcon(characterId: CharacterId): string {
  return PLAY_BRAND_ASSETS.characters[characterId];
}
