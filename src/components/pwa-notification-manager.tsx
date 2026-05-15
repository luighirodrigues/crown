"use client";

import { useEffect, useState } from "react";
import { BellOff, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { getPwaInstallState, getPushSupportState, type PushSupportReason } from "@/lib/push/support";

type PushStatus = "checking" | "unsupported" | "insecure" | "idle" | "enabled" | "blocked" | "disabled" | "error";

type VapidPublicKeyResponse =
  | { publicKey: string; enabled?: true }
  | { enabled: false; publicKey: null; message: string; missing?: string[] };

const statusLabels: Record<PushStatus, string> = {
  checking: "Verificando notificacoes",
  unsupported: "Notificacoes indisponiveis neste navegador",
  insecure: "Notificacoes exigem HTTPS",
  idle: "Ative notificacoes neste dispositivo",
  enabled: "Notificacoes ativas neste dispositivo",
  blocked: "Notificacoes bloqueadas pelo navegador",
  disabled: "Notificacoes push desativadas no servidor",
  error: "Nao foi possivel configurar notificacoes",
};

const RESUBSCRIBE_STATE_CACHE = "crown-pwa-state-v1";
const RESUBSCRIBE_FLAG_URL = "/__crown_sw_state__/push-resubscribe-needed";

function getBrowserPushSupport() {
  if (typeof window === "undefined") {
    return { supported: false, reason: "unsupported" as const };
  }

  return getPushSupportState({
    isSecureContext: window.isSecureContext,
    hasServiceWorker: "serviceWorker" in navigator,
    hasPushManager: "PushManager" in window,
    hasNotification: "Notification" in window,
  });
}

function getBrowserPwaInstallState() {
  if (typeof window === "undefined") {
    return { installed: false };
  }

  return getPwaInstallState({
    hasStandaloneDisplayMode: window.matchMedia("(display-mode: standalone)").matches,
    hasNavigatorStandalone: Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
  });
}

function getUnsupportedMessage(reason: PushSupportReason) {
  if (reason === "insecure") {
    return "Abra o PWA pelo dominio HTTPS de producao. Em HTTP no telefone, o navegador bloqueia notificacoes push.";
  }

  return "Este navegador ainda nao permite notificacoes push para PWA. No iPhone, instale o app na Tela de Inicio e abra por la.";
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function getRegistration() {
  const existing = await navigator.serviceWorker.getRegistration("/");
  return existing ?? navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

async function postSubscription(subscription: PushSubscription) {
  const response = await fetch("/api/push/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(subscription.toJSON()),
  });

  if (!response.ok) {
    throw new Error("Failed to save push subscription");
  }
}

async function consumeResubscribeFlag() {
  if (!("caches" in window)) {
    return false;
  }

  try {
    const cache = await caches.open(RESUBSCRIBE_STATE_CACHE);
    const request = new Request(RESUBSCRIBE_FLAG_URL);
    const response = await cache.match(request);

    if (!response) {
      return false;
    }

    await cache.delete(request);
    return true;
  } catch {
    return false;
  }
}

export function PwaNotificationManager() {
  const { status: sessionStatus } = useSession();
  const [status, setStatus] = useState<PushStatus>("checking");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [installChecked, setInstallChecked] = useState(false);
  const [isInstalledApp, setIsInstalledApp] = useState(false);

  useEffect(() => {
    if (sessionStatus !== "authenticated") {
      setInstallChecked(false);
      setIsInstalledApp(false);
      return;
    }

    const installState = getBrowserPwaInstallState();
    setInstallChecked(true);
    setIsInstalledApp(installState.installed);

    if (!installState.installed) {
      return;
    }

    const support = getBrowserPushSupport();
    if (!support.supported) {
      setStatus(support.reason === "insecure" ? "insecure" : "unsupported");
      setMessage(getUnsupportedMessage(support.reason));
      return;
    }

    let cancelled = false;

    async function registerAndReadState() {
      try {
        const registration = await getRegistration();
        const hasResubscribeFlag = await consumeResubscribeFlag();
        const subscription = await registration.pushManager.getSubscription();

        if (cancelled) {
          return;
        }

        if (hasResubscribeFlag) {
          if (subscription) {
            await postSubscription(subscription);
            if (!cancelled) {
              setStatus("enabled");
              setMessage("Assinatura de notificacoes renovada neste dispositivo.");
            }
          } else {
            setStatus("idle");
            setMessage("Sua assinatura mudou. Ative novamente para continuar recebendo avisos.");
          }

          return;
        }

        if (Notification.permission === "denied") {
          setStatus("blocked");
        } else if (subscription) {
          setStatus("enabled");
        } else {
          setStatus("idle");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Erro ao registrar o service worker.");
        }
      }
    }

    registerAndReadState();

    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "CROWN_PUSH_SUBSCRIPTION_CHANGE") {
        setStatus("idle");
        setMessage("Sua assinatura mudou. Ative novamente para continuar recebendo avisos.");
      }
    }

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [sessionStatus]);

  if (sessionStatus !== "authenticated" || !installChecked || !isInstalledApp || status === "enabled") {
    return null;
  }

  async function enableNotifications() {
    if (busy) {
      return;
    }

    const support = getBrowserPushSupport();
    if (!support.supported) {
      setStatus(support.reason === "insecure" ? "insecure" : "unsupported");
      setMessage(getUnsupportedMessage(support.reason));
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const keyResponse = await fetch("/api/push/vapid-public-key", {
        credentials: "same-origin",
      });

      if (!keyResponse.ok) {
        throw new Error("Failed to load VAPID public key");
      }

      const keyData = (await keyResponse.json()) as VapidPublicKeyResponse;
      if (!keyData.publicKey) {
        setStatus("disabled");
        setMessage("message" in keyData ? keyData.message : statusLabels.disabled);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setStatus("blocked");
        setMessage("Permissao bloqueada. Ajuste nas configuracoes do navegador.");
        return;
      }

      if (permission !== "granted") {
        setStatus("idle");
        setMessage("Permissao nao concedida.");
        return;
      }

      const registration = await getRegistration();
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
        }));

      await postSubscription(subscription);
      setStatus("enabled");
      setMessage("Voce recebera avisos importantes da CROWN.");
    } catch {
      setStatus("error");
      setMessage("Nao foi possivel ativar notificacoes agora.");
    } finally {
      setBusy(false);
    }
  }

  const isBlocked = status === "blocked";
  const canEnable = !busy && !isBlocked && status !== "checking";
  const isPrompt = status === "idle";

  return (
    <div className="fixed left-3 right-3 bottom-20 z-40 mx-auto max-w-sm sm:left-auto sm:right-5 sm:bottom-5">
      <div
        className={cn(
          "rounded-2xl border bg-surface/95 shadow-[var(--shadow-card)] backdrop-blur",
          isPrompt ? "border-gold-500/40 px-4 py-3" : "border-gold-500/20 px-3 py-2"
        )}
      >
        {isPrompt && (
          <div className="mb-3 rounded-xl bg-gold-500/10 px-3 py-2">
            <p className="text-sm font-semibold text-brand-900">Receber avisos no telefone?</p>
            <p className="mt-1 text-xs leading-5 text-text-secondary">
              Toque em Ativar para o celular abrir a permissao nativa de notificacoes da CROWN.
            </p>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              "bg-muted/20 text-text-secondary"
            )}
          >
            {busy || status === "checking" ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <BellOff size={17} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-text-primary">{statusLabels[status]}</p>
            {message && <p className="mt-0.5 line-clamp-2 text-[11px] text-text-secondary">{message}</p>}
          </div>

          {canEnable && (
            <button
              type="button"
              onClick={enableNotifications}
              className={cn(
                "shrink-0 rounded-full bg-brand-900 text-xs font-semibold text-gold-500 transition-colors hover:bg-brand-800",
                isPrompt ? "px-4 py-2" : "px-3 py-1.5"
              )}
            >
              Ativar
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
