import { LocalGamePage } from "../features/local-game/LocalGamePage";

export function isDebugRoute(pathname?: string): boolean {
  const currentPath = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const normalized = currentPath.replace(/\/+$/u, "");
  return normalized.endsWith("/debug");
}

export const routes = [
  {
    path: "/",
    element: <LocalGamePage isDebug={false} />,
  },
  {
    path: "/debug",
    element: <LocalGamePage isDebug={true} />,
  },
] as const;

