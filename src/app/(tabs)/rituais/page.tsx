"use client";

import { useState, useEffect, useCallback } from "react";
import { useIsDesktop } from "@/lib/use-media-query";
import RituaisDesktopPage from "./page-desktop";
import { AppHeader } from "@/components/app-header";
import { RitualCard } from "@/components/ritual-card";
import { RitualParticipantsModal } from "@/components/ritual-participants-modal";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import { Card } from "@/components/card";
import { ImageUpload } from "@/components/image-upload";
import { toRitual } from "@/lib/transformers";
import { fireCrownConfetti, rememberApprovalStatuses } from "@/lib/celebration.service";
import type { Ritual } from "@/lib/types";

export default function RituaisPage() {
  const isDesktop = useIsDesktop();

  if (isDesktop) return <RituaisDesktopPage />;

  return <RituaisMobilePage />;
}

function RituaisMobilePage() {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInText, setCheckInText] = useState("");
  const [checkInImageUrl, setCheckInImageUrl] = useState("");
  const [showCheckInForm, setShowCheckInForm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [participantsRitualId, setParticipantsRitualId] = useState<string | null>(null);

  const fetchRituals = useCallback(async () => {
    try {
      const res = await fetch("/api/rituals");
      if (res.ok) {
        const data = await res.json();
        const nextRituals = data.map((r: Record<string, unknown>) => toRitual(r));
        setRituals(nextRituals);

        const currentUserId = nextRituals.find((ritual: Ritual) => ritual.currentUserId)?.currentUserId;
        const approvedRituals = rememberApprovalStatuses(
          `crown:ritual-checkin-status:${currentUserId ?? "anonymous"}`,
          nextRituals
            .flatMap((ritual: Ritual) => ritual.checkInStatuses ?? [])
            .map((checkIn: { id: string; status: string }) => ({ id: checkIn.id, status: checkIn.status }))
        );
        if (approvedRituals.length > 0) {
          void fireCrownConfetti();
        }
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
        body: JSON.stringify({
          text: checkInText || undefined,
          imageUrl: checkInImageUrl || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowCheckInForm(null);
        setCheckInText("");
        setCheckInImageUrl("");
        await fetchRituals();
        const msg = data.status === "APPROVED"
          ? "Check-in realizado com sucesso!"
          : "Check-in enviado! Aguardando aprovação.";
        setSuccessMessage(msg);
        if (data.status === "APPROVED") {
          void fireCrownConfetti();
        }
        setTimeout(() => setSuccessMessage(null), 3000);
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
        {/* Success toast */}
        {successMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            {successMessage}
          </div>
        )}

        <AnimatedList className="space-y-6">
          {sortedGroups.map(([month, groupRituals]) => (
            <AnimatedItem key={month}>
              <div>
                {/* Section header - uppercase red with decorative line */}
                <div className="mb-4">
                  <h2 className="text-[15px] font-bold text-brand-900 uppercase tracking-wider text-center">
                    Rituais de {month}
                  </h2>
                  <div className="mt-1.5 h-[2px] bg-gradient-to-r from-transparent via-brand-900 to-transparent rounded-full" />
                </div>

                <div className="space-y-4">
                  {groupRituals.map((ritual, i) => (
                    <div key={ritual.id}>
                      <RitualCard
                        ritual={ritual}
                        delay={i * 0.1}
                        onCheckIn={() => setShowCheckInForm(ritual.id)}
                        onViewParticipants={() => setParticipantsRitualId(ritual.id)}
                      />
                      {/* Check-in form */}
                      {showCheckInForm === ritual.id && (
                        <div className="mt-2 px-1">
                          <Card className="p-3 space-y-2">
                            <textarea
                              placeholder="Compartilhe como foi seu ritual hoje..."
                              value={checkInText}
                              onChange={(e) => setCheckInText(e.target.value)}
                              rows={2}
                              className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30 resize-none"
                            />
                            <ImageUpload
                              folder="checkins"
                              variant="inline"
                              currentImageUrl={checkInImageUrl || null}
                              onUpload={(url) => setCheckInImageUrl(url)}
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
                                onClick={() => { setShowCheckInForm(null); setCheckInText(""); setCheckInImageUrl(""); }}
                                className="px-3 py-2 rounded-xl border border-muted/30 text-sm text-text-secondary hover:bg-surface-alt transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </Card>
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

      {/* Participants modal */}
      {participantsRitualId && (
        <RitualParticipantsModal
          ritualId={participantsRitualId}
          open={!!participantsRitualId}
          onClose={() => setParticipantsRitualId(null)}
        />
      )}
    </>
  );
}
