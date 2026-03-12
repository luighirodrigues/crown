"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/card";
import { Plus, Pencil, Trash2, X, Loader2, Calendar } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  datetime: string;
  link: string | null;
  location: string | null;
}

interface FormData {
  title: string;
  description: string;
  datetime: string;
  link: string;
  location: string;
}

const emptyForm: FormData = {
  title: "",
  description: "",
  datetime: "",
  link: "",
  location: "",
};

function toLocalDatetime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/events");
      if (res.ok) setEvents(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function startEdit(ev: Event) {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      description: ev.description,
      datetime: toLocalDatetime(ev.datetime),
      link: ev.link || "",
      location: ev.location || "",
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
        title: form.title,
        description: form.description,
        datetime: new Date(form.datetime).toISOString(),
        link: form.link || undefined,
        location: form.location || undefined,
      };

      const url = editingId ? `/api/admin/events/${editingId}` : "/api/admin/events";
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

  async function handleDelete(ev: Event) {
    if (!confirm(`Excluir o evento "${ev.title}"?`)) return;
    await fetch(`/api/admin/events/${ev.id}`, { method: "DELETE" });
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
        <h2 className="text-lg font-semibold text-text-primary">Eventos</h2>
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
            Novo Evento
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">
                {editingId ? "Editar Evento" : "Novo Evento"}
              </p>
              <button type="button" onClick={cancelForm} className="text-text-secondary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Título"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
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
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Data e Hora (Brasília)</label>
              <input
                type="datetime-local"
                value={form.datetime}
                onChange={(e) => setForm((f) => ({ ...f, datetime: e.target.value }))}
                required
                className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface focus:outline-none focus:ring-1 focus:ring-brand-900/30"
              />
            </div>
            <input
              type="url"
              placeholder="Link (opcional)"
              value={form.link}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
              className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
            />
            <input
              type="text"
              placeholder="Local (opcional)"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-900 text-white text-sm font-medium hover:bg-brand-800 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editingId ? "Salvar Alterações" : "Criar Evento"}
            </button>
          </form>
        </Card>
      )}

      {/* List */}
      <div className="space-y-2">
        {events.map((ev) => {
          const isFuture = new Date(ev.datetime) > new Date();
          return (
            <Card key={ev.id} className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-900/10 flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-brand-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary truncate">{ev.title}</p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        isFuture ? "bg-success-500/10 text-success-500" : "bg-surface-alt text-text-secondary"
                      }`}
                    >
                      {isFuture ? "Futuro" : "Passado"}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {new Date(ev.datetime).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "America/Sao_Paulo",
                    })}
                    {ev.location ? ` · ${ev.location}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(ev)}
                    className="p-1.5 rounded-lg text-text-secondary hover:bg-surface-alt transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(ev)}
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
