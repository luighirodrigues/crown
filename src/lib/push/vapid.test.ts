import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = process.env;

async function loadVapid(env: Partial<NodeJS.ProcessEnv>) {
  vi.resetModules();
  process.env = { ...originalEnv, ...env };
  return import("./vapid");
}

describe("VAPID helpers", () => {
  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it("returns the full config and public key when env is complete", async () => {
    const { getVapidConfig, getVapidPublicKey } = await loadVapid({
      VAPID_PUBLIC_KEY: "public-key",
      VAPID_PRIVATE_KEY: "private-key",
      VAPID_SUBJECT: "mailto:admin@crown.test",
    });

    expect(getVapidPublicKey()).toBe("public-key");
    expect(getVapidConfig()).toEqual({
      publicKey: "public-key",
      privateKey: "private-key",
      subject: "mailto:admin@crown.test",
    });
  });

  it("accepts an http or https URL subject", async () => {
    const { getVapidConfig } = await loadVapid({
      VAPID_PUBLIC_KEY: "public-key",
      VAPID_PRIVATE_KEY: "private-key",
      VAPID_SUBJECT: "https://app.crown.test",
    });

    expect(getVapidConfig()).toEqual({
      publicKey: "public-key",
      privateKey: "private-key",
      subject: "https://app.crown.test",
    });
  });

  it("returns null when VAPID env is missing without throwing", async () => {
    const { getVapidConfig, getVapidPublicKey } = await loadVapid({
      VAPID_PUBLIC_KEY: "",
      VAPID_PRIVATE_KEY: "private-key",
      VAPID_SUBJECT: "mailto:admin@crown.test",
    });

    expect(getVapidPublicKey()).toBeNull();
    expect(getVapidConfig()).toBeNull();
  });

  it("reports which VAPID variables are missing", async () => {
    const { getVapidConfig, getVapidConfigStatus } = await loadVapid({
      VAPID_PUBLIC_KEY: "public-key",
      VAPID_PRIVATE_KEY: "",
      VAPID_SUBJECT: "",
    });

    expect(getVapidConfig()).toBeNull();
    expect(getVapidConfigStatus()).toEqual({
      enabled: false,
      missing: ["VAPID_PRIVATE_KEY", "VAPID_SUBJECT"],
      message: "Web Push is disabled: missing VAPID_PRIVATE_KEY, VAPID_SUBJECT",
    });
  });

  it("disables VAPID config when the subject is invalid", async () => {
    const { getVapidConfig, getVapidConfigStatus, getVapidPublicKey } = await loadVapid({
      VAPID_PUBLIC_KEY: "public-key",
      VAPID_PRIVATE_KEY: "private-key",
      VAPID_SUBJECT: "admin@crown.test",
    });

    expect(getVapidPublicKey()).toBeNull();
    expect(getVapidConfig()).toBeNull();
    expect(getVapidConfigStatus()).toEqual({
      enabled: false,
      missing: [],
      message: "Web Push is disabled: VAPID_SUBJECT must be a mailto: or http(s) URL",
    });
  });

  it("disables VAPID config when mailto subject has no address", async () => {
    const { getVapidConfig, getVapidConfigStatus } = await loadVapid({
      VAPID_PUBLIC_KEY: "public-key",
      VAPID_PRIVATE_KEY: "private-key",
      VAPID_SUBJECT: "mailto:",
    });

    expect(getVapidConfig()).toBeNull();
    expect(getVapidConfigStatus()).toEqual({
      enabled: false,
      missing: [],
      message: "Web Push is disabled: VAPID_SUBJECT must be a mailto: or http(s) URL",
    });
  });
});
