import { afterEach, expect, it, vi } from "vitest";
import { signOutCurrentDevice } from "./sign-out";

const signOut = vi.hoisted(() => vi.fn());
vi.mock("next-auth/react", () => ({ signOut }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("removes the current device subscription before ending the session", async () => {
  const unsubscribe = vi.fn().mockResolvedValue(true);
  const close = vi.fn();
  const endpoint = "https://fcm.googleapis.com/fcm/send/device";
  vi.stubGlobal("navigator", { serviceWorker: {
    getRegistration: async () => ({
      pushManager: { getSubscription: async () => ({ endpoint, unsubscribe }) },
      getNotifications: async () => [{ close }],
    }),
  } });
  const request = vi.fn().mockRejectedValue(new Error("offline"));
  vi.stubGlobal("fetch", request);

  await signOutCurrentDevice();

  expect(request).toHaveBeenCalledWith("/api/push/subscriptions", expect.objectContaining({
    method: "DELETE",
    body: JSON.stringify({ endpoint }),
  }));
  expect(close).toHaveBeenCalledOnce();
  expect(unsubscribe).toHaveBeenCalledBefore(signOut);
  expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/auth/signin" });
});
