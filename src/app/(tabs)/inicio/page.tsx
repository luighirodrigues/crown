"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/card";
import { SectionHeader } from "@/components/section-header";
import { EventItem } from "@/components/event-item";
import { MissionCard } from "@/components/mission-card";
import { RitualCard } from "@/components/ritual-card";
import { RankingItem } from "@/components/ranking-item";
import { PostCard } from "@/components/post-card";
import { EmptyState } from "@/components/empty-state";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import { Users, Sparkles } from "lucide-react";
import Link from "next/link";
import { toPost, toEvent, toRitual, toRankingEntry, toMission } from "@/lib/transformers";
import type { Post, CrownEvent, Ritual, RankingEntry, Mission } from "@/lib/types";

export default function InicioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState<CrownEvent[]>([]);
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [topRankings, setTopRankings] = useState<RankingEntry[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeRituals, setActiveRituals] = useState<Ritual[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [muralRes, missionsRes, ritualsRes, meRes] = await Promise.all([
        fetch("/api/mural"),
        fetch("/api/missions"),
        fetch("/api/rituals?active=true"),
        fetch("/api/users/me"),
      ]);

      if (muralRes.ok) {
        const mural = await muralRes.json();
        setUpcomingEvents((mural.upcomingEvents ?? []).map(toEvent));
        setTopPosts((mural.topPosts ?? []).map(toPost));
        setTopRankings((mural.rankingTop3 ?? []).map(toRankingEntry));
      }

      if (missionsRes.ok) {
        const missionsData = await missionsRes.json();
        setMissions(missionsData.map((m: Record<string, unknown>) => toMission(m, m.userCompletion as Record<string, unknown> | null)));
      }

      if (ritualsRes.ok) {
        const ritualsData = await ritualsRes.json();
        setActiveRituals(ritualsData.map((r: Record<string, unknown>) => toRitual(r)));
      }

      if (meRes.ok) {
        const me = await meRes.json();
        setUserName(me.name ?? "Rainha");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCompleteMission = useCallback(async (missionId: string) => {
    try {
      const res = await fetch(`/api/missions/${missionId}/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Erro ao concluir missão");
        return;
      }
      // Refresh missions to reflect new status
      const missionsRes = await fetch("/api/missions");
      if (missionsRes.ok) {
        const missionsData = await missionsRes.json();
        setMissions(missionsData.map((m: Record<string, unknown>) => toMission(m, m.userCompletion as Record<string, unknown> | null)));
      }
    } catch {
      alert("Erro ao concluir missão");
    }
  }, []);

  const completedMissions = missions.filter((m) => m.status === "APPROVED").length;
  const totalMissions = missions.length;
  const missionPercent = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;

  if (loading) {
    return (
      <>
        <AppHeader title="Carregando..." variant="welcome" />
        <div className="px-4 py-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <AppHeader
        title={`Bem-vinda, ${userName}`}
        subtitle="Ver perfil"
        variant="welcome"
      />

      <div className="px-4 py-4 space-y-4">
        <AnimatedList className="space-y-4">
          {/* Quick links */}
          <AnimatedItem>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/comunidade">
                <Card className="flex items-center gap-3 p-3.5 hover:shadow-md transition-shadow cursor-pointer" hover>
                  <div className="w-10 h-10 rounded-xl bg-brand-900/8 flex items-center justify-center shrink-0">
                    <Users size={20} className="text-brand-900" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-text-primary">Comunidade</p>
                    <p className="text-[11px] text-text-secondary">Ver posts</p>
                  </div>
                </Card>
              </Link>
              <Link href="/rituais">
                <Card className="flex items-center gap-3 p-3.5 hover:shadow-md transition-shadow cursor-pointer" hover>
                  <div className="w-10 h-10 rounded-xl bg-brand-900/8 flex items-center justify-center shrink-0">
                    <Sparkles size={20} className="text-brand-900" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-text-primary">Rituais</p>
                    <p className="text-[11px] text-text-secondary">Check-in</p>
                  </div>
                </Card>
              </Link>
            </div>
          </AnimatedItem>

          {/* Próximos Eventos */}
          <AnimatedItem>
            <Card>
              <SectionHeader title="Próximos Eventos" actionLabel="Ver agenda" />
              <div className="space-y-2">
                {upcomingEvents.map((event, i) => (
                  <EventItem key={event.id} event={event} delay={i * 0.08} />
                ))}
              </div>
            </Card>
          </AnimatedItem>

          {/* Missões da Semana */}
          <AnimatedItem>
            <div>
              <SectionHeader
                title="Missões da Semana"
                badge={`${missionPercent}% completas`}
              />
              <div className="space-y-3">
                {missions.map((mission, i) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    delay={i * 0.06}
                    onComplete={handleCompleteMission}
                  />
                ))}
              </div>
            </div>
          </AnimatedItem>

          {/* Rituais Ativos */}
          <AnimatedItem>
            <div>
              <SectionHeader title="Rituais Ativos" />
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                {activeRituals.map((ritual, i) => (
                  <RitualCard
                    key={ritual.id}
                    ritual={ritual}
                    variant="compact"
                    delay={i * 0.08}
                    onClick={() => router.push("/rituais")}
                  />
                ))}
              </div>
            </div>
          </AnimatedItem>

          {/* Top Rainhas */}
          <AnimatedItem>
            <Card>
              <SectionHeader title="Top Rainhas do Mês" actionLabel="Ver ranking" />
              <div className="divide-y divide-muted/15">
                {topRankings.map((entry, i) => (
                  <RankingItem key={entry.user.id} entry={entry} delay={i * 0.08} />
                ))}
              </div>
            </Card>
          </AnimatedItem>

          {/* Contribuições do Reino (Top posts últimos 7 dias) */}
          <AnimatedItem>
            <div>
              <SectionHeader title="Contribuições do Reino" />
              {topPosts.length > 0 ? (
                <div className="space-y-3">
                  {topPosts.map((post, i) => (
                    <PostCard key={post.id} post={post} delay={i * 0.06} />
                  ))}
                </div>
              ) : (
                <Card>
                  <EmptyState icon="file-text" message="Nenhuma publicação nos últimos 7 dias." />
                </Card>
              )}
            </div>
          </AnimatedItem>

          {/* Público (placeholder) */}
          <AnimatedItem>
            <Card>
              <SectionHeader title="Público" />
              <EmptyState
                icon="bar-chart-3"
                message="Os dados demográficos do público não estão disponíveis para esse período. Selecione o período dos últimos 7 a 28 dias."
              />
            </Card>
          </AnimatedItem>
        </AnimatedList>
      </div>
    </>
  );
}
