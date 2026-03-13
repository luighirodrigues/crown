"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/card";
import { Search, Shield, ShieldCheck, User, Loader2, UserCircle } from "lucide-react";

interface Member {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "MEMBER" | "ADMIN" | "MODERATOR";
  subscriptionStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  profile: {
    displayName: string | null;
  } | null;
}

type RoleKey = "ADMIN" | "MODERATOR" | "MEMBER";

const roleConfig: Record<RoleKey, { label: string; description: string; icon: typeof Shield; color: string }> = {
  ADMIN: {
    label: "Admin",
    description: "Acesso total ao sistema. Pode gerenciar membros, permissões e todas as configurações.",
    icon: ShieldCheck,
    color: "text-brand-900",
  },
  MODERATOR: {
    label: "Moderadora",
    description: "Pode aprovar check-ins, missões e gerenciar conteúdo da comunidade.",
    icon: Shield,
    color: "text-gold-700",
  },
  MEMBER: {
    label: "Membro",
    description: "Acesso padrão à comunidade. Pode criar posts, participar de rituais e missões.",
    icon: User,
    color: "text-text-secondary",
  },
};

const rolePriority: RoleKey[] = ["ADMIN", "MODERATOR", "MEMBER"];

export default function PermissionsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
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

  async function changeRole(member: Member, newRole: RoleKey) {
    if (member.role === newRole) return;

    const roleLabel = roleConfig[newRole].label;
    if (!confirm(`Alterar o papel de "${member.name || member.email}" para ${roleLabel}?`)) return;

    setSaving(member.id);
    try {
      const res = await fetch(`/api/admin/members/${member.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        await fetchMembers();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao atualizar permissão");
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
      (m.profile?.displayName || "").toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Group members by role for summary
  const roleCounts = members.reduce(
    (acc, m) => {
      acc[m.role] = (acc[m.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

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
      <h2 className="text-lg font-semibold text-text-primary">Permissões</h2>

      {/* Role overview cards */}
      <div className="grid grid-cols-3 gap-2">
        {rolePriority.map((role) => {
          const config = roleConfig[role];
          const Icon = config.icon;
          return (
            <Card key={role} className="p-3 text-center">
              <Icon size={20} className={`mx-auto mb-1 ${config.color}`} />
              <p className="text-xs font-semibold text-text-primary">{config.label}</p>
              <p className="text-lg font-bold text-text-primary">{roleCounts[role] || 0}</p>
            </Card>
          );
        })}
      </div>

      {/* Role descriptions */}
      <Card className="p-3 space-y-2">
        {rolePriority.map((role) => {
          const config = roleConfig[role];
          const Icon = config.icon;
          return (
            <div key={role} className="flex items-start gap-2">
              <Icon size={16} className={`mt-0.5 flex-shrink-0 ${config.color}`} />
              <div>
                <p className="text-xs font-semibold text-text-primary">{config.label}</p>
                <p className="text-[11px] text-text-secondary">{config.description}</p>
              </div>
            </div>
          );
        })}
      </Card>

      {/* Search & Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
          />
        </div>
        <div className="flex gap-2">
          {["ALL", ...rolePriority].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                roleFilter === role
                  ? "bg-brand-900 text-white"
                  : "bg-surface-alt text-text-secondary hover:bg-muted/20"
              }`}
            >
              {role === "ALL" ? "Todos" : roleConfig[role as RoleKey].label}
            </button>
          ))}
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8">Nenhum membro encontrado.</p>
        ) : (
          filtered.map((member) => {
            const currentConfig = roleConfig[member.role];
            const CurrentIcon = currentConfig.icon;
            return (
              <Card key={member.id} className="p-3">
                <div className="flex items-center gap-3">
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
                    <div className="flex items-center gap-1.5">
                      <CurrentIcon size={14} className={currentConfig.color} />
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {member.profile?.displayName || member.name || "Sem nome"}
                      </p>
                    </div>
                    <p className="text-xs text-text-secondary truncate">{member.email}</p>
                  </div>

                  {/* Role selector */}
                  <div className="flex-shrink-0">
                    {saving === member.id ? (
                      <Loader2 size={16} className="animate-spin text-text-secondary" />
                    ) : (
                      <select
                        value={member.role}
                        onChange={(e) => changeRole(member, e.target.value as RoleKey)}
                        className="text-xs px-2 py-1.5 rounded-lg border border-muted/30 bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-900/30 cursor-pointer"
                      >
                        {rolePriority.map((role) => (
                          <option key={role} value={role}>
                            {roleConfig[role].label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
