"use client";

import { SessionProvider } from "next-auth/react";
import { LayoutVersionProvider } from "@/lib/layout-version";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LayoutVersionProvider>{children}</LayoutVersionProvider>
    </SessionProvider>
  );
}
