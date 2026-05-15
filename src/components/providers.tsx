"use client";

import { SessionProvider } from "next-auth/react";
import { LayoutVersionProvider } from "@/lib/layout-version";
import { PwaNotificationManager } from "@/components/pwa-notification-manager";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LayoutVersionProvider>
        {children}
        <PwaNotificationManager />
      </LayoutVersionProvider>
    </SessionProvider>
  );
}
