"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Heart, MessageCircle, Reply, CheckCircle, Calendar, Megaphone, Check } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { normalizeNotificationUrl } from "@/lib/push/url";

interface Notification {
  id: string;
  type: "LIKE" | "COMMENT" | "REPLY" | "APPROVAL" | "EVENT" | "SYSTEM";
  title: string;
  body: string;
  linkUrl: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

const typeIcon: Record<Notification["type"], React.ReactNode> = {
  LIKE: <Heart size={16} className="text-danger-400" />,
  COMMENT: <MessageCircle size={16} className="text-brand-800" />,
  REPLY: <Reply size={16} className="text-brand-800" />,
  APPROVAL: <CheckCircle size={16} className="text-success-500" />,
  EVENT: <Calendar size={16} className="text-gold-500" />,
  SYSTEM: <Megaphone size={16} className="text-text-secondary" />,
};

export function NotificationsPanel({ open, onClose, onUnreadCountChange }: NotificationsPanelProps) {
  const router = useRouter();
  const [loadedNotifications, setNotifications] = useState<Notification[] | null>(null);
  const notifications = loadedNotifications ?? [];

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetch("/api/notifications", { signal: controller.signal })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (controller.signal.aborted) return;
        if (data) {
          setNotifications(data.notifications);
          onUnreadCountChange?.(data.unreadCount);
        } else {
          setNotifications([]);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setNotifications([]);
      });
    return () => controller.abort();
  }, [open, onUnreadCountChange]);

  async function markAllAsRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
    onUnreadCountChange?.(0);
  }

  async function markAsRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev?.map((n) => n.id === id ? { ...n, read: true } : n) ?? null);
    const remaining = notifications.filter((n) => !n.read && n.id !== id).length;
    onUnreadCountChange?.(remaining);
  }

  const hasUnread = notifications.some((n) => !n.read);

  function closePanel() {
    setNotifications(null);
    onClose();
  }

  function openNotification(notification: Notification) {
    if (!notification.read) void markAsRead(notification.id).catch(() => {});
    if (notification.linkUrl) {
      closePanel();
      router.push(normalizeNotificationUrl(notification.linkUrl, window.location.origin));
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={closePanel}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[61] max-h-[85vh] bg-bg rounded-t-2xl overflow-hidden flex flex-col"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-muted/40 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-brand-900" />
                <h2 className="text-[17px] font-semibold text-text-primary">Notificações</h2>
              </div>
              <div className="flex items-center gap-2">
                {hasUnread && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-brand-800 font-medium px-2 py-1 rounded-full hover:bg-brand-100/30 transition-colors"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  onClick={closePanel}
                  aria-label="Fechar notificações"
                  className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center text-text-secondary hover:bg-muted/30 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 pb-safe">
              {loadedNotifications === null ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-brand-900 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                  <Bell size={32} className="mb-3 opacity-40" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                <ul>
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        disabled={n.read && !n.linkUrl}
                        onClick={() => openNotification(n)}
                        className={`flex w-full gap-3 text-left px-4 py-3 border-b border-muted/20 transition-colors ${
                          !n.read
                            ? "bg-brand-100/10 cursor-pointer hover:bg-brand-100/20"
                            : n.linkUrl ? "cursor-pointer hover:bg-brand-100/20" : ""
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                          {typeIcon[n.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm leading-tight ${!n.read ? "font-semibold text-text-primary" : "text-text-primary"}`}>
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-brand-800 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                            {n.body}
                          </p>
                          <p className="text-[11px] text-muted mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
