"use client";

import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/app-header";
import { RitualCard } from "@/components/ritual-card";
import { SectionHeader } from "@/components/section-header";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import { Card } from "@/components/card";
import { StatusBadge } from "@/components/crown-badge";
import { toRitual } from "@/lib/transformers";
import type { Ritual } from "@/lib/types";

export default function RituaisPage() {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInText, setCheckInText] = useState("");
  const [showCheckInForm, setShowCheckInForm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [todayStatus, setTodayStatus] = useState<Record<string, string>>({});

  const fetchRituals = useCallback(async () => {
    try {
      const res = await fetch("/api/rituals");
      if (res.ok) {
        const data = await res.json();
        setRituals(data.map((r: Record<string, unknown>) => toRitual(r)));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRituals();
  }, [fetchRituals]);

  async function handleCheckIn(ritualId: string) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/rituals/${ritualId}/checkins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: checkInText || undefined }),
      });

      if (res.ok) {
        const data = await res.json();
        setTodayStatus((prev) => ({ ...prev, [ritualId]: data.status }));
        setShowCheckInForm(null);
        setCheckInText("");
        await fetchRituals();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao criar check-in");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Group rituals by month
  const grouped = rituals.reduce<Record<string, typeof rituals>>((acc, ritual) => {
    const key = ritual.monthLabel;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ritual);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped);

  if (loading) {
    return (
      <>
        <AppHeader title="Salão dos Rituais" />
        <div className="px-4 py-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Salão dos Rituais" />

      <div className="px-4 py-4 space-y-6">
        <AnimatedList className="space-y-6">
          {sortedGroups.map(([month, groupRituals]) => (
            <AnimatedItem key={month}>
              <div>
                <SectionHeader title={`Rituais de ${month}`} />
                <div className="space-y-4">
                  {groupRituals.map((ritual, i) => (
                    <div key={ritual.id}>
                      <RitualCard
                        ritual={ritual}
                        delay={i * 0.1}
                        onCheckIn={() => setShowCheckInForm(ritual.id)}
                      />
                      {/* Check-in status & form */}
                      {(todayStatus[ritual.id] || showCheckInForm === ritual.id) && (
                        <div className="mt-2 px-1">
                          {todayStatus[ritual.id] && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-text-secondary">Hoje:</span>
                              <StatusBadge status={todayStatus[ritual.id] as "PENDING" | "APPROVED" | "REJECTED"} />
                            </div>
                          )}

                          {showCheckInForm === ritual.id && (
                            <Card className="p-3 space-y-2">
                              <textarea
                                placeholder="Compartilhe como foi seu ritual hoje..."
                                value={checkInText}
                                onChange={(e) => setCheckInText(e.target.value)}
                                rows={2}
                                className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30 resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleCheckIn(ritual.id)}
                                  disabled={submitting}
                                  className="flex-1 py-2 rounded-xl bg-brand-900 text-white text-sm font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50"
                                >
                                  {submitting ? "Enviando..." : "Fazer Check-in"}
                                </button>
                                <button
                                  onClick={() => { setShowCheckInForm(null); setCheckInText(""); }}
                                  className="px-3 py-2 rounded-xl border border-muted/30 text-sm text-text-secondary hover:bg-surface-alt transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </Card>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedItem>
          ))}

          {rituals.length === 0 && (
            <AnimatedItem>
              <Card className="p-8 text-center">
                <p className="text-text-secondary text-sm">Nenhum ritual cadastrado.</p>
              </Card>
            </AnimatedItem>
          )}
        </AnimatedList>
      </div>
    </>
  );
}
