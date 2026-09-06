import {
  LocalGamePage,
  type LocalGamePageProps,
} from "../features/local-game/LocalGamePage";
import { isDebugRoute } from "./routes";

export function App(props: LocalGamePageProps) {
  const isDebug = props.isDebug ?? (typeof window !== "undefined" && isDebugRoute());
  return <LocalGamePage {...props} isDebug={isDebug} />;
}

