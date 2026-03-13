"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/card";
import { CrownBadge } from "@/components/crown-badge";
import { SectionHeader } from "@/components/section-header";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import {
  Crown,
  Activity,
  CalendarCheck,
  MessageCircle,
  FileText,
  Briefcase,
  Calendar,
  MapPin,
  Instagram,
  LinkIcon,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface PublicProfile {
  id: string;
  name: string;
  image: string | null;
  role: string;
  createdAt: string;
  profile: {
    bio: string | null;
    bannerUrl: string | null;
    displayName: string | null;
    profession: string | null;
    birthday: string | null;
    city: string | null;
    instagram: string | null;
    externalLink: string | null;
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

function formatAge(birthday: string): string {
  const birth = new Date(birthday);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} anos`;
}

export default function PublicProfilePage() {
  const params = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${params.slug}`);
      if (res.ok) {
        setProfile(await res.json());
      } else if (res.status === 404) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [params.slug]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div>
        <div className="h-36 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 animate-pulse" />
        <div className="px-4 py-4 space-y-4 mt-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
        <p className="text-text-secondary text-sm mb-4">Perfil não encontrado.</p>
        <Link
          href="/inicio"
          className="px-4 py-2 rounded-xl bg-brand-900 text-white text-sm font-medium hover:bg-brand-800 transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    );
  }

  const interests = profile.profile?.interests ?? [];
  const skills = profile.profile?.skills ?? [];
  const bio = profile.profile?.bio;
  const displayName = profile.profile?.displayName || profile.name;

  return (
    <div className="min-h-screen bg-bg">
      {/* Banner + Avatar */}
      <div className="relative">
        <div className="h-36 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 relative overflow-hidden">
          {profile.profile?.bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profile.bannerUrl}
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {!profile.profile?.bannerUrl && (
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-8 w-24 h-24 border border-white/30 rounded-full" />
              <div className="absolute bottom-2 left-12 w-16 h-16 border border-white/20 rounded-full" />
              <div className="absolute top-8 left-1/3 w-8 h-8 border border-white/25 rounded-full" />
            </div>
          )}

          {/* Back button */}
          <div className="absolute top-3 left-3 z-10">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors backdrop-blur-sm"
            >
              <ArrowLeft size={16} />
            </button>
          </div>
        </div>

        {/* Avatar overlapping */}
        <div className="absolute -bottom-10 left-4">
          <UserAvatar
            src={profile.image ?? ""}
            name={displayName ?? ""}
            size="xl"
            goldBorder
            className="border-4 border-bg"
          />
        </div>
      </div>

      {/* Name + Badges */}
      <div className="pt-14 px-4 pb-2">
        <div>
          <h1 className="text-[20px] font-bold text-text-primary">{displayName}</h1>
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

      {/* Profile sections */}
      <div className="px-4 py-3 space-y-4">
        <AnimatedList className="space-y-4">
          {/* História da Rainha */}
          <AnimatedItem>
            <Card>
              <SectionHeader title="✨ História da Rainha" />
              <div>
                <p className="text-[14px] text-text-secondary leading-relaxed">
                  {bio || "Nenhuma bio definida ainda."}
                </p>

                {(profile.profile?.profession || profile.profile?.birthday || profile.profile?.city || profile.profile?.instagram || profile.profile?.externalLink) && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-muted/15">
                    {profile.profile?.profession && (
                      <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                        <Briefcase size={13} className="text-muted" />
                        {profile.profile.profession}
                      </span>
                    )}
                    {profile.profile?.birthday && (
                      <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                        <Calendar size={13} className="text-muted" />
                        {formatAge(profile.profile.birthday)}
                      </span>
                    )}
                    {profile.profile?.city && (
                      <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                        <MapPin size={13} className="text-muted" />
                        {profile.profile.city}
                      </span>
                    )}
                    {profile.profile?.instagram && (
                      <span className="flex items-center gap-1.5 text-[12px] text-brand-900 font-medium">
                        <Instagram size={13} />
                        {profile.profile.instagram}
                      </span>
                    )}
                    {profile.profile?.externalLink && (
                      <span className="flex items-center gap-1.5 text-[12px] text-brand-900 font-medium">
                        <LinkIcon size={13} />
                        Site / Link
                      </span>
                    )}
                  </div>
                )}
              </div>
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

          {/* Jornada no Reino */}
          <AnimatedItem>
            <Card>
              <SectionHeader title="Jornada no Reino" />
              <div className="relative pl-6">
                <div className="absolute left-2.5 top-1 bottom-1 w-[2px] bg-muted/25 rounded-full" />
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-brand-900/10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-brand-900" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-text-primary">Entrou no Reino</p>
                      <p className="text-[12px] text-text-secondary">Início da jornada na comunidade</p>
                      <p className="text-[11px] text-muted mt-0.5">{formatDate(profile.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </AnimatedItem>
        </AnimatedList>
      </div>
    </div>
  );
}
