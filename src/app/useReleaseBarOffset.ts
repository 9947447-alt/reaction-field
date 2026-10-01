import { useEffect, type RefObject } from "react";

export function useReleaseBarOffset(barRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) {
      return undefined;
    }

    const apply = () => {
      const height = Math.ceil(bar.getBoundingClientRect().height);
      if (height < 1) {
        return;
      }
      document.documentElement.style.setProperty("--release-bar-height", `${height}px`);
    };

    apply();
    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(apply);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [barRef]);
}
