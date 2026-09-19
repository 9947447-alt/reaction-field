import { useEffect, useState } from "react";
import {
  LocalGamePage,
  type LocalGamePageProps,
} from "../features/local-game/LocalGamePage";
import {
  createConfiguringLocalGameSession,
  defaultCharacterSelection,
} from "../features/local-game/localGameSession";
import { LobbyPage } from "../features/lobby/LobbyPage";
import { LandscapeOrientationBarrier } from "./LandscapeOrientationBarrier";
import { getAppRoute, isDebugRoute } from "./routes";

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

  if (isDebug) {
    return <LocalGamePage {...props} isDebug={true} />;
  }

  const route = getAppRoute(currentPath);

  if (route === "lobby") {
    return (
      <>
        <LandscapeOrientationBarrier />
        <LobbyPage />
      </>
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
    <>
      <LandscapeOrientationBarrier />
      <LocalGamePage
        {...props}
        createSession={effectiveCreateSession}
        initialTutorial={props.initialTutorial ?? isTutorialFromUrl}
        isDebug={false}
      />
    </>
  );
}


