"use client";

import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  badge?: string;
  className?: string;
}

export function SectionHeader({ title, actionLabel, onAction, badge, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      <div className="flex items-center gap-2">
        <h2 className="text-[16px] font-semibold text-text-primary">{title}</h2>
        {badge && (
          <span className="text-[11px] font-medium text-text-secondary bg-surface-alt px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      {actionLabel && (
        <button
          onClick={onAction}
          className="text-[13px] font-medium text-brand-900 hover:text-brand-800 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
