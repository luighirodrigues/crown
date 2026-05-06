"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Card } from "@/components/card";
import { ImageUpload } from "@/components/image-upload";
import { Plus, Pencil, Trash2, X, Loader2, Image as ImageIcon, Eye, EyeOff } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  active: boolean;
  order: number;
}

interface FormData {
  title: string;
  imageUrl: string;
  linkUrl: string;
  active: boolean;
  order: number;
}

const emptyForm: FormData = {
  title: "",
  imageUrl: "",
  linkUrl: "",
  active: true,
  order: 0,
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/banners");
      if (res.ok) setBanners(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function startEdit(banner: Banner) {
    setForm({
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl ?? "",
      active: banner.active,
      order: banner.order,
    });
    setEditingId(banner.id);
    setShowForm(true);
  }

  function cancelForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.imageUrl.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl || undefined,
        active: form.active,
        order: form.order,
      };

      if (editingId) {
        await fetch(`/api/admin/banners/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/admin/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      cancelForm();
      await fetchData();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(banner: Banner) {
    if (!confirm(`Excluir banner "${banner.title}"?`)) return;
    await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" });
    await fetchData();
  }

  async function handleToggleActive(banner: Banner) {
    await fetch(`/api/admin/banners/${banner.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !banner.active }),
    });
    await fetchData();
  }

  return (
    <AdminShell>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Banners</h2>
            <p className="text-[13px] text-text-secondary">
              Gerencie os banners exibidos na página inicial.
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-900 text-white text-[13px] font-semibold hover:bg-brand-800 transition-colors"
            >
              <Plus size={16} />
              Novo Banner
            </button>
          )}
        </div>

        {showForm && (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[15px] font-semibold text-text-primary">
                  {editingId ? "Editar Banner" : "Novo Banner"}
                </h3>
                <button type="button" onClick={cancelForm} className="p-1 text-muted hover:text-text-primary">
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="text-[12px] font-medium text-text-secondary mb-1.5 block">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Título do banner"
                  required
                  className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-text-secondary mb-1.5 block">Imagem</label>
                <ImageUpload
                  folder="banners"
                  variant="inline"
                  currentImageUrl={form.imageUrl || null}
                  onUpload={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-text-secondary mb-1.5 block">Link (opcional)</label>
                <input
                  type="text"
                  value={form.linkUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-text-secondary mb-1.5 block">Ordem</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                      className="w-4 h-4 rounded border-muted/30 text-brand-900 focus:ring-brand-900/30"
                    />
                    <span className="text-[13px] text-text-primary font-medium">Ativo</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !form.title.trim() || !form.imageUrl.trim()}
                className="w-full py-2.5 rounded-xl bg-brand-900 text-white text-sm font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editingId ? "Salvar Alterações" : "Criar Banner"}
              </button>
            </form>
          </Card>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : banners.length === 0 ? (
          <Card>
            <div className="py-8 text-center">
              <ImageIcon size={32} className="mx-auto text-muted mb-2" />
              <p className="text-[14px] text-text-secondary">Nenhum banner cadastrado.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {banners.map((banner) => (
              <Card key={banner.id}>
                <div className="flex gap-3">
                  <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-muted/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-[14px] font-semibold text-text-primary truncate">{banner.title}</h4>
                        <p className="text-[11px] text-muted mt-0.5">Ordem: {banner.order}</p>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          banner.active
                            ? "bg-success-500/10 text-success-500"
                            : "bg-muted/20 text-muted"
                        }`}
                      >
                        {banner.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        onClick={() => handleToggleActive(banner)}
                        className="p-1.5 rounded-lg text-muted hover:text-text-primary hover:bg-surface-alt transition-colors"
                        title={banner.active ? "Desativar" : "Ativar"}
                      >
                        {banner.active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => startEdit(banner)}
                        className="p-1.5 rounded-lg text-muted hover:text-brand-900 hover:bg-brand-900/8 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(banner)}
                        className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
