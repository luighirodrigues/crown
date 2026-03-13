"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/card";
import { Search, Loader2, UserCircle } from "lucide-react";

interface Member {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "MEMBER" | "ADMIN" | "MODERATOR";
  subscriptionStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
  profile: {
    displayName: string | null;
    phone: string | null;
    city: string | null;
    profession: string | null;
    bio: string | null;
    onboardingComplete: boolean;
  } | null;
  _count: {
    posts: number;
    comments: number;
    pointsLedger: number;
  };
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Ativa",
  INACTIVE: "Inativa",
  SUSPENDED: "Suspensa",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-success-500/10 text-success-500",
  INACTIVE: "bg-muted/20 text-text-secondary",
  SUSPENDED: "bg-danger-400/10 text-danger-400",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  MODERATOR: "Moderadora",
  MEMBER: "Membro",
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [saving, setSaving] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/members");
      if (res.ok) setMembers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function toggleStatus(member: Member) {
    const newStatus = member.subscriptionStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const action = newStatus === "SUSPENDED" ? "suspender" : "reativar";
    if (!confirm(`Deseja ${action} a conta de "${member.name || member.email}"?`)) return;

    setSaving(member.id);
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionStatus: newStatus }),
      });
      if (res.ok) {
        await fetchMembers();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao atualizar");
      }
    } finally {
      setSaving(null);
    }
  }

  const filtered = members.filter((m) => {
    const matchesSearch =
      !search ||
      (m.name || "").toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.profile?.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.profile?.city || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || m.subscriptionStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-surface rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Membros</h2>
        <span className="text-xs text-text-secondary">{members.length} total</span>
      </div>

      {/* Search & Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
          />
        </div>
        <div className="flex gap-2">
          {["ALL", "ACTIVE", "SUSPENDED", "INACTIVE"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === status
                  ? "bg-brand-900 text-white"
                  : "bg-surface-alt text-text-secondary hover:bg-muted/20"
              }`}
            >
              {status === "ALL" ? "Todos" : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8">Nenhum membro encontrado.</p>
        ) : (
          filtered.map((member) => (
            <Card key={member.id} className="p-3">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name || ""}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center">
                      <UserCircle size={24} className="text-muted" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {member.profile?.displayName || member.name || "Sem nome"}
                    </p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        statusColors[member.subscriptionStatus]
                      }`}
                    >
                      {statusLabels[member.subscriptionStatus]}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-900/10 text-brand-900 font-medium">
                      {roleLabels[member.role]}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate">{member.email}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-text-secondary">
                    {member.profile?.city && <span>{member.profile.city}</span>}
                    {member.profile?.profession && <span>· {member.profile.profession}</span>}
                    <span>· {member._count.posts} posts</span>
                    <span>· {member._count.comments} comentários</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-text-secondary">
                      Desde {new Date(member.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    {member.profile && !member.profile.onboardingComplete && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold-500/20 text-gold-700 font-medium">
                        Onboarding pendente
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => toggleStatus(member)}
                    disabled={saving === member.id}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      member.subscriptionStatus === "ACTIVE" ? "bg-success-500" : "bg-muted"
                    }`}
                    title={member.subscriptionStatus === "ACTIVE" ? "Suspender" : "Reativar"}
                  >
                    {saving === member.id ? (
                      <Loader2 size={12} className="mx-auto animate-spin text-white" />
                    ) : (
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          member.subscriptionStatus === "ACTIVE"
                            ? "translate-x-4.5"
                            : "translate-x-0.5"
                        }`}
                      />
                    )}
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
