"use client";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import { Calendar, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import type { CrownEvent } from "@/lib/types";

interface EventItemProps {
  event: CrownEvent;
  delay?: number;
}

export function EventItem({ event, delay = 0 }: EventItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl",
        "bg-bg-alt hover:bg-surface transition-colors"
      )}
    >
      <div className="shrink-0 w-9 h-9 rounded-lg bg-brand-900/8 flex items-center justify-center mt-0.5">
        <Calendar size={18} className="text-brand-900" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[14px] font-semibold text-text-primary leading-snug truncate">
          {event.title}
        </h4>
        <p className="text-[12px] text-text-secondary mt-0.5">
          {event.description}
        </p>
        {event.location && (
          <p className="text-[11px] text-muted mt-1">
            Toque para adicionar ao {event.location}
          </p>
        )}
      </div>
      {event.link && (
        <button className="shrink-0 p-1.5 text-muted hover:text-brand-900 transition-colors">
          <ExternalLink size={14} />
        </button>
      )}
    </motion.div>
  );
}
