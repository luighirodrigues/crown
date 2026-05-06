"use client";

import { createContext, useContext, useState, useEffect } from "react";

type LayoutVersion = "v1" | "v2";

interface LayoutVersionContextValue {
  version: LayoutVersion;
  setVersion: (v: LayoutVersion) => void;
  toggle: () => void;
}

const LayoutVersionContext = createContext<LayoutVersionContextValue>({
  version: "v1",
  setVersion: () => {},
  toggle: () => {},
});

const STORAGE_KEY = "crown-layout-version";

export function LayoutVersionProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState<LayoutVersion>("v1");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LayoutVersion | null;
    if (saved === "v1" || saved === "v2") {
      setVersion(saved);
    }
  }, []);

  function handleSetVersion(v: LayoutVersion) {
    setVersion(v);
    localStorage.setItem(STORAGE_KEY, v);
  }

  function toggle() {
    handleSetVersion(version === "v1" ? "v2" : "v1");
  }

  return (
    <LayoutVersionContext.Provider value={{ version, setVersion: handleSetVersion, toggle }}>
      {children}
    </LayoutVersionContext.Provider>
  );
}

export function useLayoutVersion() {
  return useContext(LayoutVersionContext);
}
