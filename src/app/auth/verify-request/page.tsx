export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-card)] text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-900)]/10">
          <span className="text-3xl">✉️</span>
        </div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          Verifique seu e‑mail
        </h1>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          Enviamos um link de acesso para o seu e‑mail. Clique no link para
          entrar na plataforma.
        </p>
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Não recebeu? Verifique a pasta de spam ou tente novamente.
        </p>
      </div>
    </div>
  );
}
