"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/card";
import { CrownBadge } from "@/components/crown-badge";
import { SectionHeader } from "@/components/section-header";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import {
  Crown,
  Gem,
  Activity,
  CalendarCheck,
  MessageCircle,
  FileText,
  Pencil,
  Flame,
  Target,
  Trophy,
  Medal,
  LogIn,
  Settings,
  Camera,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import { toRitual } from "@/lib/transformers";
import type { Ritual } from "@/lib/types";

// Dynamic icon resolver
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  crown: Crown,
  gem: Gem,
  pencil: Pencil,
  flame: Flame,
  "message-circle": MessageCircle,
  target: Target,
  trophy: Trophy,
  medal: Medal,
  "log-in": LogIn,
};

interface UserProfile {
  id: string;
  name: string;
  image: string | null;
  email: string;
  role: string;
  createdAt: string;
  profile: {
    bio: string | null;
    interests: string[];
    skills: string[];
  } | null;
  stats: {
    totalTributos: number;
    presencaGeral: number;
    presencaRotina: number;
    postsCount: number;
    commentsCount: number;
    rankPosition: number | null;
  };
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [meRes, ritualsRes] = await Promise.all([
        fetch("/api/users/me"),
        fetch("/api/rituals"),
      ]);
      if (meRes.ok) {
        setProfile(await meRes.json());
      }
      if (ritualsRes.ok) {
        const data = await ritualsRes.json();
        setRituals(data.map((r: Record<string, unknown>) => toRitual(r)));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !profile) {
    return (
      <div>
        <div className="h-36 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 animate-pulse" />
        <div className="px-4 py-4 space-y-4 mt-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const completedRituals = rituals.filter((r) => r.completedDays === r.totalDays && r.totalDays > 0);
  const interests = profile.profile?.interests ?? [];
  const skills = profile.profile?.skills ?? [];
  const bio = profile.profile?.bio;

  return (
    <div>
      {/* Banner + Avatar */}
      <div className="relative">
        {/* Banner */}
        <div className="h-36 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 relative overflow-hidden">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-8 w-24 h-24 border border-white/30 rounded-full" />
            <div className="absolute bottom-2 left-12 w-16 h-16 border border-white/20 rounded-full" />
            <div className="absolute top-8 left-1/3 w-8 h-8 border border-white/25 rounded-full" />
          </div>

          {/* Top actions */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white text-[11px] font-medium hover:bg-white/25 transition-colors backdrop-blur-sm">
              <Camera size={13} />
              Personalizar Banner
            </button>
            <button className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors backdrop-blur-sm">
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Avatar overlapping */}
        <div className="absolute -bottom-10 left-4">
          <UserAvatar
            src={profile.image ?? ""}
            name={profile.name ?? ""}
            size="xl"
            goldBorder
            className="border-4 border-bg"
          />
        </div>
      </div>

      {/* Name + Badges */}
      <div className="pt-14 px-4 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-text-primary">
              {profile.name}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <CrownBadge
                label={profile.role === "ADMIN" ? "Rainha" : profile.role === "MODERATOR" ? "Moderadora" : "Membro"}
                variant={profile.role === "ADMIN" ? "gold" : profile.role === "MODERATOR" ? "brand" : "neutral"}
                size="sm"
              />
              {profile.stats.rankPosition && profile.stats.rankPosition <= 3 && (
                <CrownBadge
                  label={`Top ${profile.stats.rankPosition}`}
                  variant="gold"
                  size="sm"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile sections */}
      <div className="px-4 py-3 space-y-4">
        <AnimatedList className="space-y-4">
          {/* Insígnias & Conquistas */}
          <AnimatedItem>
            <Card>
              <SectionHeader title="Insígnias & Conquistas" />
              <EmptyState
                icon="trophy"
                message="Suas conquistas aparecerão aqui conforme você participa da comunidade."
              />
            </Card>
          </AnimatedItem>

          {/* História */}
          <AnimatedItem>
            <Card>
              <SectionHeader title="História" />
              <p className="text-[14px] text-text-secondary leading-relaxed">
                {bio || "Nenhuma bio definida ainda. Edite seu perfil para contar sua história!"}
              </p>
            </Card>
          </AnimatedItem>

          {/* Vozes do Reino */}
          <AnimatedItem>
            <Card>
              <SectionHeader title="Vozes do Reino" />
              <EmptyState
                icon="message-circle"
                message="Depoimentos de outras membras aparecerão aqui."
              />
            </Card>
          </AnimatedItem>

          {/* Presença no Reino */}
          <AnimatedItem>
            <Card>
              <SectionHeader title="Presença no Reino" />
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-alt rounded-xl p-3 text-center">
                  <Activity size={20} className="mx-auto text-brand-900 mb-1.5" />
                  <p className="text-[20px] font-bold text-text-primary">
                    {profile.stats.presencaGeral}
                  </p>
                  <p className="text-[11px] text-text-secondary">Presença Geral</p>
                </div>
                <div className="bg-bg-alt rounded-xl p-3 text-center">
                  <CalendarCheck size={20} className="mx-auto text-brand-900 mb-1.5" />
                  <p className="text-[20px] font-bold text-text-primary">
                    {profile.stats.presencaRotina}
                  </p>
                  <p className="text-[11px] text-text-secondary">Presença Rotina</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="bg-bg-alt rounded-xl p-2.5 text-center">
                  <p className="text-[18px] font-bold text-text-primary">{profile.stats.postsCount}</p>
                  <p className="text-[10px] text-text-secondary">Posts</p>
                </div>
                <div className="bg-bg-alt rounded-xl p-2.5 text-center">
                  <p className="text-[18px] font-bold text-text-primary">{profile.stats.commentsCount}</p>
                  <p className="text-[10px] text-text-secondary">Comentários</p>
                </div>
                <div className="bg-bg-alt rounded-xl p-2.5 text-center">
                  <p className="text-[18px] font-bold text-text-primary">{profile.stats.totalTributos.toLocaleString("pt-BR")}</p>
                  <p className="text-[10px] text-text-secondary">Tributos</p>
                </div>
              </div>
            </Card>
          </AnimatedItem>

          {/* Interesses & Habilidades */}
          {(interests.length > 0 || skills.length > 0) && (
            <AnimatedItem>
              <Card>
                <SectionHeader title="Interesses & Habilidades" />
                <div className="space-y-3">
                  {interests.length > 0 && (
                    <div>
                      <p className="text-[12px] font-medium text-text-secondary mb-2">Interesses</p>
                      <div className="flex flex-wrap gap-2">
                        {interests.map((interest) => (
                          <span
                            key={interest}
                            className="px-3 py-1 rounded-full bg-brand-900/8 text-brand-900 text-[12px] font-medium"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {skills.length > 0 && (
                    <div>
                      <p className="text-[12px] font-medium text-text-secondary mb-2">Habilidades</p>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 rounded-full bg-gold-500/15 text-amber-700 text-[12px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </AnimatedItem>
          )}

          {/* Histórico de Tributos */}
          <AnimatedItem>
            <Card>
              <SectionHeader title="Histórico de Tributos" />
              <EmptyState
                icon="gem"
                message="Seu extrato de tributos aparecerá aqui conforme você participa da comunidade."
              />
            </Card>
          </AnimatedItem>

          {/* Rituais Concluídos */}
          <AnimatedItem>
            <Card>
              <SectionHeader
                title="Rituais Concluídos"
                badge={`${completedRituals.length} rituais`}
              />
              {completedRituals.length > 0 ? (
                <div className="space-y-2">
                  {completedRituals.map((ritual) => (
                    <div
                      key={ritual.id}
                      className="flex items-center gap-3 p-2.5 bg-bg-alt rounded-xl"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ritual.imageUrl} alt={ritual.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-text-primary truncate">{ritual.name}</p>
                        <p className="text-[11px] text-text-secondary">{ritual.monthLabel} • {ritual.totalDays} dias</p>
                      </div>
                      <CrownBadge label="Completo" variant="success" size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="sparkles"
                  message="Nenhum ritual concluído ainda. Continue participando!"
                />
              )}
            </Card>
          </AnimatedItem>

          {/* Jornada no Reino */}
          <AnimatedItem>
            <Card>
              <SectionHeader title="Jornada no Reino" />
              <div className="relative pl-6">
                <div className="absolute left-2.5 top-1 bottom-1 w-[2px] bg-muted/25 rounded-full" />
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-brand-900/10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-brand-900" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-text-primary">Entrou no Reino</p>
                      <p className="text-[12px] text-text-secondary">Início da jornada na comunidade</p>
                      <p className="text-[11px] text-muted mt-0.5">{formatDate(profile.createdAt)}</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Card>
          </AnimatedItem>

          {/* Portfólio & Conquistas */}
          <AnimatedItem>
            <Card>
              <SectionHeader title="Portfólio & Conquistas" actionLabel="+ Adicionar" />
              <EmptyState
                icon="folder-plus"
                message="Adicione suas conquistas, certificados e projetos realizados."
                ctaLabel="Adicionar conquista"
              />
            </Card>
          </AnimatedItem>
        </AnimatedList>
      </div>
    </div>
  );
}
