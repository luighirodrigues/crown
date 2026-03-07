"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { StatusBadge } from "./crown-badge";
import { ChevronRight, Gem } from "lucide-react";
import type { Mission } from "@/lib/types";

interface MissionCardProps {
  mission: Mission;
  delay?: number;
}

export function MissionCard({ mission, delay = 0 }: MissionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="bg-surface rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-[14px] font-semibold text-text-primary leading-snug">
              {mission.name}
            </h4>
            <StatusBadge status={mission.status} />
          </div>
          <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2">
            {mission.description}
          </p>

          {/* Tributos earned */}
          {mission.status === "APPROVED" && mission.tributos && (
            <div className="flex items-center gap-1 mt-2 text-[12px] text-gold-500 font-medium">
              <Gem size={13} />
              <span>+{mission.tributos} tributos</span>
            </div>
          )}

          {/* Rejection reason */}
          {mission.status === "REJECTED" && mission.reviewNote && (
            <p className="mt-2 text-[12px] text-danger-400 leading-snug">
              {mission.reviewNote}
            </p>
          )}
        </div>

        {/* Action */}
        <div className="shrink-0 flex items-center">
          {mission.status === "PENDING" && (
            <button className="px-3.5 py-1.5 rounded-[var(--radius-btn)] bg-brand-900 text-white text-[12px] font-semibold hover:bg-brand-800 transition-colors">
              Concluir
            </button>
          )}
          {mission.status === "APPROVED" && (
            <button className="p-1.5 text-muted hover:text-brand-900 transition-colors">
              <ChevronRight size={18} />
            </button>
          )}
          {mission.status === "REJECTED" && (
            <button className="px-3.5 py-1.5 rounded-[var(--radius-btn)] border border-brand-900 text-brand-900 text-[12px] font-semibold hover:bg-brand-900/5 transition-colors">
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
