import type { CharacterId } from "../../game/engine/types";

/**
 * Resolves a brand asset path under public/brand/play using import.meta.env.BASE_URL.
 * The resolved path is guaranteed to be absolute-rooted (${BASE_URL}brand/play/<file>),
 * strictly forbidding relative "./brand/play/" which causes sub-route 404 resolution.
 * When on sub-routes such as /debug or /playtest/debug, it resolves relative to the app root.
 */
export function resolvePlayBrandAsset(fileName: string): string {
  const cleanFileName = fileName.replace(/^\.?\/+/u, "").replace(/^brand\/play\/+/u, "");
  const envBase = import.meta.env.BASE_URL;
  let base = envBase && envBase !== "./" ? envBase : "/";
  if (!base.endsWith("/")) {
    base = `${base}/`;
  }

  if (typeof window !== "undefined" && window.location?.pathname) {
    const pathname = window.location.pathname;
    if (pathname.includes("/debug")) {
      const rootPath = pathname.replace(/\/debug(?:\/.*)?$/u, "/");
      const prefix = rootPath.endsWith("/") ? rootPath : `${rootPath}/`;
      return `${prefix}brand/play/${cleanFileName}`.replace(/\/+/gu, "/");
    }
    if (pathname.startsWith("/playtest")) {
      return `/playtest/brand/play/${cleanFileName}`.replace(/\/+/gu, "/");
    }
  }

  return `${base}brand/play/${cleanFileName}`.replace(/\/+/gu, "/");
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
