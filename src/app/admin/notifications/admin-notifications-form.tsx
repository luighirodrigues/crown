"use client";

import { useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Bell, Loader2, Send } from "lucide-react";

import { Card } from "@/components/card";

type BroadcastResult = {
  status: "PROCESSING" | "PUSH_PENDING" | "COMPLETED" | "COMPLETED_WITH_PUSH_ERRORS" | "FAILED";
  targetCount: number;
  inAppCount: number;
  pushAttemptCount: number;
  pushFailureCount: number;
  idempotent: boolean;
};

type FormState = {
  title: string;
  body: string;
  linkUrl: string;
};

type BroadcastAttempt = { idempotencyKey: string; form: FormState };

const emptyForm: FormState = {
  title: "",
  body: "",
  linkUrl: "",
};

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readSavedAttempt(storageKey: string) {
  try {
    return sessionStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function parseSavedAttempt(value: string | null): BroadcastAttempt | null {
  if (!value) return null;

  try {
    const attempt = JSON.parse(value) as Partial<BroadcastAttempt> | null;
    if (typeof attempt?.idempotencyKey === "string" &&
        typeof attempt.form?.title === "string" &&
        typeof attempt.form.body === "string" &&
        typeof attempt.form.linkUrl === "string") {
      return { idempotencyKey: attempt.idempotencyKey, form: attempt.form };
    }
  } catch {
    // Ignore an incomplete or old draft.
  }
  return null;
}

function saveAttempt(storageKey: string, attempt: BroadcastAttempt | null) {
  try {
    if (attempt) {
      sessionStorage.setItem(storageKey, JSON.stringify(attempt));
    } else {
      sessionStorage.removeItem(storageKey);
    }
  } catch {
    // The current page can still retry with its in-memory key.
  }
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AdminNotificationsForm({ userId }: { userId: string }) {
  const storageKey = `crown:admin-notification:${userId}`;
  const savedAttempt = parseSavedAttempt(useSyncExternalStore(
    subscribeToStorage,
    () => readSavedAttempt(storageKey),
    () => null,
  ));
  const currentAttempt = useRef<BroadcastAttempt | null>(null);
  const [draft, setDraft] = useState<FormState | null>(null);
  const form = draft ?? savedAttempt?.form ?? emptyForm;
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function editForm(changes: Partial<FormState>) {
    setDraft((current) => ({ ...(current ?? form), ...changes }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setError(null);

    const submittedForm = {
      title: form.title.trim(),
      body: form.body.trim(),
      linkUrl: form.linkUrl.trim(),
    };
    const previous = currentAttempt.current ?? parseSavedAttempt(readSavedAttempt(storageKey));
    const sameDraft = previous?.form.title === submittedForm.title &&
      previous.form.body === submittedForm.body && previous.form.linkUrl === submittedForm.linkUrl;
    const attempt = sameDraft ? previous : { idempotencyKey: createIdempotencyKey(), form: submittedForm };
    currentAttempt.current = attempt;
    saveAttempt(storageKey, attempt);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idempotencyKey: attempt.idempotencyKey,
            ...attempt.form,
            linkUrl: attempt.form.linkUrl || null,
          }),
        });
        const payload = await response.json();

        if (!response.ok) {
          setError(payload.error || "Erro ao enviar notificação");
          return;
        }

        if (payload.status === "PROCESSING" || payload.status === "PUSH_PENDING") {
          setError("O envio está em processamento. Tente novamente para consultar o resultado.");
          return;
        }

        if (payload.status === "FAILED") {
          currentAttempt.current = null;
          saveAttempt(storageKey, null);
          setDraft(attempt.form);
          setError("O envio falhou. Tente novamente.");
          return;
        }

        currentAttempt.current = null;
        saveAttempt(storageKey, null);
        setResult(payload);
        setDraft(emptyForm);
      } catch {
        setError("Erro ao enviar notificação");
      }
    });
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Notificações</h2>
        <p className="text-sm text-text-secondary mt-1">
          Envie um aviso global para integrantes ativas da comunidade.
        </p>
      </div>

      <Card className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Bell size={18} className="text-brand-900" />
            Nova notificação global
          </div>

          <input
            type="text"
            placeholder="Título"
            value={form.title}
            onChange={(event) => editForm({ title: event.target.value })}
            disabled={isPending}
            maxLength={120}
            required
            className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
          />

          <textarea
            placeholder="Mensagem"
            value={form.body}
            onChange={(event) => editForm({ body: event.target.value })}
            disabled={isPending}
            maxLength={2000}
            required
            rows={5}
            className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30 resize-none"
          />

          <input
            type="text"
            placeholder="Link interno opcional, ex: /inicio"
            value={form.linkUrl}
            onChange={(event) => editForm({ linkUrl: event.target.value })}
            disabled={isPending}
            className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
          />

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-900 text-white text-sm font-medium hover:bg-brand-800 disabled:opacity-50 transition-colors"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Enviar notificação
          </button>
        </form>
      </Card>

      {result ? (
        <Card className="p-4 border border-success-500/20 bg-success-500/5">
          <p className="text-sm font-semibold text-text-primary">Notificação enviada</p>
          <p className="text-xs text-text-secondary mt-1">
            {result.targetCount} alvos, {result.inAppCount} notificações no app, {result.pushAttemptCount} tentativas de push e {result.pushFailureCount} falhas.
          </p>
        </Card>
      ) : null}

      {error ? (
        <Card className="p-4 border border-danger-400/20 bg-danger-400/5">
          <p className="text-sm font-semibold text-danger-400">{error}</p>
        </Card>
      ) : null}
    </div>
  );
}
