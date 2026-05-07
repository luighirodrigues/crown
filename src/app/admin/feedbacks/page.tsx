"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Lightbulb,
  Bug,
  MessageSquare,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { timeAgo, cn } from "@/lib/utils";

interface FeedbackItem {
  id: string;
  userId: string;
  type: "ideia" | "bug" | "outro";
  message: string;
  imageUrl: string | null;
  isAnonymous: boolean;
  status: "NEW" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    email: string;
  } | null;
}

const statusConfig = {
  NEW: { label: "Novo", icon: AlertCircle, color: "text-brand-800", bg: "bg-brand-100/20" },
  IN_REVIEW: { label: "Em análise", icon: Clock, color: "text-gold-500", bg: "bg-gold-500/10" },
  RESOLVED: { label: "Resolvido", icon: CheckCircle, color: "text-success-500", bg: "bg-success-500/10" },
  REJECTED: { label: "Rejeitado", icon: XCircle, color: "text-danger-400", bg: "bg-danger-400/10" },
};

const typeIcon = {
  ideia: Lightbulb,
  bug: Bug,
  outro: MessageSquare,
};

const typeLabel = {
  ideia: "Ideia",
  bug: "Bug",
  outro: "Outro",
};

export default function AdminFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.append("status", statusFilter);
    if (typeFilter) params.append("type", typeFilter);
    params.append("page", String(page));
    params.append("limit", "20");

    try {
      const res = await fetch(`/api/feedback?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks);
        setTotalPages(data.pagination.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, page]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  async function updateStatus(id: string, status: FeedbackItem["status"]) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status } : f))
        );
      }
    } catch {
      alert("Erro ao atualizar status");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteFeedback(id: string) {
    if (!confirm("Tem certeza que deseja excluir este feedback?")) return;
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      }
    } catch {
      alert("Erro ao excluir feedback");
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown size={20} className="text-gold-500" />
          <h1 className="text-lg font-semibold text-text-primary">Feedbacks</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          <Filter size={14} />
          <span>Filtros:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm px-2 py-1 rounded-lg border border-muted/30 bg-surface focus:outline-none focus:ring-1 focus:ring-brand-900/30"
        >
          <option value="">Todos os status</option>
          <option value="NEW">Novo</option>
          <option value="IN_REVIEW">Em análise</option>
          <option value="RESOLVED">Resolvido</option>
          <option value="REJECTED">Rejeitado</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="text-sm px-2 py-1 rounded-lg border border-muted/30 bg-surface focus:outline-none focus:ring-1 focus:ring-brand-900/30"
        >
          <option value="">Todos os tipos</option>
          <option value="ideia">Ideia</option>
          <option value="bug">Bug</option>
          <option value="outro">Outro</option>
        </select>
        {(statusFilter || typeFilter) && (
          <button
            onClick={() => { setStatusFilter(""); setTypeFilter(""); setPage(1); }}
            className="text-sm text-brand-800 hover:underline"
          >
            Limpar
          </button>
        )}
      </div>

      {/* List */}
      {loading && feedbacks.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-brand-900" />
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
          <Crown size={32} className="mb-3 opacity-40" />
          <p className="text-sm">Nenhum feedback encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {feedbacks.map((feedback) => {
              const StatusIcon = statusConfig[feedback.status].icon;
              const TypeIcon = typeIcon[feedback.type];
              return (
                <motion.div
                  key={feedback.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-surface rounded-[var(--radius-card)] p-4 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center">
                        <TypeIcon size={14} className="text-brand-800" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {typeLabel[feedback.type]}
                        </p>
                        <p className="text-[11px] text-muted">
                          {feedback.isAnonymous
                            ? "Anonimo"
                            : feedback.user?.name || feedback.user?.email || "Desconhecido"}
                          {" | "}
                          {timeAgo(feedback.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium",
                        statusConfig[feedback.status].bg,
                        statusConfig[feedback.status].color
                      )}
                    >
                      <StatusIcon size={12} />
                      {statusConfig[feedback.status].label}
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {feedback.message}
                  </p>

                  {/* Image */}
                  {feedback.imageUrl && (
                    <img
                      src={feedback.imageUrl}
                      alt="Anexo"
                      className="w-full max-h-48 object-cover rounded-xl"
                    />
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-muted/20">
                    {updatingId === feedback.id ? (
                      <Loader2 size={14} className="animate-spin text-brand-900" />
                    ) : (
                      <>
                        {feedback.status !== "IN_REVIEW" && (
                          <button
                            onClick={() => updateStatus(feedback.id, "IN_REVIEW")}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium bg-gold-500/10 text-gold-500 hover:bg-gold-500/20 transition-colors"
                          >
                            <Clock size={12} />
                            Em analise
                          </button>
                        )}
                        {feedback.status !== "RESOLVED" && (
                          <button
                            onClick={() => updateStatus(feedback.id, "RESOLVED")}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium bg-success-500/10 text-success-500 hover:bg-success-500/20 transition-colors"
                          >
                            <CheckCircle size={12} />
                            Resolver
                          </button>
                        )}
                        {feedback.status !== "REJECTED" && (
                          <button
                            onClick={() => updateStatus(feedback.id, "REJECTED")}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium bg-danger-400/10 text-danger-400 hover:bg-danger-400/20 transition-colors"
                          >
                            <XCircle size={12} />
                            Rejeitar
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => deleteFeedback(feedback.id)}
                      className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium text-muted hover:text-danger-400 hover:bg-danger-400/10 transition-colors"
                    >
                      <Trash2 size={12} />
                      Excluir
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-secondary hover:bg-surface-alt disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-text-secondary">
            Pagina {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-secondary hover:bg-surface-alt disabled:opacity-40 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}