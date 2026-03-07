"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";

interface ChipProps {
  label: string;
  icon?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ label, icon, active = false, onClick, className }: ChipProps) {
  // Dynamically resolve icon
  const IconComponent = icon
    ? (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>>)[
        toPascalCase(icon)
      ]
    : null;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl min-w-[72px]",
        "transition-all duration-200 shrink-0",
        active
          ? "bg-brand-900 text-white shadow-sm"
          : "bg-transparent border border-muted/50 text-text-secondary hover:border-brand-100",
        className
      )}
    >
      {IconComponent && (
        <IconComponent size={20} strokeWidth={active ? 2 : 1.6} />
      )}
      <span className={cn("text-[11px] leading-none whitespace-nowrap", active ? "font-semibold" : "font-medium")}>
        {label}
      </span>
    </motion.button>
  );
}

function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}
