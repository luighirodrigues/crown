"use client";

import { useCallback, useSyncExternalStore } from "react";

function getServerSnapshot() {
  return false;
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, [query]);

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}
