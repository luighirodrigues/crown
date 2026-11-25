"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOutCurrentDevice } from "@/lib/push/sign-out";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { NotificationsPanel } from "@/components/notifications-panel";
import {
  Home,
  Users,
  BookOpen,
  Sparkles,
  CalendarDays,
  Bell,
  LogOut,
  Shield,
  Hash,
  Search,
} from "lucide-react";

const navItems = [
  { href: "/inicio", label: "Mural", icon: Home },
  { href: "/comunidade", label: "Comunidade", icon: Users },
  { href: "/rituais", label: "Rituais", icon: Sparkles },
  { href: "/cursos", label: "Cursos", icon: BookOpen },
  { href: "/membros", label: "Membros", icon: Users },
  { href: "/inicio", label: "Agenda", icon: CalendarDays },
  { href: "/comunidade?view=channels", label: "Canais", icon: Hash, badge: true },
];

export function DesktopHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";
  const userName = session?.user?.name ?? "Rainha";
  const userImage = session?.user?.image ?? "";

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [channelCount, setChannelCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.unreadCount) setUnreadCount(data.unreadCount);
      })
      .catch(() => {});

    fetch("/api/channels")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setChannelCount(data.length);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface border-b border-muted/20 shadow-sm">
        <div className="desktop-container flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/inicio" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo.png"
              alt="CROWN"
              width={120}
              height={36}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>

          {/* Center: Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.label === "Comunidade"
                  ? pathname?.startsWith("/comunidade") && !item.badge
                  : item.label === "Canais"
                    ? false
                    : item.label === "Agenda"
                      ? false
                      : item.label === "Membros"
                        ? pathname?.startsWith("/membros")
                        : pathname === item.href ||
                          (item.href !== "/" && pathname?.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors relative",
                    isActive
                      ? "text-brand-900 bg-brand-900/5"
                      : "text-text-secondary hover:text-brand-900 hover:bg-brand-900/5"
                  )}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span
                    className={cn(
                      "text-[13px]",
                      isActive ? "font-semibold" : "font-medium"
                    )}
                  >
                    {item.label}
                  </span>
                  {item.badge && channelCount > 0 && (
                    <span className="ml-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-brand-900 text-[9px] font-bold text-white rounded-full">
                      {channelCount}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-brand-900 rounded-t-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              className="p-2 rounded-full hover:bg-surface-alt transition-colors text-text-secondary hover:text-brand-900"
              title="Buscar"
            >
              <Search size={18} />
            </button>
            {isAdmin && (
              <Link
                href="/admin/approvals"
                className="p-2 rounded-full hover:bg-surface-alt transition-colors text-text-secondary hover:text-brand-900"
                title="Admin"
              >
                <Shield size={18} />
              </Link>
            )}
            <button
              onClick={() => setNotifOpen(true)}
              aria-label="Notificações"
              className="p-2 rounded-full hover:bg-surface-alt transition-colors text-text-secondary hover:text-brand-900 relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-brand-900 text-[9px] font-bold text-white rounded-full">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <div className="w-px h-8 bg-muted/20 mx-1" />

            <Link
              href="/perfil"
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-alt transition-colors"
            >
              <UserAvatar src={userImage} name={userName} size="sm" />
              <span className="text-[13px] font-medium text-text-primary max-w-[120px] truncate">
                {userName}
              </span>
            </Link>

            <button
              onClick={signOutCurrentDevice}
              className="p-2 rounded-full hover:bg-surface-alt transition-colors text-text-secondary hover:text-brand-900"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <NotificationsPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />
    </>
  );
}
