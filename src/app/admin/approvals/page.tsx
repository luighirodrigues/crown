"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/card";
import { UserAvatar } from "@/components/user-avatar";
import { StatusBadge } from "@/components/crown-badge";
import { Check, X, Clock, FileText, Sparkles } from "lucide-react";

interface PendingCheckIn {
  id: string;
  text: string | null;
  imageUrl: string | null;
  localDate: string;
  status: string;
  createdAt: string;
  ritual: { name: string };
  user: { id: string; name: string | null; image: string | null };
}

interface PendingMission {
  id: string;
  evidenceUrl: string | null;
  status: string;
  createdAt: string;
  mission: { name: string };
  user: { id: string; name: string | null; image: string | null };
}

interface ApprovalsData {
  checkIns: PendingCheckIn[];
  missions: PendingMission[];
  totalPending: number;
}

export default function ApprovalsPage() {
  const [data, setData] = useState<ApprovalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/approvals");
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAction(
    type: "checkins" | "missions",
    id: string,
    action: "approve" | "reject"
  ) {
    if (action === "reject" && !reviewNotes[id]?.trim()) {
      alert("Informe o motivo da reprovação.");
      return;
    }

    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/approvals/${type}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewNote: reviewNotes[id] || undefined,
        }),
      });

      if (res.ok) {
        await fetchData();
        setReviewNotes((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const noItems = !data || data.totalPending === 0;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">
        Fila de Aprovações
      </h2>

      {noItems && (
        <Card className="p-8 text-center">
          <Check size={32} className="mx-auto text-success-500 mb-2" />
          <p className="text-text-secondary text-sm">
            Nenhum item pendente de aprovação.
          </p>
        </Card>
      )}

      {/* Pending Check-ins */}
      {data && data.checkIns.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-text-secondary text-sm font-medium">
            <Sparkles size={16} />
            <span>Check-ins de Rituais ({data.checkIns.length})</span>
          </div>

          {data.checkIns.map((item) => (
            <Card key={item.id} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={item.user.image ?? ""}
                  name={item.user.name ?? ""}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {item.user.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {item.ritual.name} · {item.localDate}
                  </p>
                </div>
                <StatusBadge status="PENDING" />
              </div>

              {item.text && (
                <p className="text-sm text-text-secondary bg-surface-alt rounded-xl p-3">
                  {item.text}
                </p>
              )}

              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt="Evidência"
                  className="w-full h-40 object-cover rounded-xl"
                />
              )}

              <input
                type="text"
                placeholder="Nota de revisão (obrigatória para rejeição)"
                value={reviewNotes[item.id] || ""}
                onChange={(e) =>
                  setReviewNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
                className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => handleAction("checkins", item.id, "approve")}
                  disabled={processing === item.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-success-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  <Check size={16} />
                  Aprovar
                </button>
                <button
                  onClick={() => handleAction("checkins", item.id, "reject")}
                  disabled={processing === item.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-danger-400 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  <X size={16} />
                  Reprovar
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pending Mission Completions */}
      {data && data.missions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-text-secondary text-sm font-medium">
            <FileText size={16} />
            <span>Conclusões de Missões ({data.missions.length})</span>
          </div>

          {data.missions.map((item) => (
            <Card key={item.id} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={item.user.image ?? ""}
                  name={item.user.name ?? ""}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {item.user.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {item.mission.name}
                  </p>
                </div>
                <StatusBadge status="PENDING" />
              </div>

              {item.evidenceUrl && (
                <a
                  href={item.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-900 underline"
                >
                  Ver evidência
                </a>
              )}

              <input
                type="text"
                placeholder="Nota de revisão (obrigatória para rejeição)"
                value={reviewNotes[item.id] || ""}
                onChange={(e) =>
                  setReviewNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
                className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => handleAction("missions", item.id, "approve")}
                  disabled={processing === item.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-success-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  <Check size={16} />
                  Aprovar
                </button>
                <button
                  onClick={() => handleAction("missions", item.id, "reject")}
                  disabled={processing === item.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-danger-400 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  <X size={16} />
                  Reprovar
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
