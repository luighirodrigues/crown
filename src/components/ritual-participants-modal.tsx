"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Users } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

interface ParticipantCheckIn {
  id: string;
  text: string | null;
  imageUrl: string | null;
  createdAt: string;
  status: string;
  user: { id: string; name: string | null; image: string | null };
  userTotalCheckIns: number;
  totalDays: number;
}

interface ParticipantsData {
  ritual: { id: string; name: string; description: string };
  participantCount: number;
  totalCheckIns: number;
  todayCheckIns: ParticipantCheckIn[];
}

interface RitualParticipantsModalProps {
  ritualId: string;
  open: boolean;
  onClose: () => void;
}

export function RitualParticipantsModal({ ritualId, open, onClose }: RitualParticipantsModalProps) {
  const [data, setData] = useState<ParticipantsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/rituals/${ritualId}/participants`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [open, ritualId]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [open]);

  function formatDateTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    }) + " às " + d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  }

  // Group check-ins by user
  const groupedByUser = data?.todayCheckIns.reduce<
    Record<string, { user: ParticipantCheckIn["user"]; totalCheckIns: number; totalDays: number; checkIns: ParticipantCheckIn[] }>
  >((acc, c) => {
    if (!acc[c.user.id]) {
      acc[c.user.id] = { user: c.user, totalCheckIns: c.userTotalCheckIns, totalDays: c.totalDays, checkIns: [] };
    }
    acc[c.user.id].checkIns.push(c);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Modal - slides up from bottom */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] bg-bg rounded-t-2xl overflow-hidden flex flex-col"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-muted/40 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center text-text-secondary hover:bg-muted/30 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
              {loading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-2 border-brand-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">Carregando...</p>
                </div>
              ) : data ? (
                <>
                  {/* Ritual title */}
                  <h2 className="text-[17px] font-bold text-brand-900 text-center mt-2 mb-1">
                    {data.ritual.name}
                  </h2>
                  <p className="text-[12px] text-text-secondary text-center leading-relaxed mb-4 px-2">
                    {data.ritual.description}
                  </p>

                  {/* Stats card */}
                  <div className="bg-surface rounded-xl p-4 mb-5 border border-muted/15">
                    <h3 className="text-[14px] font-bold text-text-primary mb-2">Progresso Geral</h3>
                    <div className="space-y-1">
                      <p className="text-[13px] text-text-secondary">
                        <span className="font-semibold text-brand-900">{data.participantCount}</span> membros participando
                      </p>
                      <p className="text-[13px] text-text-secondary">
                        <span className="font-semibold text-brand-900">{data.totalCheckIns}</span> check-ins realizados
                      </p>
                    </div>
                  </div>

                  {/* Today's check-ins */}
                  <h3 className="text-[14px] font-semibold text-text-primary mb-3">
                    Quem está cumprindo hoje
                  </h3>

                  {groupedByUser && Object.keys(groupedByUser).length > 0 ? (
                    <div className="space-y-4">
                      {Object.values(groupedByUser).map(({ user, totalCheckIns, totalDays, checkIns }) => (
                        <div key={user.id} className="space-y-2">
                          {/* User header */}
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              src={user.image ?? ""}
                              name={user.name ?? ""}
                              size="md"
                            />
                            <div>
                              <p className="text-[14px] font-semibold text-text-primary">
                                {user.name ?? "Participante"}
                              </p>
                              <p className="text-[12px] text-brand-900 font-medium">
                                {totalCheckIns} de {totalDays} check-ins
                              </p>
                            </div>
                          </div>

                          {/* Check-in entries */}
                          {checkIns.map((checkIn) => (
                            <div key={checkIn.id} className="ml-[52px] space-y-2">
                              <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                                <Calendar size={12} />
                                {formatDateTime(checkIn.createdAt)}
                              </div>

                              {checkIn.imageUrl && (
                                <div className="rounded-xl overflow-hidden max-w-[280px]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={checkIn.imageUrl}
                                    alt="Check-in"
                                    className="w-full object-cover max-h-48 rounded-xl"
                                    loading="lazy"
                                  />
                                </div>
                              )}

                              {checkIn.text && (
                                <p className="text-[13px] text-text-primary leading-relaxed">
                                  {checkIn.text}
                                </p>
                              )}
                            </div>
                          ))}

                          <div className="border-b border-muted/15 pb-1" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users size={28} className="text-muted mx-auto mb-2" />
                      <p className="text-[13px] text-text-secondary">
                        Nenhum check-in registrado hoje.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-text-secondary">Erro ao carregar dados.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
