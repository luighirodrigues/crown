import { describe, expect, it } from "vitest";
import { getPushSupportState } from "./support";

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
