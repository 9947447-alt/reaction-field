import { LobbyPage } from "../features/lobby/LobbyPage";
import { LocalGamePage } from "../features/local-game/LocalGamePage";

export function isDebugRoute(pathname?: string): boolean {
  const currentPath = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const normalized = currentPath.replace(/\/+$/u, "");
  return normalized.endsWith("/debug");
}

export function isPlayRoute(pathname?: string): boolean {
  const currentPath = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const normalized = currentPath.replace(/\/+$/u, "");
  return normalized.endsWith("/play");
}

export type AppRouteType = "lobby" | "play" | "debug";

export function getAppRoute(pathname?: string): AppRouteType {
  if (isDebugRoute(pathname)) {
    return "debug";
  }
  if (isPlayRoute(pathname)) {
    return "play";
  }
  return "lobby";
}

export function getAppBasePath(pathname?: string): string {
  const currentPath = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const stripped = currentPath
    .replace(/\/(?:debug|play)(?:\/.*)?$/u, "")
    .replace(/\/+$/u, "");
  return stripped === "" ? "" : stripped;
}

export function resolveAppRoutePath(subPath: "/play" | "/debug" | "/", pathname?: string): string {
  const basePath = getAppBasePath(pathname);
  if (subPath === "/") {
    return basePath === "" ? "/" : `${basePath}/`;
  }
  return `${basePath}${subPath}`;
}

export function navigateTo(targetUrl: string): void {
  if (typeof window !== "undefined") {
    window.history.pushState({}, "", targetUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

export const routes = [
  {
    path: "/",
    element: <LobbyPage />,
  },
  {
    path: "/play",
    element: <LocalGamePage isDebug={false} />,
  },
  {
    path: "/debug",
    element: <LocalGamePage isDebug={true} />,
  },
] as const;

