"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { getPwaInstallState, getPushSupportState } from "@/lib/push/support";

type PushStatus = "checking" | "install" | "unsupported" | "insecure" | "idle" | "enabled" | "blocked" | "disabled" | "error";

type PushState = {
  status: PushStatus;
  message?: string;
  registration?: ServiceWorkerRegistration;
  publicKey?: string;
};

const statusLabels: Record<PushStatus, string> = {
  checking: "Verificando notificações",
  install: "Instale a CROWN para receber notificações",
  unsupported: "Notificações indisponíveis neste navegador",
  insecure: "Notificações exigem HTTPS",
  idle: "Ative notificações neste dispositivo",
  enabled: "Notificações ativas neste dispositivo",
  blocked: "Notificações bloqueadas pelo navegador",
  disabled: "Notificações push desativadas no servidor",
  error: "Não foi possível configurar notificações",
};

const RESUBSCRIBE_STATE_CACHE = "crown-pwa-state-v1";
const RESUBSCRIBE_FLAG_URL = "/__crown_sw_state__/push-resubscribe-needed";
const RENEW_MESSAGE = "Sua assinatura mudou. Ative novamente para continuar recebendo avisos.";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(base64), (character) => character.charCodeAt(0));
}

function waitForActiveWorker(registration: ServiceWorkerRegistration) {
  if (registration.active) {
    return Promise.resolve(registration);
  }

  const worker = registration.installing ?? registration.waiting;
  if (!worker) {
    return Promise.reject(new Error("No service worker available"));
  }

  return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    function checkWorker() {
      if (worker?.state === "activated" || registration.active) {
        worker?.removeEventListener("statechange", checkWorker);
        resolve(registration);
      } else if (worker?.state === "redundant") {
        worker.removeEventListener("statechange", checkWorker);
        reject(new Error("Service worker did not activate"));
      }
    }

    worker.addEventListener("statechange", checkWorker);
    checkWorker();
  });
}

async function readResubscribeFlag() {
  try {
    const cache = await caches.open(RESUBSCRIBE_STATE_CACHE);
    return Boolean(await cache.match(RESUBSCRIBE_FLAG_URL));
  } catch {
    return false;
  }
}

async function clearResubscribeFlag() {
  try {
    const cache = await caches.open(RESUBSCRIBE_STATE_CACHE);
    await cache.delete(RESUBSCRIBE_FLAG_URL);
  } catch {
    // Cache access is optional. The server still holds the subscription state.
  }
}

async function getOwnedSubscription(subscription: PushSubscription, signal: AbortSignal) {
  const response = await fetch("/api/push/subscriptions", {
    cache: "no-store",
    headers: { "X-Crown-Push-Endpoint": subscription.endpoint },
    signal,
  });
  if (!response.ok) {
    throw new Error("Failed to verify push subscription");
  }

  const data: { enabled: boolean } = await response.json();
  return data.enabled;
}

async function getVapidKey(signal: AbortSignal) {
  const response = await fetch("/api/push/vapid-public-key", { cache: "no-store", signal });
  if (!response.ok) {
    throw new Error("Failed to load the VAPID public key");
  }

  const data: { publicKey: string | null } = await response.json();
  return data.publicKey;
}

export function PwaNotificationManager() {
  const { data: session, status } = useSession();
  const userId = status === "authenticated" ? session?.user.id : undefined;

  useEffect(() => {
    if (window.isSecureContext && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // The notification controls surface registration errors when opened in the app.
      });
    }
  }, []);

  return userId ? <DevicePushControls key={userId} userId={userId} /> : null;
}

function DevicePushControls({ userId }: { userId: string }) {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const install = getPwaInstallState({
      hasStandaloneDisplayMode: window.matchMedia("(display-mode: standalone)").matches,
      hasNavigatorStandalone: Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
      userAgent: navigator.userAgent,
      maxTouchPoints: navigator.maxTouchPoints,
    });

    const controller = new AbortController();
    const { signal } = controller;
    let renewalRequested = false;
    let currentRead = 0;

    async function readDeviceState() {
      const read = ++currentRead;
      function updateState(value: PushState) {
        if (!signal.aborted && read === currentRead) {
          setState(value);
        }
      }

      if (!install.installed) {
        if (install.needsHomeScreenInstall) {
          updateState({
            status: "install",
            message: 'No menu Compartilhar, escolha "Adicionar à Tela de Início" e abra a CROWN pelo ícone.',
          });
        }
        return;
      }

      const support = getPushSupportState({
        isSecureContext: window.isSecureContext,
        hasServiceWorker: "serviceWorker" in navigator,
        hasPushManager: "PushManager" in window,
        hasNotification: "Notification" in window,
      });

      if (!support.supported) {
        updateState({
          status: support.reason,
          message: support.reason === "insecure"
            ? "Abra a CROWN pelo endereço HTTPS."
            : "Use um navegador e sistema compatíveis com notificações push.",
        });
        return;
      }

      updateState({ status: "checking" });
      try {
        const existingRegistration = await navigator.serviceWorker.getRegistration("/");
        const registration = await waitForActiveWorker(existingRegistration ??
          await navigator.serviceWorker.register("/sw.js", { scope: "/" }));

        if (Notification.permission === "denied") {
          updateState({
            status: "blocked",
            message: "Altere a permissão nas configurações do navegador ou do sistema.",
          });
          return;
        }

        const [renew, subscription] = await Promise.all([
          readResubscribeFlag(),
          registration.pushManager.getSubscription(),
        ]);

        const owned = subscription && Notification.permission === "granted" &&
          !renew && !renewalRequested && await getOwnedSubscription(subscription, signal);
        if (owned && !renewalRequested) {
          updateState({ status: "enabled", registration });
          return;
        }

        const publicKey = await getVapidKey(signal);
        updateState(publicKey
          ? { status: "idle", registration, publicKey, message: renew || renewalRequested ? RENEW_MESSAGE : undefined }
          : { status: "disabled" });
      } catch {
        updateState({ status: "error", message: "Tente verificar as notificações novamente." });
      }
    }

    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "CROWN_PUSH_SUBSCRIPTION_CHANGE") {
        renewalRequested = true;
        void readDeviceState();
      }
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleMessage);
    }
    void readDeviceState();

    return () => {
      controller.abort();
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      }
    };
  }, [attempt]);

  async function enableNotifications() {
    if (busy || !state?.registration || !state.publicKey) {
      return;
    }

    const { registration, publicKey } = state;
    setBusy(true);

    try {
      // Safari requires the permission request to start in the click gesture.
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setState({ status: "blocked", message: "Altere a permissão nas configurações do navegador ou do sistema." });
        return;
      }
      if (permission !== "granted") {
        setState({ ...state, message: "Permissão não concedida." });
        return;
      }

      const subscription = await registration.pushManager.getSubscription() ??
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

      const response = await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...subscription.toJSON(), expectedUserId: userId }),
      });
      if (!response.ok) {
        throw new Error("Failed to save push subscription");
      }

      await clearResubscribeFlag();
      setState({ status: "enabled", registration, publicKey });
    } catch {
      setState({ ...state, status: "error", message: "Não foi possível ativar notificações agora." });
    } finally {
      setBusy(false);
    }
  }

  async function disableNotifications() {
    if (busy || !state?.registration) {
      return;
    }

    const { registration } = state;
    setBusy(true);

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const unsubscribed = await subscription.unsubscribe();
        if (!unsubscribed && (await registration.pushManager.getSubscription())?.endpoint === subscription.endpoint) {
          throw new Error("The browser did not remove the push subscription");
        }

        await fetch("/api/push/subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint, expectedUserId: userId }),
        }).catch(() => {
          // The browser already stopped delivery. The server removes expired endpoints on send.
        });
      }

      await clearResubscribeFlag();
      setAttempt((value) => value + 1);
    } catch {
      setState({ ...state, message: "Não foi possível concluir a desativação. Tente novamente." });
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return null;
  }

  const { status, message } = state;
  const isPrompt = status === "idle";
  const hasEnableAction = Boolean(state.publicKey && state.registration) && (isPrompt || status === "error");
  const showRetry = status === "disabled" || (status === "error" && !hasEnableAction);
  const StatusIcon = status === "enabled" ? Bell : BellOff;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-40 mx-auto max-w-sm sm:bottom-5 sm:left-auto sm:right-24">
      <div
        className={cn(
          "rounded-2xl border bg-surface/95 shadow-[var(--shadow-card)] backdrop-blur",
          isPrompt ? "border-gold-500/40 px-4 py-3" : "border-gold-500/20 px-3 py-2"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/20 text-text-secondary">
            {busy || status === "checking" ? (
              <Loader2 size={17} className="animate-spin" aria-hidden="true" />
            ) : (
              <StatusIcon size={17} aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0 flex-1" role="status">
            <p className="text-xs font-semibold text-text-primary">{statusLabels[status]}</p>
            {message && <p className="mt-0.5 text-[11px] text-text-secondary">{message}</p>}
          </div>

          {hasEnableAction && (
            <button
              type="button"
              disabled={busy}
              onClick={enableNotifications}
              className="shrink-0 rounded-full bg-brand-900 px-4 py-2 text-xs font-semibold text-gold-500 transition-colors hover:bg-brand-800 disabled:opacity-50"
            >
              Ativar
            </button>
          )}
          {status === "enabled" && (
            <button
              type="button"
              disabled={busy}
              onClick={disableNotifications}
              className="shrink-0 rounded-full bg-muted/20 px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-muted/30 disabled:opacity-50"
            >
              Desativar
            </button>
          )}
          {showRetry && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setAttempt((value) => value + 1)}
              className="shrink-0 rounded-full bg-muted/20 px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-muted/30 disabled:opacity-50"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
