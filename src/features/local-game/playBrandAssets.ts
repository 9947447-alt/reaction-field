import type { CharacterId } from "../../game/engine/types";

/**
 * Resolves a brand asset path under public/brand/play using import.meta.env.BASE_URL.
 * When base is relative ("./") and the page is on a sub-route such as /debug or /playtest/debug,
 * it adjusts the path relative to the app root so assets do not resolve to /debug/brand/play/... (404).
 */
export function resolvePlayBrandAsset(fileName: string): string {
  const rawBase = import.meta.env.BASE_URL ?? "./";
  const cleanFileName = fileName.replace(/^\.?\/+/u, "").replace(/^brand\/play\/+/u, "");

  if (rawBase && rawBase !== "./") {
    const prefix = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
    return `${prefix}brand/play/${cleanFileName}`;
  }

  if (typeof window !== "undefined" && window.location?.pathname) {
    const pathname = window.location.pathname;
    if (pathname.includes("/debug")) {
      const rootPath = pathname.replace(/\/debug(?:\/.*)?$/u, "/");
      const prefix = rootPath.endsWith("/") ? rootPath : `${rootPath}/`;
      return `${prefix}brand/play/${cleanFileName}`.replace(/\/+/gu, "/");
    }
  }

  const prefix = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
  return `${prefix}brand/play/${cleanFileName}`;
}

export const PLAY_BRAND_ASSETS = Object.freeze({
  get tableFelt() {
    return resolvePlayBrandAsset("table-felt.png");
  },
  get cardBack() {
    return resolvePlayBrandAsset("card-back.png");
  },
  get cardFrame() {
    return resolvePlayBrandAsset("card-frame.png");
  },
  get modeSolo() {
    return resolvePlayBrandAsset("mode-solo.png");
  },
  get modeDuo() {
    return resolvePlayBrandAsset("mode-duo.png");
  },
  get iconHp() {
    return resolvePlayBrandAsset("icon-hp.png");
  },
  get iconFire() {
    return resolvePlayBrandAsset("icon-fire.png");
  },
  get iconSo2() {
    return resolvePlayBrandAsset("icon-so2.png");
  },
  get iconDiy() {
    return resolvePlayBrandAsset("icon-diy.png");
  },
  get iconReference() {
    return resolvePlayBrandAsset("icon-reference.png");
  },
  get coachPointer() {
    return resolvePlayBrandAsset("coach-pointer.png");
  },
  get coachBanner() {
    return resolvePlayBrandAsset("coach-banner.png");
  },
  characters: Object.freeze({
    get laboratory_teacher() {
      return resolvePlayBrandAsset("char-lab-teacher.png");
    },
    get chemical_factory_ceo() {
      return resolvePlayBrandAsset("char-ceo.png");
    },
    get clumsy_party_secretary() {
      return resolvePlayBrandAsset("char-secretary.png");
    },
    get caustic_soda_captain() {
      return resolvePlayBrandAsset("char-alkali-captain.png");
    },
    get acid_king() {
      return resolvePlayBrandAsset("char-acid-king.png");
    },
    get chemistry_enthusiast() {
      return resolvePlayBrandAsset("char-enthusiast.png");
    },
    get sulfuric_acid_factory_director() {
      return resolvePlayBrandAsset("char-sulfuric-chief.png");
    },
  }),
});

export function getCharacterPlayIcon(characterId: CharacterId): string {
  return PLAY_BRAND_ASSETS.characters[characterId];
}
