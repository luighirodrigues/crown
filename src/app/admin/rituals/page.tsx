"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/card";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

interface Ritual {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  pointsValue: number;
  startAt: string;
  endAt: string;
  autoApprove: boolean;
}

interface FormData {
  name: string;
  description: string;
  imageUrl: string;
  pointsValue: number;
  startAt: string;
  endAt: string;
  autoApprove: boolean;
}

const emptyForm: FormData = {
  name: "",
  description: "",
  imageUrl: "",
  pointsValue: 0,
  startAt: "",
  endAt: "",
  autoApprove: true,
};

function toLocalDatetime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function RitualsPage() {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rituals");
      if (res.ok) setRituals(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function startEdit(r: Ritual) {
    setEditingId(r.id);
    setForm({
      name: r.name,
      description: r.description,
      imageUrl: r.imageUrl || "",
      pointsValue: r.pointsValue,
      startAt: toLocalDatetime(r.startAt),
      endAt: toLocalDatetime(r.endAt),
      autoApprove: r.autoApprove,
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
      const payload = {
        name: form.name,
        description: form.description,
        imageUrl: form.imageUrl || undefined,
        pointsValue: form.pointsValue,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        autoApprove: form.autoApprove,
      };

      const url = editingId ? `/api/admin/rituals/${editingId}` : "/api/admin/rituals";
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

  async function handleDelete(r: Ritual) {
    if (!confirm(`Excluir o ritual "${r.name}"? Check-ins associados serão removidos.`)) return;
    await fetch(`/api/admin/rituals/${r.id}`, { method: "DELETE" });
    await fetchData();
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Rituais</h2>
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
            Novo Ritual
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">
                {editingId ? "Editar Ritual" : "Novo Ritual"}
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
              placeholder="Objetivo / Descrição"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
              rows={3}
              className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30 resize-none"
            />
            <input
              type="url"
              placeholder="URL da Imagem (opcional)"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Tributos</label>
                <input
                  type="number"
                  min={0}
                  value={form.pointsValue}
                  onChange={(e) => setForm((f) => ({ ...f, pointsValue: parseInt(e.target.value) || 0 }))}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                />
              </div>
              <div className="flex items-end pb-1 gap-2">
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Início</label>
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                  required
                  className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Fim</label>
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                  required
                  className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-900 text-white text-sm font-medium hover:bg-brand-800 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editingId ? "Salvar Alterações" : "Criar Ritual"}
            </button>
          </form>
        </Card>
      )}

      {/* List */}
      <div className="space-y-2">
        {rituals.map((r) => {
          const now = new Date();
          const isActive = new Date(r.startAt) <= now && new Date(r.endAt) >= now;
          return (
            <Card key={r.id} className="p-3">
              <div className="flex items-start gap-3">
                {r.imageUrl && (
                  <img
                    src={r.imageUrl}
                    alt={r.name}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary truncate">{r.name}</p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        isActive ? "bg-success-500/10 text-success-500" : "bg-surface-alt text-text-secondary"
                      }`}
                    >
                      {isActive ? "Ativo" : "Inativo"}
                    </span>
                    {r.autoApprove && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold-500/20 text-amber-700 font-medium">
                        Auto
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{r.description}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {new Date(r.startAt).toLocaleDateString("pt-BR")} → {new Date(r.endAt).toLocaleDateString("pt-BR")} · {r.pointsValue} tributos
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(r)}
                    className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-alt transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(r)}
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
