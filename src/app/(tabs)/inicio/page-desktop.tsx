"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/card";
import { SectionHeader } from "@/components/section-header";
import { MissionCard } from "@/components/mission-card";
import { PostCard } from "@/components/post-card";
import { EmptyState } from "@/components/empty-state";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import { DesktopSidebar } from "@/components/sidebar/desktop-sidebar";
import { Star, ChevronRight, ChevronLeft, Play } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toPost, toEvent, toRankingEntry, toMission } from "@/lib/transformers";
import { fireMissionComplete, rememberApprovalStatuses } from "@/lib/celebration.service";
import type { Post, CrownEvent, RankingEntry, Mission, Course } from "@/lib/types";

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
}

interface MemberPreview {
  id: string;
  name: string;
  image: string | null;
  slug: string | null;
  createdAt?: string;
}

export default function InicioDesktopPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);

  // Main content data
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [userId, setUserId] = useState("");
  const [userSlug, setUserSlug] = useState<string | undefined>();
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CrownEvent[]>([]);
  const [topRankings, setTopRankings] = useState<RankingEntry[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  // User stats for sidebar
  const [userStats, setUserStats] = useState({
    totalTributos: 0,
    presencaGeral: 0,
    rankPosition: null as number | null,
  });

  // Members data for sidebar
  const [recentMembers, setRecentMembers] = useState<MemberPreview[]>([]);
  const [allMembers, setAllMembers] = useState<MemberPreview[]>([]);
  const [totalMemberCount, setTotalMemberCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [muralRes, missionsRes, meRes, coursesRes, membersRes] = await Promise.all([
        fetch("/api/mural"),
        fetch("/api/missions"),
        fetch("/api/users/me"),
        fetch("/api/courses"),
        fetch("/api/members"),
      ]);

      if (muralRes.ok) {
        const mural = await muralRes.json();
        setTopPosts((mural.topPosts ?? []).map(toPost));
        setTopRankings((mural.rankingTop5 ?? mural.rankingTop3 ?? []).map(toRankingEntry));
        setUpcomingEvents((mural.upcomingEvents ?? []).map(toEvent));
        setBanners(mural.banners ?? []);
      }

      let nextUserId = "";
      if (meRes.ok) {
        const me = await meRes.json();
        nextUserId = me.id ?? "";
        setUserName(me.name ?? "Rainha");
        setUserAvatar(me.image ?? "");
        setUserId(nextUserId);
        setUserSlug(me.slug ?? undefined);
        if (me.stats) {
          setUserStats({
            totalTributos: me.stats.totalTributos ?? 0,
            presencaGeral: me.stats.presencaGeral ?? 0,
            rankPosition: me.stats.rankPosition ?? null,
          });
        }
      }

      if (missionsRes.ok) {
        const missionsData = await missionsRes.json();
        const nextMissions = missionsData.map((m: Record<string, unknown>) =>
          toMission(m, m.userCompletion as Record<string, unknown> | null)
        );
        setMissions(nextMissions);

        if (nextUserId) {
          const approvedMissions = rememberApprovalStatuses(
            `crown:mission-status:${nextUserId}`,
            nextMissions
              .filter((mission: Mission) => mission.submitted)
              .map((mission: Mission) => ({ id: mission.id, status: mission.status }))
          );
          if (approvedMissions.length > 0) {
            void fireMissionComplete();
          }
        }
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.slice(0, 4));
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setRecentMembers(membersData.recentMembers ?? []);
        setAllMembers(membersData.allMembers ?? []);
        setTotalMemberCount(membersData.totalCount ?? 0);
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
      const completion = await res.json();
      if (completion.status === "APPROVED") {
        void fireMissionComplete();
      }
      const missionsRes = await fetch("/api/missions");
      if (missionsRes.ok) {
        const missionsData = await missionsRes.json();
        const nextMissions = missionsData.map((m: Record<string, unknown>) =>
          toMission(m, m.userCompletion as Record<string, unknown> | null)
        );
        setMissions(nextMissions);
        if (userId) {
          rememberApprovalStatuses(
            `crown:mission-status:${userId}`,
            nextMissions
              .filter((mission: Mission) => mission.submitted)
              .map((mission: Mission) => ({ id: mission.id, status: mission.status }))
          );
        }
      }
    } catch {
      alert("Erro ao concluir missão");
    }
  }, [userId]);

  const completedMissions = missions.filter((m) => m.status === "APPROVED").length;
  const totalMissions = missions.length;
  const missionPercent =
    totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;

  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;
  const currentCourse = courses.length > 0 ? courses[0] : null;

  if (loading) {
    return (
      <div className="desktop-container py-8">
        <div className="grid grid-cols-[1fr_340px] gap-6">
          <div className="space-y-4">
            <div className="h-56 bg-surface rounded-2xl animate-pulse" />
            <div className="h-32 bg-surface rounded-2xl animate-pulse" />
            <div className="h-48 bg-surface rounded-2xl animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-64 bg-surface rounded-2xl animate-pulse" />
            <div className="h-40 bg-surface rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="desktop-container py-6">
      <div className="grid grid-cols-[1fr_340px] gap-6 items-start">
        {/* ── Main Content ── */}
        <div className="space-y-6 min-w-0">
          <AnimatedList className="space-y-6">
            {/* Banner Carousel */}
            {banners.length > 0 && (
              <AnimatedItem>
                <DesktopBannerCarousel banners={banners} />
              </AnimatedItem>
            )}

            {/* Welcome Card */}
            <AnimatedItem>
              <Card className="bg-gradient-to-r from-gold-300/30 to-gold-500/10 border border-gold-300/40">
                <h2 className="text-[20px] font-bold text-text-primary">
                  Bem-vinda de volta, {userName}! 🌟
                </h2>
                <p className="text-[14px] text-text-secondary mt-1">
                  Continue sua jornada no reino. Veja suas missões, acompanhe os rituais e conecte-se com a comunidade.
                </p>
              </Card>
            </AnimatedItem>

            {/* Missions — Desktop 3-column grid */}
            {missions.length > 0 && (
              <AnimatedItem>
                <div>
                  <SectionHeader
                    title="Missões da Semana"
                    badge={`${missionPercent}% completas`}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    {missions.slice(0, 6).map((mission, i) => (
                      <DesktopMissionCard
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

            {/* Video Section — Da Rainha para Rainhas */}
            <AnimatedItem>
              <Card>
                <SectionHeader title="Da Rainha para Rainhas" />
                <div className="rounded-xl overflow-hidden bg-black aspect-video relative">
                  <iframe
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                    title="Da Rainha para Rainhas"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
                <p className="text-[14px] text-text-secondary mt-3 leading-relaxed">
                  Uma mensagem especial para todas as integrantes do reino. Assista e inspire-se com a nossa jornada juntas.
                </p>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-[var(--radius-btn)] bg-brand-900 text-white text-[13px] font-semibold hover:bg-brand-800 transition-colors"
                >
                  <Play size={14} />
                  Assistir no YouTube
                </a>
              </Card>
            </AnimatedItem>

            {/* Latest Posts */}
            <AnimatedItem>
              <div>
                <SectionHeader
                  title="Últimas Publicações no Reino"
                  actionLabel="Ver tudo"
                  onAction={() => router.push("/comunidade")}
                />
                {topPosts.length > 0 ? (
                  <div className="space-y-4">
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
          </AnimatedList>
        </div>

        {/* ── Sidebar ── */}
        <DesktopSidebar
          userName={userName}
          userAvatar={userAvatar}
          userSlug={userSlug}
          userId={userId}
          totalTributos={userStats.totalTributos}
          rankPosition={userStats.rankPosition}
          presencaGeral={userStats.presencaGeral}
          nextEvent={nextEvent}
          currentCourse={currentCourse}
          rankings={topRankings}
          userTributos={userStats.totalTributos}
          recentMembers={recentMembers}
          allMembers={allMembers}
          totalMemberCount={totalMemberCount}
        />
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 mb-4">
        <Link
          href="/comunidade"
          className="block w-full text-center py-4 rounded-2xl bg-brand-900 text-white text-[15px] font-semibold hover:bg-brand-800 transition-colors shadow-lg"
        >
          Participe da Comunidade →
        </Link>
      </div>
    </div>
  );
}

/* ── Desktop Mission Card (compact with star icon) ── */

function DesktopMissionCard({
  mission,
  delay = 0,
  onComplete,
}: {
  mission: Mission;
  delay?: number;
  onComplete?: (id: string) => void;
}) {
  const isCompleted = mission.status === "APPROVED";
  const isPending = mission.status === "PENDING" && mission.submitted;
  const canComplete = mission.status === "PENDING" && !mission.submitted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="bg-surface rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-card)] flex flex-col"
    >
      <div className="w-10 h-10 rounded-xl bg-gold-300/30 flex items-center justify-center mb-3">
        <Star size={20} className="text-gold-500" fill="currentColor" />
      </div>
      <h4 className="text-[14px] font-semibold text-text-primary leading-snug mb-1">
        {mission.name}
      </h4>
      <p className="text-[12px] text-text-secondary leading-relaxed line-clamp-2 flex-1">
        {mission.description}
      </p>
      <div className="mt-3">
        {canComplete && (
          <button
            onClick={() => onComplete?.(mission.id)}
            className="w-full px-3 py-2 rounded-[var(--radius-btn)] bg-brand-900 text-white text-[12px] font-semibold hover:bg-brand-800 transition-colors"
          >
            ✓ Fiz!
          </button>
        )}
        {isPending && (
          <span className="block w-full text-center px-3 py-2 rounded-[var(--radius-btn)] bg-amber-500/10 text-amber-600 text-[12px] font-semibold">
            Aguardando
          </span>
        )}
        {isCompleted && (
          <span className="block w-full text-center px-3 py-2 rounded-[var(--radius-btn)] bg-success-500/10 text-success-500 text-[12px] font-semibold">
            ✓ Concluída
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ── Desktop Banner Carousel ── */

function DesktopBannerCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const child = el.children[current] as HTMLElement | undefined;
    if (child) {
      el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
    }
  }, [current]);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex overflow-hidden rounded-2xl shadow-[var(--shadow-card)]"
      >
        {banners.map((b) => (
          <div key={b.id} className="min-w-full shrink-0">
            {b.linkUrl ? (
              <a href={b.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  className="w-full h-56 object-cover"
                />
              </a>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={b.imageUrl}
                alt={b.title}
                className="w-full h-56 object-cover"
              />
            )}
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={() =>
              setCurrent((prev) => (prev - 1 + banners.length) % banners.length)
            }
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() =>
              setCurrent((prev) => (prev + 1) % banners.length)
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/50 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

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
