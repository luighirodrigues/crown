import { signOut } from "next-auth/react";

async function clearDevicePush() {
  const registration = await navigator.serviceWorker?.getRegistration();
  if (!registration) return;

  await Promise.allSettled([
    registration.getNotifications?.().then((notifications) => {
      notifications.forEach((notification) => notification.close());
    }),
    registration.pushManager?.getSubscription().then(async (subscription) => {
      if (!subscription) return;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      try {
        await Promise.allSettled([
          subscription.unsubscribe(),
          fetch("/api/push/subscriptions", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
            signal: controller.signal,
          }),
        ]);
      } finally {
        clearTimeout(timer);
      }
    }),
  ]);
}

export async function signOutCurrentDevice() {
  try {
    await clearDevicePush();
  } finally {
    return signOut({ callbackUrl: "/auth/signin" });
  }
}
