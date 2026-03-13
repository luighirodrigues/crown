"use client";

import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/card";
import { RankingItem } from "@/components/ranking-item";
import { EmptyState } from "@/components/empty-state";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import { Trophy } from "lucide-react";
import { toRankingEntry } from "@/lib/transformers";
import type { RankingEntry } from "@/lib/types";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function RankingPage() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRanking = useCallback(async () => {
    try {
      const res = await fetch("/api/ranking?limit=50");
      if (res.ok) {
        const data = await res.json();
        setRankings((data.rankings ?? []).map(toRankingEntry));
        setMonth(data.month ?? "");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  const monthLabel = month
    ? `${MONTH_NAMES[parseInt(month.split("-")[1], 10) - 1]} ${month.split("-")[0]}`
    : "";

  if (loading) {
    return (
      <>
        <AppHeader title="Ranking" showBack />
        <div className="px-4 py-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Ranking" showBack />

      <div className="px-4 py-4 space-y-4">
        <AnimatedList className="space-y-4">
          {/* Month title */}
          <AnimatedItem>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-900/8">
                <Trophy size={14} className="text-brand-900" />
                <span className="text-[13px] font-semibold text-brand-900">
                  Rainhas do Mês — {monthLabel}
                </span>
              </div>
            </div>
          </AnimatedItem>

          {/* Full ranking list */}
          {rankings.length > 0 && (
            <AnimatedItem>
              <Card>
                <div className="divide-y divide-muted/15">
                  {rankings.map((entry, i) => (
                    <RankingItem key={entry.user.id} entry={entry} delay={i * 0.05} />
                  ))}
                </div>
              </Card>
            </AnimatedItem>
          )}

          {rankings.length === 0 && (
            <AnimatedItem>
              <Card>
                <EmptyState
                  icon="crown"
                  message="Nenhum tributo registrado neste mês ainda."
                />
              </Card>
            </AnimatedItem>
          )}
        </AnimatedList>
      </div>
    </>
  );
}
