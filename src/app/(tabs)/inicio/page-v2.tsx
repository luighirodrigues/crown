"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/card";
import { SectionHeader } from "@/components/section-header";
import { MissionCard } from "@/components/mission-card";
import { UserAvatar } from "@/components/user-avatar";
import { PostCard } from "@/components/post-card";
import { EmptyState } from "@/components/empty-state";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import {
  Users,
  Crown,
  Gem,
  Bell,
  Menu,
  FileText,
  BookOpen,
  Handshake,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  MapPin,
  ExternalLink,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toPost, toEvent, toRitual, toRankingEntry, toMission } from "@/lib/transformers";
import type { Post, CrownEvent, Ritual, RankingEntry, Mission, Course } from "@/lib/types";

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
}

export default function InicioV2Page() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CrownEvent[]>([]);
  const [topRankings, setTopRankings] = useState<RankingEntry[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeRituals, setActiveRituals] = useState<Ritual[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [statsTab, setStatsTab] = useState<"painel" | "meu">("painel");
  const [userStats, setUserStats] = useState({
    totalTributos: 0,
    presencaGeral: 0,
    presencaRotina: 0,
    postsCount: 0,
    commentsCount: 0,
    rankPosition: null as number | null,
  });

  const fetchData = useCallback(async () => {
    try {
      const [muralRes, missionsRes, ritualsRes, meRes, coursesRes] = await Promise.all([
        fetch("/api/mural"),
        fetch("/api/missions"),
        fetch("/api/rituals?active=true"),
        fetch("/api/users/me"),
        fetch("/api/courses"),
      ]);

      if (muralRes.ok) {
        const mural = await muralRes.json();
        setTopPosts((mural.topPosts ?? []).map(toPost));
        setTopRankings((mural.rankingTop3 ?? []).map(toRankingEntry));
        setUpcomingEvents((mural.upcomingEvents ?? []).map(toEvent));
        setBanners(mural.banners ?? []);
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
        setUserAvatar(me.image ?? "");
        if (me.stats) {
          setUserStats({
            totalTributos: me.stats.totalTributos ?? 0,
            presencaGeral: me.stats.presencaGeral ?? 0,
            presencaRotina: me.stats.presencaRotina ?? 0,
            postsCount: me.stats.postsCount ?? 0,
            commentsCount: me.stats.commentsCount ?? 0,
            rankPosition: me.stats.rankPosition ?? null,
          });
        }
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.slice(0, 4));
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
      <div className="bg-bg min-h-screen">
        <div className="bg-brand-900 text-white px-4 pt-4 pb-6 rounded-b-3xl">
          <div className="h-12 bg-white/10 rounded-xl animate-pulse" />
        </div>
        <div className="px-4 py-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg min-h-screen">
      {/* ── Hero Header ── */}
      <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 text-white px-4 pt-4 pb-6 rounded-b-3xl relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 border border-white/10 rounded-full" />
        <div className="absolute bottom-2 -left-6 w-20 h-20 border border-white/5 rounded-full" />

        {/* Top row */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <Link href="/perfil">
              <UserAvatar src={userAvatar} name={userName} size="md" goldBorder />
            </Link>
            <div>
              <p className="text-[11px] font-medium opacity-70 uppercase tracking-wide">Comunidade</p>
              <h1 className="text-lg font-bold leading-tight">Bem-vinda ao reino! 👑</h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Link
                href="/admin/approvals"
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Admin"
              >
                <Shield size={18} />
              </Link>
            )}
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Bell size={20} />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-4 relative z-10">
          <button
            onClick={() => setStatsTab("painel")}
            className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all ${
              statsTab === "painel" ? "bg-white text-brand-900" : "bg-white/15 text-white"
            }`}
          >
            Painel da Comunidade
          </button>
          <button
            onClick={() => setStatsTab("meu")}
            className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all ${
              statsTab === "meu" ? "bg-white text-brand-900" : "bg-white/15 text-white"
            }`}
          >
            Meu Painel
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 relative z-10">
          {statsTab === "painel" ? (
            <>
              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-[20px] font-bold">{topRankings.length}</p>
                <p className="text-[11px] opacity-70">Membros Top</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-[20px] font-bold">{activeRituals.length}</p>
                <p className="text-[11px] opacity-70">Rituais Ativos</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-[20px] font-bold">{totalMissions}</p>
                <p className="text-[11px] opacity-70">Missões</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-[20px] font-bold">{userStats.totalTributos}</p>
                <p className="text-[11px] opacity-70">Tributos</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-[20px] font-bold">{userStats.rankPosition ?? "—"}</p>
                <p className="text-[11px] opacity-70">Ranking</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-[20px] font-bold">{userStats.presencaGeral}</p>
                <p className="text-[11px] opacity-70">Presenças</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        <AnimatedList className="space-y-5">
          {/* ── Missões da Semana ── */}
          {missions.length > 0 && (
            <AnimatedItem>
              <div>
                <SectionHeader
                  title="Missões da Semana"
                  badge={`${missionPercent}%`}
                  actionLabel="Ver todas"
                />
                <div className="space-y-3">
                  {missions.slice(0, 3).map((mission, i) => (
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
          )}

          {/* ── Quick Links Row ── */}
          <AnimatedItem>
            <div className="grid grid-cols-4 gap-3">
              <Link href="/comunidade" className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-brand-900/8 flex items-center justify-center">
                  <Users size={24} className="text-brand-900" />
                </div>
                <span className="text-[11px] font-medium text-text-secondary text-center">Comunidade</span>
              </Link>
              <Link href="/comunidade" className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-brand-900/8 flex items-center justify-center">
                  <FileText size={24} className="text-brand-900" />
                </div>
                <span className="text-[11px] font-medium text-text-secondary text-center">Publicações</span>
              </Link>
              <Link href="/perfil" className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-brand-900/8 flex items-center justify-center">
                  <Handshake size={24} className="text-brand-900" />
                </div>
                <span className="text-[11px] font-medium text-text-secondary text-center">Parceiras</span>
              </Link>
              <Link href="/rituais" className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-brand-900/8 flex items-center justify-center">
                  <CalendarDays size={24} className="text-brand-900" />
                </div>
                <span className="text-[11px] font-medium text-text-secondary text-center">Agenda</span>
              </Link>
            </div>
          </AnimatedItem>

          {/* ── Banners Carousel ── */}
          {banners.length > 0 && (
            <AnimatedItem>
              <BannerCarousel banners={banners} />
            </AnimatedItem>
          )}

          {/* ── Próximos Eventos ── */}
          {upcomingEvents.length > 0 && (
            <AnimatedItem>
              <div>
                <SectionHeader title="Próximos Eventos" actionLabel="Ver todos" />
                <div className="space-y-2">
                  {upcomingEvents.slice(0, 3).map((event, i) => {
                    const d = new Date(event.datetime);
                    const day = d.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "America/Sao_Paulo" });
                    const month = d.toLocaleDateString("pt-BR", { month: "short", timeZone: "America/Sao_Paulo" }).replace(".", "");
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-center gap-3 p-3 bg-surface rounded-xl shadow-[var(--shadow-card)]"
                      >
                        <div className="w-12 h-14 rounded-xl bg-brand-900/8 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[16px] font-bold text-brand-900 leading-tight">{day}</span>
                          <span className="text-[10px] font-semibold text-brand-900/70 uppercase">{month}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13px] font-semibold text-text-primary truncate">{event.title}</h4>
                          <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-1">{event.description}</p>
                          {event.location && (
                            <p className="text-[10px] text-muted mt-1 flex items-center gap-1">
                              <MapPin size={10} />
                              {event.location}
                            </p>
                          )}
                        </div>
                        {event.link && (
                          <a
                            href={event.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 p-2 text-muted hover:text-brand-900 transition-colors"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </AnimatedItem>
          )}

          {/* ── Aulas com Conteúdo ── */}
          {courses.length > 0 && (
            <AnimatedItem>
              <div>
                <SectionHeader title="Aulas com Conteúdo" actionLabel="Ver todos" onAction={() => router.push("/cursos")} />
                <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                  {courses.map((course, i) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="min-w-[200px] shrink-0"
                    >
                      <Link href={`/cursos/${course.id}`}>
                        <div className="bg-surface rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
                          <div className="h-28 bg-gradient-to-br from-brand-900/20 to-brand-800/10 flex items-center justify-center">
                            {course.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen size={32} className="text-brand-900/40" />
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className="text-[13px] font-semibold text-text-primary truncate">{course.name}</h4>
                            <p className="text-[11px] text-text-secondary mt-0.5">
                              {course.completedLessons}/{course.lessonCount} aulas
                            </p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </AnimatedItem>
          )}

          {/* ── Top Rainhas do Mês ── */}
          {topRankings.length > 0 && (
            <AnimatedItem>
              <Card>
                <SectionHeader title="Top Rainhas do Mês" actionLabel="Ver ranking" />
                <div className="flex items-start justify-center gap-6 pt-3 pb-2">
                  {/* 1st place — left, larger */}
                  {topRankings[0] && (
                    <div className="flex flex-col items-center flex-1">
                      <div className="relative mb-2">
                        <Crown size={18} className="text-amber-500 absolute -top-4 left-1/2 -translate-x-1/2 z-10" fill="currentColor" />
                        <div className="ring-2 ring-amber-400 rounded-full p-0.5">
                          <UserAvatar
                            src={topRankings[0].user.avatarUrl}
                            name={topRankings[0].user.name}
                            size="lg"
                            goldBorder={false}
                          />
                        </div>
                      </div>
                      <p className="text-[12px] font-bold text-text-primary truncate max-w-[80px] text-center">
                        {topRankings[0].user.name.split(" ")[0]}
                      </p>
                      <span className="text-[11px] font-bold text-amber-600 mt-0.5">
                        {topRankings[0].tributos} pts
                      </span>
                    </div>
                  )}

                  {/* 2nd place */}
                  {topRankings[1] && (
                    <div className="flex flex-col items-center flex-1 pt-3">
                      <div className="relative mb-2">
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center z-10 shadow-sm">
                          <span className="text-[10px] font-bold text-white">2</span>
                        </div>
                        <div className="ring-2 ring-gray-300 rounded-full p-0.5">
                          <UserAvatar
                            src={topRankings[1].user.avatarUrl}
                            name={topRankings[1].user.name}
                            size="md"
                            goldBorder={false}
                          />
                        </div>
                      </div>
                      <p className="text-[11px] font-semibold text-text-primary truncate max-w-[70px] text-center">
                        {topRankings[1].user.name.split(" ")[0]}
                      </p>
                      <span className="text-[10px] font-bold text-gray-500 mt-0.5">
                        {topRankings[1].tributos} pts
                      </span>
                    </div>
                  )}

                  {/* 3rd place */}
                  {topRankings[2] && (
                    <div className="flex flex-col items-center flex-1 pt-3">
                      <div className="relative mb-2">
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-700 flex items-center justify-center z-10 shadow-sm">
                          <span className="text-[10px] font-bold text-white">3</span>
                        </div>
                        <div className="ring-2 ring-amber-600/50 rounded-full p-0.5">
                          <UserAvatar
                            src={topRankings[2].user.avatarUrl}
                            name={topRankings[2].user.name}
                            size="md"
                            goldBorder={false}
                          />
                        </div>
                      </div>
                      <p className="text-[11px] font-semibold text-text-primary truncate max-w-[70px] text-center">
                        {topRankings[2].user.name.split(" ")[0]}
                      </p>
                      <span className="text-[10px] font-bold text-amber-700 mt-0.5">
                        {topRankings[2].tributos} pts
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </AnimatedItem>
          )}

          {/* ── Rituais Ativos ── */}
          {activeRituals.length > 0 && (
            <AnimatedItem>
              <div>
                <SectionHeader title="Rituais Ativos" actionLabel="Ver todos" onAction={() => router.push("/rituais")} />
                <Card>
                  <div className="divide-y divide-muted/15">
                    {activeRituals.slice(0, 3).map((ritual, i) => {
                      const progress = ritual.totalDays > 0 ? (ritual.completedDays / ritual.totalDays) * 100 : 0;
                      return (
                        <motion.div
                          key={ritual.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          onClick={() => router.push("/rituais")}
                          className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0 cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-muted/20">
                            {ritual.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={ritual.imageUrl} alt={ritual.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm">🔥</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-[13px] font-semibold text-text-primary truncate">{ritual.name}</h4>
                              <span className="text-[10px] font-bold text-text-secondary shrink-0">
                                {Math.round(progress)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1 bg-muted/20 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    progress === 100 ? "bg-success-500" : "bg-brand-900"
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted shrink-0">
                                {ritual.completedDays}/{ritual.totalDays}
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-muted shrink-0" />
                        </motion.div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </AnimatedItem>
          )}

          {/* ── Últimas Publicações ── */}
          <AnimatedItem>
            <div>
              <SectionHeader title="Últimas Publicações" actionLabel="Ver todas" onAction={() => router.push("/comunidade")} />
              {topPosts.length > 0 ? (
                <div className="space-y-3">
                  {topPosts.slice(0, 3).map((post, i) => (
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
        </AnimatedList>
      </div>
    </div>
  );
}

/* ── Banner Carousel ── */

function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Scroll to current banner
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const child = el.children[current] as HTMLElement | undefined;
    if (child) {
      el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
    }
  }, [current]);

  function goNext() {
    setCurrent((prev) => (prev + 1) % banners.length);
  }

  function goPrev() {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  }

  return (
    <div className="relative">
      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex overflow-hidden rounded-2xl shadow-[var(--shadow-card)]"
      >
        {banners.map((b) => (
          <div key={b.id} className="min-w-full shrink-0">
            {b.linkUrl ? (
              <a href={b.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.imageUrl} alt={b.title} className="w-full h-44 object-cover" />
              </a>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.imageUrl} alt={b.title} className="w-full h-44 object-cover" />
            )}
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/50 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/50 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {banners.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {banners.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 h-2 bg-brand-900"
                  : "w-2 h-2 bg-brand-900/25"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}