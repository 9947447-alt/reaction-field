import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import type { LocalGamePageProps } from "../features/local-game/LocalGamePage";
import {
  createConfiguringLocalGameSession,
  defaultCharacterSelection,
} from "../features/local-game/localGameSession";
import { LobbyPage } from "../features/lobby/LobbyPage";
import { LandscapeOrientationBarrier } from "./LandscapeOrientationBarrier";
import { getAppRoute, isDebugRoute } from "./routes";

const LocalGamePage = lazy(() =>
  import("../features/local-game/LocalGamePage").then((module) => ({
    default: module.LocalGamePage,
  })),
);

function AppShellFallback() {
  return (
    <div className="application-shell" data-testid="app-shell-fallback">
      <header className="release-bar" />
    </div>
  );
}

function OfficialRouteFrame({
  blocked,
  children,
}: Readonly<{ blocked: boolean; children: ReactNode }>) {
  return (
    <>
      {blocked ? <LandscapeOrientationBarrier /> : null}
      <div
        aria-hidden={blocked ? "true" : undefined}
        data-testid="official-route-content"
        inert={blocked ? true : undefined}
      >
        {children}
      </div>
    </>
  );
}

function usePortraitBlocked() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(orientation: portrait)");
    const update = () => setBlocked(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return blocked;
}

export function App(props: LocalGamePageProps) {
  const [currentPath, setCurrentPath] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/",
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const isDebug = props.isDebug ?? (typeof window !== "undefined" && isDebugRoute(currentPath));
  const portraitBlocked = usePortraitBlocked();

  if (isDebug) {
    return (
      <Suspense fallback={<AppShellFallback />}>
        <LocalGamePage {...props} isDebug={true} />
      </Suspense>
    );
  }

  const route = getAppRoute(currentPath);

  if (route === "lobby") {
    return (
      <OfficialRouteFrame blocked={portraitBlocked}>
        <LobbyPage />
      </OfficialRouteFrame>
    );
  }

  let effectiveCreateSession = props.createSession;
  let isTutorialFromUrl = false;
  if (typeof window !== "undefined") {
    const searchParams = new URLSearchParams(window.location.search);
    isTutorialFromUrl = searchParams.get("tutorial") === "1";
    if (!effectiveCreateSession && searchParams.get("mode") === "two_player") {
      effectiveCreateSession = () =>
        createConfiguringLocalGameSession(defaultCharacterSelection, ["human", "human"]);
    }
  }

  return (
    <OfficialRouteFrame blocked={portraitBlocked}>
      <Suspense fallback={<AppShellFallback />}>
        <LocalGamePage
          {...props}
          createSession={effectiveCreateSession}
          initialTutorial={props.initialTutorial ?? isTutorialFromUrl}
          isDebug={false}
        />
      </Suspense>
    </OfficialRouteFrame>
  );
}


