"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { Ritual } from "@/lib/types";

interface RitualCardProps {
  ritual: Ritual;
  delay?: number;
  variant?: "full" | "compact";
  onCheckIn?: () => void;
}

export function RitualCard({ ritual, delay = 0, variant = "full", onCheckIn }: RitualCardProps) {
  const progress = ritual.totalDays > 0 ? (ritual.completedDays / ritual.totalDays) * 100 : 0;
  const isActive = new Date(ritual.endAt) >= new Date();

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay, ease: "easeOut" }}
        className="flex items-center gap-3 p-3 bg-surface rounded-xl shadow-[var(--shadow-card)] min-w-[260px] shrink-0"
      >
        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ritual.imageUrl} alt={ritual.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-text-primary truncate">{ritual.name}</h4>
          <p className="text-[11px] text-text-secondary mt-0.5">{ritual.monthLabel}</p>
          <div className="mt-1.5 h-1 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-900 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-surface rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-card)]"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ritual.imageUrl}
          alt={ritual.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <span className="text-[11px] font-medium text-white/80">{ritual.monthLabel}</span>
          <h3 className="text-[16px] font-bold text-white leading-snug">{ritual.name}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2 mb-3">
          {ritual.description}
        </p>

        {/* Progress */}
        <div className="flex items-center justify-between text-[11px] mb-2">
          <span className="text-text-secondary">
            {ritual.completedDays}/{ritual.totalDays} dias
          </span>
          <span className="text-text-secondary font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-muted/25 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              progress === 100 ? "bg-success-500" : "bg-brand-900"
            )}
          />
        </div>

        {/* CTA */}
        {isActive ? (
          <button
            onClick={onCheckIn}
            className="w-full py-2.5 rounded-[var(--radius-btn)] bg-brand-900 text-white text-[13px] font-semibold hover:bg-brand-800 transition-colors"
          >
            Fazer check-in
          </button>
        ) : (
          <div className="flex items-center justify-center py-2.5 text-[13px] font-medium text-success-500">
            ✓ Concluído
          </div>
        )}
      </div>
    </motion.div>
  );
}
