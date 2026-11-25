import { describe, expect, it } from "vitest";
import { normalizeNotificationUrl, requireNotificationUrl } from "./url";

const appOrigin = "https://app.crown.test";

describe("notification URL helpers", () => {
  it("normalizes internal paths", () => {
    expect(normalizeNotificationUrl("/inicio", appOrigin)).toBe("/inicio");
    expect(normalizeNotificationUrl("/admin/notificacoes?tab=global#top", appOrigin)).toBe(
      "/admin/notificacoes?tab=global#top"
    );
  });

  it("accepts internal paths without a configured app origin", () => {
    expect(normalizeNotificationUrl("/admin")).toBe("/admin");
    expect(requireNotificationUrl("/admin")).toBe("/admin");
    expect(normalizeNotificationUrl("//evil.example")).toBe("/inicio");
    expect(() => requireNotificationUrl("//evil.example")).toThrow(
      "Notification URL must be an internal path or same-origin URL"
    );
  });

  it("rejects slash and backslash network-path variants", () => {
    const unsafePaths = ["/\\evil.example/path", "\\/evil.example/path", "\\\\evil.example/path"];

    for (const unsafePath of unsafePaths) {
      expect(normalizeNotificationUrl(unsafePath)).toBe("/inicio");
      expect(() => requireNotificationUrl(unsafePath)).toThrow(
        "Notification URL must be an internal path or same-origin URL"
      );
    }
  });

  it("normalizes same-origin absolute URLs to paths", () => {
    expect(normalizeNotificationUrl("https://app.crown.test/inicio?from=push", appOrigin)).toBe(
      "/inicio?from=push"
    );
  });

  it("rejects paths containing control characters", () => {
    expect(() => requireNotificationUrl("/ini\tcio")).toThrow();
    expect(normalizeNotificationUrl("/comuni\ndade")).toBe("/inicio");
  });

  it("rejects same-origin absolute URLs that normalize to protocol-relative paths", () => {
    const unsafeUrls = [
      "https://app.crown.test/\\evil.example/path",
      "https://app.crown.test\\evil.example/path",
    ];

    for (const unsafeUrl of unsafeUrls) {
      expect(normalizeNotificationUrl(unsafeUrl, appOrigin)).toBe("/inicio");
      expect(() => requireNotificationUrl(unsafeUrl, appOrigin)).toThrow(
        "Notification URL must be an internal path or same-origin URL"
      );
    }
  });

  it("never returns a protocol-relative URL", () => {
    const normalizedUrls = [
      normalizeNotificationUrl("/admin"),
      normalizeNotificationUrl("https://app.crown.test/inicio", appOrigin),
      normalizeNotificationUrl("https://app.crown.test/\\evil.example/path", appOrigin),
    ];

    for (const normalizedUrl of normalizedUrls) {
      expect(normalizedUrl.startsWith("//")).toBe(false);
    }
  });

  it("rejects configured app origins without http or https schemes", () => {
    expect(normalizeNotificationUrl("mailto:admin@crown.test", "mailto:admin@crown.test")).toBe(
      "/inicio"
    );
    expect(normalizeNotificationUrl("javascript:alert(1)", "javascript:alert(1)")).toBe(
      "/inicio"
    );
    expect(normalizeNotificationUrl("data:text/plain,hello", "data:text/plain,hello")).toBe(
      "/inicio"
    );
    expect(() => requireNotificationUrl("mailto:admin@crown.test", "mailto:admin@crown.test")).toThrow(
      "App origin must be an http(s) URL"
    );
  });

  it("falls back for empty or missing URLs", () => {
    expect(normalizeNotificationUrl(undefined, appOrigin)).toBe("/inicio");
    expect(normalizeNotificationUrl("", appOrigin)).toBe("/inicio");
    expect(normalizeNotificationUrl("   ", appOrigin)).toBe("/inicio");
  });

  it("falls back for external, malformed and javascript URLs", () => {
    expect(normalizeNotificationUrl("https://evil.example/phish", appOrigin)).toBe("/inicio");
    expect(normalizeNotificationUrl("http://[::1", appOrigin)).toBe("/inicio");
    expect(normalizeNotificationUrl("javascript:alert(1)", appOrigin)).toBe("/inicio");
  });

  it("rejects invalid URLs for strict API validation", () => {
    expect(requireNotificationUrl("/inicio", appOrigin)).toBe("/inicio");
    expect(requireNotificationUrl("https://app.crown.test/admin", appOrigin)).toBe("/admin");
    expect(() => requireNotificationUrl("https://evil.example/phish", appOrigin)).toThrow(
      "Notification URL must be an internal path or same-origin URL"
    );
    expect(() => requireNotificationUrl("javascript:alert(1)", appOrigin)).toThrow(
      "Notification URL must be an internal path or same-origin URL"
    );
    expect(() => requireNotificationUrl("", appOrigin)).toThrow("Notification URL is required");
  });
});
