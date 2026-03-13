"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Bell, LogOut, ChevronLeft, Shield } from "lucide-react";
import Link from "next/link";
import { NotificationsPanel } from "@/components/notifications-panel";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightActions?: React.ReactNode;
  variant?: "default" | "welcome";
}

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  rightActions,
  variant = "default",
}: AppHeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.unreadCount) setUnreadCount(data.unreadCount);
      })
      .catch(() => {});
  }, []);

  return (
    <>
    <header
      className={cn(
        "sticky top-0 z-40 px-4 py-3 flex items-center justify-between",
        "bg-brand-900 text-white"
      )}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => window.history.back()}
            className="p-1 -ml-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <div>
          {variant === "welcome" && (
            <span className="text-[11px] font-medium tracking-wide opacity-80 uppercase">
              Comunidade
            </span>
          )}
          <h1 className={cn(
            "font-semibold leading-tight",
            variant === "welcome" ? "text-lg" : "text-[17px]"
          )}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs opacity-70 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {rightActions || (
          <>
            {isAdmin && (
              <Link
                href="/admin/approvals"
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Admin"
              >
                <Shield size={18} />
              </Link>
            )}
            <button
              onClick={() => setNotifOpen(true)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-gold-500 text-[9px] font-bold text-brand-900 rounded-full">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </>
        )}
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
