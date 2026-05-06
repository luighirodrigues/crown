"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin/approvals", label: "Aprovações" },
  { href: "/admin/membros", label: "Membros" },
  { href: "/admin/permissoes", label: "Permissões" },
  { href: "/admin/points-rules", label: "Regras de Pontuação" },
  { href: "/admin/channels", label: "Canais" },
  { href: "/admin/rituals", label: "Rituais" },
  { href: "/admin/events", label: "Eventos" },
  { href: "/admin/courses", label: "Cursos" },
  { href: "/admin/missions", label: "Missões" },
  { href: "/admin/banners", label: "Banners" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-brand-900 text-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/inicio" className="p-1 -ml-1 hover:opacity-80">
            <ArrowLeft size={20} />
          </Link>
          <Shield size={20} />
          <h1 className="text-base font-semibold">Admin</h1>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="bg-surface border-b border-muted/30 px-4 py-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors",
                pathname === item.href
                  ? "bg-brand-900 text-white"
                  : "bg-surface-alt text-text-secondary hover:bg-muted/20"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="flex-1 bg-bg">{children}</main>
    </div>
  );
}
