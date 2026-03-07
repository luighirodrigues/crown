"use client";

import { cn } from "@/lib/utils";
import type { ApprovalStatus } from "@/lib/types";

interface CrownBadgeProps {
  label: string;
  variant?: "gold" | "brand" | "neutral" | "success" | "danger";
  size?: "sm" | "md";
  className?: string;
}

export function CrownBadge({ label, variant = "neutral", size = "sm", className }: CrownBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full whitespace-nowrap",
        size === "sm" ? "text-[11px] px-2.5 py-0.5" : "text-[12px] px-3 py-1",
        variant === "gold" && "bg-gold-500/20 text-amber-700",
        variant === "brand" && "bg-brand-900/10 text-brand-900",
        variant === "neutral" && "bg-surface-alt text-text-secondary",
        variant === "success" && "bg-success-500/10 text-success-500",
        variant === "danger" && "bg-danger-400/10 text-danger-400",
        className
      )}
    >
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: ApprovalStatus }) {
  const config = {
    PENDING: { label: "Pendente", variant: "neutral" as const },
    APPROVED: { label: "Aprovada", variant: "success" as const },
    REJECTED: { label: "Reprovada", variant: "danger" as const },
  };
  const { label, variant } = config[status];
  return <CrownBadge label={label} variant={variant} />;
}
