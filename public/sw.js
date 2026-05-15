const CACHE_NAME = "crown-pwa-v1";
const STATE_CACHE_NAME = "crown-pwa-state-v1";
const CACHE_PREFIX = "crown-pwa-";
const OFFLINE_URL = "/offline";
const FALLBACK_URL = "/inicio";
const RESUBSCRIBE_FLAG_URL = "/__crown_sw_state__/push-resubscribe-needed";

function isBypassedNavigation(url) {
  return (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes("auth/session") ||
    url.pathname.startsWith("/_next/")
  );
}

function getSameOriginUrl(rawUrl) {
  if (typeof rawUrl !== "string" || rawUrl.length === 0) {
    return new URL(FALLBACK_URL, self.location.origin).href;
  }

  try {
    const url = new URL(rawUrl, self.location.origin);
    return url.origin === self.location.origin
      ? url.href
      : new URL(FALLBACK_URL, self.location.origin).href;
  } catch {
    return new URL(FALLBACK_URL, self.location.origin).href;
  }
}

function isOutdatedOwnedCache(cacheName) {
  return (
    cacheName.startsWith(CACHE_PREFIX) &&
    cacheName !== CACHE_NAME &&
    cacheName !== STATE_CACHE_NAME
  );
}

async function persistResubscribeNeededFlag(event) {
  const cache = await caches.open(STATE_CACHE_NAME);
  await cache.put(
    new Request(RESUBSCRIBE_FLAG_URL),
    new Response(
      JSON.stringify({
        needed: true,
        reason: "pushsubscriptionchange",
        hasNewSubscription: Boolean(event.newSubscription),
        updatedAt: new Date().toISOString(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    )
  );
}

async function notifyOpenClientsOfSubscriptionChange() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((client) => {
    client.postMessage({ type: "CROWN_PUSH_SUBSCRIPTION_CHANGE" });
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(isOutdatedOwnedCache)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET" || request.mode !== "navigate") {
    return;
  }

  const url = new URL(request.url);
  if (isBypassedNavigation(url)) {
    return;
  }

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      const offlineResponse = await cache.match(OFFLINE_URL);
      return offlineResponse || Response.redirect(OFFLINE_URL, 302);
    })
  );
});

self.addEventListener("push", (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || "CROWN";
  const options = {
    body: payload.body || "Voce tem uma nova notificacao.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.notificationId || undefined,
    renotify: Boolean(payload.notificationId),
    data: {
      url: getSameOriginUrl(payload.url),
      notificationId: payload.notificationId || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = getSameOriginUrl(event.notification.data && event.notification.data.url);

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && "focus" in client) {
          if ("navigate" in client) {
            return client.navigate(targetUrl).then(() => client.focus());
          }

          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    Promise.all([
      persistResubscribeNeededFlag(event),
      notifyOpenClientsOfSubscriptionChange(),
    ])
  );
});
