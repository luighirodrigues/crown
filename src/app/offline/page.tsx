import Link from "next/link";
import { Crown, WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-bg px-5 py-8 text-text-primary">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-sm flex-col justify-center">
        <div className="rounded-[28px] border border-white/70 bg-surface p-6 shadow-[var(--shadow-card)]">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-text-secondary">
                Comunidade
              </p>
              <h1 className="mt-1 text-2xl font-bold text-brand-900">CROWN</h1>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-900 text-white shadow-[0_12px_28px_rgba(153,18,32,0.22)]">
              <Crown size={24} aria-hidden="true" />
            </div>
          </div>

          <div className="rounded-[24px] bg-bg px-5 py-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-900/10 text-brand-900">
              <WifiOff size={26} aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary">Voce esta offline</h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              A comunidade CROWN precisa de conexao para carregar conteudos atualizados. Confira sua internet e tente novamente.
            </p>
          </div>

          <Link
            href="/inicio"
            className="mt-6 flex w-full items-center justify-center rounded-[var(--radius-btn)] bg-brand-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Tentar novamente
          </Link>
        </div>
      </section>
    </main>
  );
}
