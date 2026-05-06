"use client";

import { Card } from "@/components/card";
import { UserAvatar } from "@/components/user-avatar";
import { RankingItem } from "@/components/ranking-item";
import { Crown, Gem } from "lucide-react";
import Link from "next/link";
import type { RankingEntry } from "@/lib/types";

interface RankingWidgetProps {
  rankings: RankingEntry[];
  userRank?: number | null;
  userTributos?: number;
}

export function SidebarRankingWidget({ rankings, userRank, userTributos }: RankingWidgetProps) {
  if (rankings.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold text-text-primary flex items-center gap-2">
          <Crown size={16} className="text-gold-500" />
          Ranking do Mês
        </h3>
        <Link href="/ranking" className="text-[12px] font-medium text-brand-900 hover:text-brand-800">
          Ver tudo &gt;
        </Link>
      </div>

      {userRank && (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-brand-900/5 mb-3">
          <span className="text-[14px] font-bold text-brand-900 w-6 text-center">
            {userRank}º
          </span>
          <span className="text-[13px] font-medium text-text-primary flex-1">Sua posição</span>
          <div className="flex items-center gap-1 text-[12px] font-medium text-text-secondary">
            <Gem size={12} className="text-gold-500" />
            {(userTributos ?? 0).toLocaleString("pt-BR")}
          </div>
        </div>
      )}

      <div className="divide-y divide-muted/10">
        {rankings.map((entry, i) => (
          <RankingItem key={entry.user.id} entry={entry} delay={i * 0.05} />
        ))}
      </div>
    </Card>
  );
}
