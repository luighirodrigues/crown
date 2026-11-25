"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

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
const CHANGE_EVENT = "crown-layout-version-change";
let unsavedVersion: LayoutVersion | undefined;

function getServerSnapshot(): LayoutVersion {
  return "v1";
}

function getSnapshot(): LayoutVersion {
  if (unsavedVersion) return unsavedVersion;

  try {
    return window.localStorage.getItem(STORAGE_KEY) === "v2" ? "v2" : "v1";
  } catch {
    return "v1";
  }
}

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === null) {
      onChange();
    }
  }

  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function setVersion(version: LayoutVersion) {
  try {
    window.localStorage.setItem(STORAGE_KEY, version);
    unsavedVersion = undefined;
  } catch {
    unsavedVersion = version;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function LayoutVersionProvider({ children }: { children: React.ReactNode }) {
  const version = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    setVersion(getSnapshot() === "v1" ? "v2" : "v1");
  }

  return (
    <LayoutVersionContext.Provider value={{ version, setVersion, toggle }}>
      {children}
    </LayoutVersionContext.Provider>
  );
}

export function useLayoutVersion() {
  return useContext(LayoutVersionContext);
}
