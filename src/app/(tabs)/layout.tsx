"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BottomNavigation } from "@/components/bottom-navigation";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    // Check if onboarding is complete
    fetch("/api/onboarding")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !data.onboardingComplete) {
          router.replace("/onboarding");
        } else {
          setChecked(true);
        }
      })
      .catch(() => setChecked(true));
  }, [status, router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-brand-900 border-t-transparent animate-spin" />
          <p className="text-[13px] text-text-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
