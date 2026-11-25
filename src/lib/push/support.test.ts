import { describe, expect, it } from "vitest";
import { getPwaInstallState, getPushSupportState } from "./support";

describe("getPushSupportState", () => {
  it("reports insecure origins before checking browser APIs", () => {
    expect(
      getPushSupportState({
        isSecureContext: false,
        hasServiceWorker: true,
        hasPushManager: true,
        hasNotification: true,
      })
    ).toEqual({ supported: false, reason: "insecure" });
  });

  it("reports missing browser APIs", () => {
    expect(
      getPushSupportState({
        isSecureContext: true,
        hasServiceWorker: false,
        hasPushManager: true,
        hasNotification: true,
      })
    ).toEqual({ supported: false, reason: "unsupported" });
  });

  it("reports supported push setup when secure and APIs exist", () => {
    expect(
      getPushSupportState({
        isSecureContext: true,
        hasServiceWorker: true,
        hasPushManager: true,
        hasNotification: true,
      })
    ).toEqual({ supported: true, reason: null });
  });
});

describe("getPwaInstallState", () => {
  it("reports installed when display-mode standalone is active", () => {
    expect(
      getPwaInstallState({
        hasStandaloneDisplayMode: true,
        hasNavigatorStandalone: false,
        userAgent: "",
        maxTouchPoints: 0,
      })
    ).toMatchObject({ installed: true });
  });

  it("reports installed for iOS navigator standalone", () => {
    expect(
      getPwaInstallState({
        hasStandaloneDisplayMode: false,
        hasNavigatorStandalone: true,
        userAgent: "iPhone",
        maxTouchPoints: 1,
      })
    ).toMatchObject({ installed: true });
  });

  it("reports not installed in a regular browser tab", () => {
    expect(
      getPwaInstallState({
        hasStandaloneDisplayMode: false,
        hasNavigatorStandalone: false,
        userAgent: "",
        maxTouchPoints: 0,
      })
    ).toMatchObject({ installed: false });
  });

  it("shows Home Screen guidance for both mobile and desktop-class iOS browsers", () => {
    for (const device of [
      { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", maxTouchPoints: 1 },
      { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)", maxTouchPoints: 5 },
    ]) {
      expect(getPwaInstallState({
        hasStandaloneDisplayMode: false,
        hasNavigatorStandalone: false,
        ...device,
      })).toMatchObject({ needsHomeScreenInstall: true });
    }
  });

  it("does not show Home Screen guidance once installed or on a desktop Mac", () => {
    expect(getPwaInstallState({
      hasStandaloneDisplayMode: true,
      hasNavigatorStandalone: false,
      userAgent: "iPhone",
      maxTouchPoints: 1,
    })).toMatchObject({ needsHomeScreenInstall: false });
    expect(getPwaInstallState({
      hasStandaloneDisplayMode: false,
      hasNavigatorStandalone: false,
      userAgent: "Macintosh",
      maxTouchPoints: 0,
    })).toMatchObject({ needsHomeScreenInstall: false });
  });
});
