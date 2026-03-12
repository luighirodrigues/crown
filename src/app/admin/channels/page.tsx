"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/card";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  isActive: boolean;
  _count: { posts: number };
}

type FormData = { name: string; slug: string; icon: string };

const emptyForm: FormData = { name: "", slug: "", icon: "" };

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/channels");
      if (res.ok) setChannels(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  function startEdit(ch: Channel) {
    setEditingId(ch.id);
    setForm({ name: ch.name, slug: ch.slug, icon: ch.icon || "" });
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
      const payload = { name: form.name, slug: form.slug, icon: form.icon || undefined };

      if (editingId) {
        const res = await fetch(`/api/admin/channels/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          cancelForm();
          await fetchChannels();
        } else {
          const err = await res.json();
          alert(err.error || "Erro ao salvar");
        }
      } else {
        const res = await fetch("/api/admin/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          cancelForm();
          await fetchChannels();
        } else {
          const err = await res.json();
          alert(err.error || "Erro ao criar");
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(ch: Channel) {
    await fetch(`/api/admin/channels/${ch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !ch.isActive }),
    });
    await fetchChannels();
  }

  async function handleDelete(ch: Channel) {
    if (!confirm(`Excluir o canal "${ch.name}"? Todos os posts serão removidos.`)) return;
    await fetch(`/api/admin/channels/${ch.id}`, { method: "DELETE" });
    await fetchChannels();
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-surface rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Canais</h2>
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
            Novo Canal
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">
                {editingId ? "Editar Canal" : "Novo Canal"}
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
            <input
              type="text"
              placeholder="Slug (ex: geral)"
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))
              }
              required
              className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
            />
            <input
              type="text"
              placeholder="Ícone (emoji ou texto, opcional)"
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-900 text-white text-sm font-medium hover:bg-brand-800 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editingId ? "Salvar Alterações" : "Criar Canal"}
            </button>
          </form>
        </Card>
      )}

      {/* List */}
      <div className="space-y-2">
        {channels.map((ch) => (
          <Card key={ch.id} className="p-3">
            <div className="flex items-center gap-3">
              {ch.icon && <span className="text-lg">{ch.icon}</span>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-text-primary truncate">{ch.name}</p>
                  {!ch.isActive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-danger-400/10 text-danger-400 font-medium">
                      Inativo
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary">
                  /{ch.slug} · {ch._count.posts} posts
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleActive(ch)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    ch.isActive ? "bg-success-500" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      ch.isActive ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <button
                  onClick={() => startEdit(ch)}
                  className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-alt transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(ch)}
                  className="p-1.5 rounded-lg text-danger-400 hover:bg-danger-400/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
