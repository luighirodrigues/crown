import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { beforeEach, expect, it, vi } from "vitest";

const origin = "https://crown.example";
const source = readFileSync(new URL("../../../public/sw.js", import.meta.url), "utf8");
const handlers = new Map<string, (event: unknown) => void>();
const match = vi.fn();
const put = vi.fn();
const fetchResponse = vi.fn();
const showNotification = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  handlers.clear();
  runInNewContext(source, {
    self: {
      location: { origin },
      addEventListener: (type: string, handler: (event: unknown) => void) => handlers.set(type, handler),
      registration: { showNotification },
    },
      caches: { open: async () => ({ match, put }) },
    fetch: fetchResponse,
    URL,
    Response,
  });
});

function request(path: string, mode: string, destination: string) {
  const respondWith = vi.fn();
  handlers.get("fetch")?.({
    request: { url: origin + path, method: "GET", mode, destination },
    respondWith,
  });
  return respondWith;
}

it("caches immutable Next styles so that the offline fallback can render them", async () => {
  const style = new Response("body { color: black; }", {
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
  fetchResponse.mockResolvedValueOnce(style);
  match.mockResolvedValueOnce(undefined);
  put.mockResolvedValueOnce(undefined);
  const path = "/_next/static/chunks/fingerprint.css";
  const first = request(path, "no-cors", "style");
  expect(first).toHaveBeenCalledOnce();
  await expect(first.mock.calls[0][0]).resolves.toBe(style);
  expect(put).toHaveBeenCalledOnce();

  match.mockResolvedValueOnce(style);
  const second = request(path, "no-cors", "style");
  await expect(second.mock.calls[0][0]).resolves.toBe(style);
  expect(fetchResponse).toHaveBeenCalledOnce();
});

it("leaves API calls and page scripts out of the service worker cache", () => {
  expect(request("/api/notifications", "cors", "")).not.toHaveBeenCalled();
  expect(request("/_next/static/chunks/page.js", "no-cors", "script")).not.toHaveBeenCalled();
  expect(put).not.toHaveBeenCalled();
});

it("accepts a push containing JSON null and falls back to the home screen", () => {
  handlers.get("push")?.({ data: { json: () => null }, waitUntil: vi.fn() });
  expect(showNotification).toHaveBeenCalledWith("CROWN", expect.objectContaining({
    data: { url: origin + "/inicio", notificationId: null },
  }));
});
