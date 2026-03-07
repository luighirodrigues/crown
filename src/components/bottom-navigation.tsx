"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Users, BookOpen, Sparkles, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/inicio", label: "Início", icon: Home },
  { href: "/comunidade", label: "Comunidade", icon: Users },
  { href: "/cursos", label: "Cursos", icon: BookOpen },
  { href: "/rituais", label: "Rituais", icon: Sparkles },
  { href: "/perfil", label: "Perfil", icon: UserCircle },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50",
        "bg-surface border-t border-muted/30",
        "shadow-[var(--shadow-nav)]",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/" && pathname?.startsWith(tab.href));
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-16 py-1 relative",
                "transition-colors duration-200",
                isActive ? "text-brand-900" : "text-muted"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute -top-[1px] left-3 right-3 h-[2.5px] bg-brand-900 rounded-b-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span
                className={cn(
                  "text-[10px] leading-none",
                  isActive ? "font-semibold" : "font-medium"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
