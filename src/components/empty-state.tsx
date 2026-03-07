"use client";

import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

interface EmptyStateProps {
  icon?: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

export function EmptyState({ icon = "inbox", message, ctaLabel, onCta, className }: EmptyStateProps) {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[
    toPascalCase(icon)
  ] || LucideIcons.Inbox;

  return (
    <div className={cn("flex flex-col items-center justify-center py-8 px-4 text-center", className)}>
      <div className="w-12 h-12 rounded-full bg-surface-alt flex items-center justify-center mb-3">
        <IconComponent size={24} className="text-muted" />
      </div>
      <p className="text-[13px] text-text-secondary leading-snug max-w-[240px]">{message}</p>
      {ctaLabel && (
        <button
          onClick={onCta}
          className="mt-3 px-4 py-2 rounded-[var(--radius-btn)] bg-brand-900 text-white text-[13px] font-semibold hover:bg-brand-800 transition-colors"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}
