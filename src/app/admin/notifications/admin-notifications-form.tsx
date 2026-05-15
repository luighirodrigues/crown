"use client";

import { useState, useTransition } from "react";
import { Bell, Loader2, Send } from "lucide-react";

import { Card } from "@/components/card";

type BroadcastResult = {
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

const emptyForm: FormState = {
  title: "",
  body: "",
  linkUrl: "",
};

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AdminNotificationsForm() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idempotencyKey: createIdempotencyKey(),
            title: form.title,
            body: form.body,
            linkUrl: form.linkUrl || null,
          }),
        });
        const payload = await response.json();

        if (!response.ok) {
          setError(payload.error || "Erro ao enviar notificação");
          return;
        }

        setResult(payload);
        setForm(emptyForm);
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
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            maxLength={120}
            required
            className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
          />

          <textarea
            placeholder="Mensagem"
            value={form.body}
            onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
            maxLength={2000}
            required
            rows={5}
            className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30 resize-none"
          />

          <input
            type="text"
            placeholder="Link interno opcional, ex: /inicio"
            value={form.linkUrl}
            onChange={(event) => setForm((current) => ({ ...current, linkUrl: event.target.value }))}
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
