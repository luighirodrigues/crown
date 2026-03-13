"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sparkles, Users } from "lucide-react";
import type { Ritual } from "@/lib/types";

interface RitualCardProps {
  ritual: Ritual;
  delay?: number;
  variant?: "full" | "compact";
  onCheckIn?: () => void;
  onViewParticipants?: () => void;
  onClick?: () => void;
}

export function RitualCard({ ritual, delay = 0, variant = "full", onCheckIn, onViewParticipants, onClick }: RitualCardProps) {
  const progress = ritual.totalDays > 0 ? (ritual.completedDays / ritual.totalDays) * 100 : 0;
  const isActive = new Date(ritual.endAt) >= new Date();

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay, ease: "easeOut" }}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 p-3 bg-surface rounded-xl shadow-[var(--shadow-card)] min-w-[260px] shrink-0",
          onClick && "cursor-pointer hover:shadow-md transition-shadow"
        )}
      >
        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-muted/20">
          {ritual.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ritual.imageUrl} alt={ritual.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted text-lg">🔥</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-text-primary truncate">{ritual.name}</h4>
          <p className="text-[11px] text-text-secondary mt-0.5">{ritual.monthLabel}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  progress === 100 ? "bg-success-500" : "bg-brand-900"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-text-secondary shrink-0">
              {Math.round(progress)}%
            </span>
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
      className="bg-surface rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-card)] border border-muted/20"
    >
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900" />

      <div className="p-4 pb-0">
        {/* Header: icon + badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <Sparkles size={20} className="text-amber-600" />
          </div>
          {isActive && (
            <span className="text-[11px] font-semibold text-brand-900 bg-brand-900/8 px-2.5 py-1 rounded-full">
              Disponível
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-[16px] font-bold text-text-primary leading-snug mb-1">
          {ritual.name}
        </h3>

        {/* Description */}
        <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2 mb-3">
          {ritual.description}
        </p>
      </div>

      {/* Image */}
      {ritual.imageUrl && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden h-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ritual.imageUrl}
            alt={ritual.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Progress */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-text-secondary font-medium uppercase tracking-wide">Progresso</span>
          <span className="text-text-secondary font-semibold">
            {ritual.completedDays} / {ritual.totalDays}
          </span>
        </div>
        <div className="h-1.5 bg-muted/25 rounded-full overflow-hidden">
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
      </div>

      {/* Divider */}
      <div className="border-t border-muted/15 mx-4" />

      {/* Actions */}
      <div className="p-4 pt-3 space-y-2">
        {/* View participants */}
        <button
          onClick={onViewParticipants}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-btn)] border border-muted/25 text-text-secondary text-[13px] font-medium hover:bg-surface-alt transition-colors"
        >
          <Users size={15} />
          Ver Participantes ({ritual.participantCount})
        </button>

        {/* Check-in CTA */}
        {!isActive ? (
          <div className="flex items-center justify-center py-2.5 text-[13px] font-medium text-success-500">
            ✓ Concluído
          </div>
        ) : ritual.todayCheckedIn ? (
          <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-[var(--radius-btn)] bg-success-500/10 text-success-500 text-[13px] font-semibold">
            ✓ Check-in de hoje realizado
          </div>
        ) : (
          <button
            onClick={onCheckIn}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[var(--radius-btn)] bg-brand-900 text-white text-[13px] font-semibold hover:bg-brand-800 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Registrar Check-in
          </button>
        )}
      </div>
    </motion.div>
  );
}
