"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/card";
import { Plus, Pencil, Trash2, X, Loader2, Target } from "lucide-react";

interface Mission {
  id: string;
  name: string;
  description: string;
  type: "MANUAL" | "AUTOMATIC";
  autoApprove: boolean;
  tributos: number;
  startAt: string | null;
  endAt: string | null;
  _count: { completions: number };
}

interface FormData {
  name: string;
  description: string;
  type: "MANUAL" | "AUTOMATIC";
  autoApprove: boolean;
  tributos: number;
  startAt: string;
  endAt: string;
  criteriaJson: string;
}

const emptyForm: FormData = {
  name: "",
  description: "",
  type: "MANUAL",
  autoApprove: false,
  tributos: 0,
  startAt: "",
  endAt: "",
  criteriaJson: "",
};

function toLocalDatetime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/missions");
      if (res.ok) setMissions(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function startEdit(m: Mission) {
    setEditingId(m.id);
    setForm({
      name: m.name,
      description: m.description,
      type: m.type,
      autoApprove: m.autoApprove,
      tributos: m.tributos,
      startAt: toLocalDatetime(m.startAt),
      endAt: toLocalDatetime(m.endAt),
      criteriaJson: "",
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        type: form.type,
        autoApprove: form.autoApprove,
        tributos: form.tributos,
      };
      if (form.startAt) payload.startAt = new Date(form.startAt).toISOString();
      else if (editingId) payload.startAt = null;
      if (form.endAt) payload.endAt = new Date(form.endAt).toISOString();
      else if (editingId) payload.endAt = null;
      if (form.criteriaJson) payload.criteriaJson = form.criteriaJson;

      const url = editingId ? `/api/admin/missions/${editingId}` : "/api/admin/missions";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        cancelForm();
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao salvar");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(m: Mission) {
    if (!confirm(`Excluir a missão "${m.name}"? Completions associadas serão removidas.`)) return;
    await fetch(`/api/admin/missions/${m.id}`, { method: "DELETE" });
    await fetchData();
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-surface rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Missões</h2>
        {!showForm && (
          <button
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-900 text-white text-xs font-medium hover:bg-brand-800 transition-colors"
          >
            <Plus size={14} />
            Nova Missão
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">
                {editingId ? "Editar Missão" : "Nova Missão"}
              </p>
              <button type="button" onClick={cancelForm} className="text-text-secondary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Nome"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
            />
            <textarea
              placeholder="Descrição"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30 resize-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "MANUAL" | "AUTOMATIC" }))}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="AUTOMATIC">Automática</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Tributos</label>
                <input
                  type="number"
                  min={0}
                  value={form.tributos}
                  onChange={(e) => setForm((f) => ({ ...f, tributos: parseInt(e.target.value) || 0 }))}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-text-secondary">Auto-aprovar:</label>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, autoApprove: !f.autoApprove }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.autoApprove ? "bg-success-500" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.autoApprove ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Início (opcional)</label>
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Fim (opcional)</label>
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                />
              </div>
            </div>

            {/* Scaffold for AUTOMATIC criteria */}
            {form.type === "AUTOMATIC" && (
              <div>
                <label className="text-xs text-text-secondary mb-1 block">
                  Critérios JSON (scaffold — TODO: implementar runtime)
                </label>
                <textarea
                  placeholder='{"action": "comment", "count": 5, "period": "week"}'
                  value={form.criteriaJson}
                  onChange={(e) => setForm((f) => ({ ...f, criteriaJson: e.target.value }))}
                  rows={3}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-muted/30 bg-surface-alt placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30 resize-none font-mono"
                />
                <p className="text-[10px] text-text-secondary mt-1">
                  ⚠️ Critérios automáticos ainda não são processados pelo sistema. Apenas armazenamento.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-900 text-white text-sm font-medium hover:bg-brand-800 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editingId ? "Salvar Alterações" : "Criar Missão"}
            </button>
          </form>
        </Card>
      )}

      {/* List */}
      <div className="space-y-2">
        {missions.map((m) => {
          const now = new Date();
          const isActive =
            (!m.startAt && !m.endAt) ||
            (m.startAt && m.endAt && new Date(m.startAt) <= now && new Date(m.endAt) >= now) ||
            (m.startAt && !m.endAt && new Date(m.startAt) <= now) ||
            (!m.startAt && m.endAt && new Date(m.endAt) >= now);

          return (
            <Card key={m.id} className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-900/10 flex items-center justify-center flex-shrink-0">
                  <Target size={18} className="text-brand-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-text-primary truncate">{m.name}</p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        isActive ? "bg-success-500/10 text-success-500" : "bg-surface-alt text-text-secondary"
                      }`}
                    >
                      {isActive ? "Ativa" : "Inativa"}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-alt text-text-secondary font-medium">
                      {m.type === "MANUAL" ? "Manual" : "Automática"}
                    </span>
                    {m.autoApprove && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold-500/20 text-amber-700 font-medium">
                        Auto
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{m.description}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {m.tributos} tributos · {m._count.completions} conclusões
                    {m.startAt && ` · Início: ${new Date(m.startAt).toLocaleDateString("pt-BR")}`}
                    {m.endAt && ` · Fim: ${new Date(m.endAt).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(m)}
                    className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-alt transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(m)}
                    className="p-1.5 rounded-lg text-danger-400 hover:bg-danger-400/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
