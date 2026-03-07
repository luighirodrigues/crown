"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // If already authenticated, redirect to app
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(searchParams.get("callbackUrl") || "/inicio");
    }
  }, [status, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const callbackUrl = searchParams.get("callbackUrl") || "/inicio";
    await signIn("nodemailer", { email, redirect: false, callbackUrl });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-card)]">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[var(--color-brand-900)]">
            CROWN
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Entre com seu e‑mail para receber o link de acesso
          </p>
        </div>

        {sent ? (
          <div className="rounded-[var(--radius-btn)] bg-[var(--color-success)]/10 p-4 text-center text-sm text-[var(--color-success)]">
            ✉️ Link enviado! Verifique sua caixa de entrada.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]"
              >
                E‑mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-[var(--radius-btn)] border border-[var(--color-surface-alt)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--color-brand-900)] focus:ring-1 focus:ring-[var(--color-brand-900)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[var(--radius-btn)] bg-[var(--color-brand-900)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-800)] disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Entrar com Magic Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
