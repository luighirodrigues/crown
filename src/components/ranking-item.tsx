"use client";

import { cn } from "@/lib/utils";
import { UserAvatar } from "./user-avatar";
import { Crown, Gem } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { RankingEntry } from "@/lib/types";

interface RankingItemProps {
  entry: RankingEntry;
  delay?: number;
}

const positionColors: Record<number, string> = {
  1: "text-amber-500",
  2: "text-gray-400",
  3: "text-amber-700",
};

export function RankingItem({ entry, delay = 0 }: RankingItemProps) {
  const isTop3 = entry.position <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className="flex items-center gap-3 py-2.5"
    >
      <div
        className={cn(
          "w-7 text-center font-bold text-[14px]",
          isTop3 ? positionColors[entry.position] : "text-muted"
        )}
      >
        {isTop3 ? (
          <Crown size={18} className="mx-auto" fill="currentColor" />
        ) : (
          entry.position
        )}
      </div>
      <Link href={`/perfil/${entry.user.slug || entry.user.id}`}>
        <UserAvatar
          src={entry.user.avatarUrl}
          name={entry.user.name}
          size="sm"
          goldBorder={isTop3}
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/perfil/${entry.user.slug || entry.user.id}`} className="hover:underline">
          <p className="text-[13px] font-semibold text-text-primary truncate">
            {entry.user.name}
          </p>
        </Link>
      </div>
      <div className="flex items-center gap-1 text-[12px] font-medium text-text-secondary">
        <Gem size={12} className="text-gold-500" />
        {entry.tributos.toLocaleString("pt-BR")}
      </div>
    </motion.div>
  );
}
