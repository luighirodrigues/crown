"use client";

import { useState, useEffect, useCallback } from "react";
import { RitualCard } from "@/components/ritual-card";
import { RitualParticipantsModal } from "@/components/ritual-participants-modal";
import { Card } from "@/components/card";
import { ImageUpload } from "@/components/image-upload";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import { Trophy, Flame, Gem, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toRitual } from "@/lib/transformers";
import { fireCrownConfetti, rememberApprovalStatuses } from "@/lib/celebration.service";
import type { Ritual } from "@/lib/types";

export default function RituaisDesktopPage() {
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
        const msg =
          data.status === "APPROVED"
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
  const grouped = rituals.reduce<Record<string, Ritual[]>>((acc, ritual) => {
    const key = ritual.monthLabel;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ritual);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped);

  // Stats
  const activeRituals = rituals.filter(
    (r) => new Date(r.endAt) >= new Date()
  ).length;
  const totalCompleted = rituals.reduce((sum, r) => sum + r.completedDays, 0);
  const totalTributos = rituals.reduce(
    (sum, r) => sum + r.completedDays * r.pointsValue,
    0
  );

  if (loading) {
    return (
      <div className="desktop-container py-10">
        <div className="h-48 bg-surface rounded-2xl animate-pulse mb-8" />
        <div className="grid grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="desktop-container py-8 pb-16">
      {/* Success toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-success-500 text-white px-6 py-3 rounded-xl text-[14px] font-semibold shadow-lg"
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center mb-10"
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-900/10 flex items-center justify-center mx-auto mb-4">
          <Trophy size={32} className="text-brand-900" />
        </div>
        <h1 className="text-[32px] font-bold text-text-primary tracking-tight">
          Desafios do Mês
        </h1>
        <p className="text-[15px] text-text-secondary mt-2 max-w-lg mx-auto italic leading-relaxed">
          &ldquo;A consistência é a joia mais preciosa da coroa. Aqui celebramos cada passo da sua
          jornada de evolução.&rdquo;
        </p>
      </motion.div>

      {/* ── Stats Row ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="grid grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto"
      >
        <div className="bg-surface rounded-2xl p-6 text-center shadow-[var(--shadow-card)] border border-muted/10">
          <p className="text-[28px] font-bold text-brand-900 leading-none">
            {activeRituals}
          </p>
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mt-2">
            Rituais Ativos
          </p>
        </div>
        <div className="bg-surface rounded-2xl p-6 text-center shadow-[var(--shadow-card)] border border-muted/10">
          <p className="text-[28px] font-bold text-brand-900 leading-none">
            {totalCompleted}
          </p>
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mt-2">
            Conquistas
          </p>
        </div>
        <div className="bg-surface rounded-2xl p-6 text-center shadow-[var(--shadow-card)] border border-muted/10">
          <p className="text-[28px] font-bold text-brand-900 leading-none">
            {totalTributos}
          </p>
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mt-2">
            Tributos Gerados
          </p>
        </div>
      </motion.div>

      {/* ── Ritual Groups by Month ── */}
      <AnimatedList className="space-y-12">
        {sortedGroups.map(([month, groupRituals]) => (
          <AnimatedItem key={month}>
            <div>
              {/* Section Header */}
              <div className="mb-6 max-w-md mx-auto">
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent to-brand-900/30 rounded-full" />
                  <h2 className="text-[14px] font-bold text-brand-900 uppercase tracking-[0.2em] whitespace-nowrap">
                    Rituais de {month}
                  </h2>
                  <div className="flex-1 h-[1.5px] bg-gradient-to-l from-transparent to-brand-900/30 rounded-full" />
                </div>
              </div>

              {/* 3-Column Ritual Grid */}
              <div className="grid grid-cols-3 gap-5">
                {groupRituals.map((ritual, i) => (
                  <div key={ritual.id} className="relative">
                    <RitualCard
                      ritual={ritual}
                      delay={i * 0.08}
                      onCheckIn={() => setShowCheckInForm(ritual.id)}
                      onViewParticipants={() =>
                        setParticipantsRitualId(ritual.id)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </AnimatedItem>
        ))}

        {rituals.length === 0 && (
          <AnimatedItem>
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-900/8 flex items-center justify-center mx-auto mb-4">
                <Flame size={28} className="text-brand-900/40" />
              </div>
              <p className="text-[15px] text-text-secondary font-medium">
                Nenhum ritual cadastrado.
              </p>
            </div>
          </AnimatedItem>
        )}
      </AnimatedList>

      {/* ── Check-in Modal ── */}
      <AnimatePresence>
        {showCheckInForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => {
                setShowCheckInForm(null);
                setCheckInText("");
                setCheckInImageUrl("");
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="bg-surface rounded-2xl shadow-2xl border border-muted/15 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-muted/15">
                  <h3 className="text-[16px] font-bold text-text-primary">
                    Registrar Check-in
                  </h3>
                  <button
                    onClick={() => {
                      setShowCheckInForm(null);
                      setCheckInText("");
                      setCheckInImageUrl("");
                    }}
                    className="p-1 rounded-full hover:bg-surface-alt transition-colors text-muted hover:text-text-primary"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  <textarea
                    placeholder="Compartilhe como foi seu ritual hoje..."
                    value={checkInText}
                    onChange={(e) => setCheckInText(e.target.value)}
                    rows={3}
                    className="w-full text-[14px] px-3 py-2.5 rounded-xl border border-muted/30 bg-surface-alt placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900/30 transition-all resize-none leading-relaxed"
                  />
                  <ImageUpload
                    folder="checkins"
                    variant="inline"
                    currentImageUrl={checkInImageUrl || null}
                    onUpload={(url) => setCheckInImageUrl(url)}
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleCheckIn(showCheckInForm)}
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl bg-brand-900 text-white text-[13px] font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {submitting ? "Enviando..." : "Fazer Check-in"}
                    </button>
                    <button
                      onClick={() => {
                        setShowCheckInForm(null);
                        setCheckInText("");
                        setCheckInImageUrl("");
                      }}
                      className="px-4 py-2.5 rounded-xl border border-muted/30 text-[13px] text-text-secondary hover:bg-surface-alt transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Participants modal */}
      {participantsRitualId && (
        <RitualParticipantsModal
          ritualId={participantsRitualId}
          open={!!participantsRitualId}
          onClose={() => setParticipantsRitualId(null)}
        />
      )}
    </div>
  );
}
