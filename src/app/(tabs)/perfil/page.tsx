"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/card";
import { CrownBadge } from "@/components/crown-badge";
import { SectionHeader } from "@/components/section-header";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import { ImageUpload } from "@/components/image-upload";
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
  X,
  Check,
  Plus,
  Briefcase,
  Calendar,
  MapPin,
  Instagram,
  LinkIcon,
  FlaskConical,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import { toRitual } from "@/lib/transformers";
import { fireCrownConfetti, rememberTributeTotal } from "@/lib/celebration.service";
import type { Ritual } from "@/lib/types";
import { useLayoutVersion } from "@/lib/layout-version";

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

interface PointsEntry {
  id: string;
  ruleKey: string;
  points: number;
  sourceType: string;
  createdAt: string;
}

interface UserProfile {
  id: string;
  name: string;
  image: string | null;
  email: string;
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
  pointsHistory: PointsEntry[];
  stats: {
    totalTributos: number;
    presencaGeral: number;
    presencaRotina: number;
    postsCount: number;
    commentsCount: number;
    rankPosition: number | null;
  };
}

const ruleLabels: Record<string, string> = {
  CREATE_POST: "Criar post",
  COMMENT: "Comentar",
  RITUAL_CHECKIN: "Check-in em ritual",
  MISSION_COMPLETE: "Completar missão",
  LESSON_COMPLETE: "Completar aula",
};

const sourceIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  post: FileText,
  comment: MessageCircle,
  ritual_checkin: Flame,
  mission: Target,
  course_lesson: Trophy,
};

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

export default function PerfilPage() {
  const { version, toggle } = useLayoutVersion();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Draft fields for editing
  const [draftBio, setDraftBio] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftProfession, setDraftProfession] = useState("");
  const [draftBirthday, setDraftBirthday] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [draftInstagram, setDraftInstagram] = useState("");
  const [draftExternalLink, setDraftExternalLink] = useState("");
  const [draftInterests, setDraftInterests] = useState<string[]>([]);
  const [draftSkills, setDraftSkills] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [visibleHistory, setVisibleHistory] = useState(10);

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

  useEffect(() => {
    if (!profile) return;

    const milestone = rememberTributeTotal(
      `crown:tribute-total:${profile.id}`,
      profile.stats.totalTributos
    );
    if (milestone) {
      void fireCrownConfetti();
    }
  }, [profile?.id, profile?.stats.totalTributos, profile]);

  function enterEditMode() {
    setDraftBio(profile?.profile?.bio ?? "");
    setDraftName(profile?.name ?? "");
    setDraftProfession(profile?.profile?.profession ?? "");
    setDraftBirthday(profile?.profile?.birthday ? profile.profile.birthday.split("T")[0] : "");
    setDraftCity(profile?.profile?.city ?? "");
    setDraftInstagram(profile?.profile?.instagram ?? "");
    setDraftExternalLink(profile?.profile?.externalLink ?? "");
    setDraftInterests(profile?.profile?.interests ?? []);
    setDraftSkills(profile?.profile?.skills ?? []);
    setNewInterest("");
    setNewSkill("");
    setEditing(true);
  }

  function cancelEditMode() {
    setEditing(false);
  }

  async function saveProfile() {
    setSaving(true);
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: draftBio,
          name: draftName,
          profession: draftProfession,
          birthday: draftBirthday || undefined,
          city: draftCity,
          instagram: draftInstagram,
          externalLink: draftExternalLink,
          interests: draftInterests,
          skills: draftSkills,
        }),
      });
      await fetchData();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

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
        <div className={`h-36 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 relative overflow-hidden ${editing ? "group/banner cursor-pointer" : ""}`}>
          {/* Banner image if set */}
          {profile.profile?.bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profile.bannerUrl}
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {/* Decorative pattern (shown when no banner image) */}
          {!profile.profile?.bannerUrl && (
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-8 w-24 h-24 border border-white/30 rounded-full" />
              <div className="absolute bottom-2 left-12 w-16 h-16 border border-white/20 rounded-full" />
              <div className="absolute top-8 left-1/3 w-8 h-8 border border-white/25 rounded-full" />
            </div>
          )}

          {/* Banner hover overlay — only in edit mode */}
          {editing && (
            <ImageUpload
              folder="banners"
              variant="banner"
              currentImageUrl={profile.profile?.bannerUrl}
              onUpload={async (url) => {
                await fetch("/api/users/me", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ bannerUrl: url }),
                });
                fetchData();
              }}
              className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/0 group-hover/banner:bg-black/40 transition-all opacity-0 group-hover/banner:opacity-100 rounded-none"
            />
          )}

          {/* Top actions */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            {editing && (
              <>
                <button
                  onClick={cancelEditMode}
                  className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors backdrop-blur-sm"
                  title="Cancelar"
                >
                  <X size={16} />
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-600 text-white text-[11px] font-medium hover:bg-green-700 transition-colors backdrop-blur-sm disabled:opacity-50"
                  title="Salvar"
                >
                  <Check size={14} />
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </>
            )}
            {!editing && (
              <button
                onClick={enterEditMode}
                className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors backdrop-blur-sm"
                title="Editar perfil"
              >
                <Settings size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Avatar overlapping */}
        <div className={`absolute -bottom-10 left-4 ${editing ? "group/avatar" : ""}`}>
          <UserAvatar
            src={profile.image ?? ""}
            name={profile.name ?? ""}
            size="xl"
            goldBorder
            className="border-4 border-bg"
          />
          {editing && (
            <ImageUpload
              folder="avatars"
              variant="avatar"
              currentImageUrl={profile.image}
              onUpload={async (url) => {
                await fetch("/api/users/me", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ image: url }),
                });
                fetchData();
              }}
              className="opacity-0 group-hover/avatar:opacity-100 transition-opacity"
            />
          )}
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
          {/* Layout Version Toggle */}
          <AnimatedItem>
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <FlaskConical size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-text-primary">Testar Novo Layout</p>
                    <p className="text-[11px] text-text-secondary">
                      {version === "v1" ? "Usando layout atual" : "Usando layout novo (teste)"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggle}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${
                    version === "v2" ? "bg-purple-600" : "bg-muted/40"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 ${
                      version === "v2" ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </Card>
          </AnimatedItem>

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

          {/* História da Rainha */}
          <AnimatedItem>
            <Card>
              <SectionHeader title="✨ História da Rainha" />
              {editing ? (
                <div className="space-y-4">
                  {/* Biografia */}
                  <div>
                    <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">Biografia</label>
                    <textarea
                      value={draftBio}
                      onChange={(e) => setDraftBio(e.target.value.slice(0, 500))}
                      placeholder="Conte sua história aqui..."
                      rows={4}
                      className="w-full text-[14px] px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30 resize-none leading-relaxed"
                    />
                    <p className="text-[11px] text-muted text-right mt-1">{draftBio.length}/500</p>
                  </div>

                  {/* Nome de exibição */}
                  <div>
                    <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">Nome</label>
                    <input
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full text-[14px] px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                    />
                  </div>

                  {/* Profissão & Aniversário */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">Profissão</label>
                      <input
                        type="text"
                        value={draftProfession}
                        onChange={(e) => setDraftProfession(e.target.value)}
                        placeholder="Sua profissão"
                        className="w-full text-[14px] px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">Aniversário</label>
                      <input
                        type="date"
                        value={draftBirthday}
                        onChange={(e) => setDraftBirthday(e.target.value)}
                        className="w-full text-[14px] px-3 py-2 rounded-xl border border-muted/30 bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                      />
                    </div>
                  </div>

                  {/* Cidade & Instagram */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">Cidade</label>
                      <input
                        type="text"
                        value={draftCity}
                        onChange={(e) => setDraftCity(e.target.value)}
                        placeholder="Sua cidade"
                        className="w-full text-[14px] px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">Instagram</label>
                      <input
                        type="text"
                        value={draftInstagram}
                        onChange={(e) => setDraftInstagram(e.target.value)}
                        placeholder="Seu @"
                        className="w-full text-[14px] px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                      />
                    </div>
                  </div>

                  {/* Link externo */}
                  <div>
                    <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block">Link externo / Site</label>
                    <input
                      type="text"
                      value={draftExternalLink}
                      onChange={(e) => setDraftExternalLink(e.target.value)}
                      placeholder="seusite.com.br"
                      className="w-full text-[14px] px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[14px] text-text-secondary leading-relaxed">
                    {bio || "Nenhuma bio definida ainda. Edite seu perfil para contar sua história!"}
                  </p>

                  {/* Metadata row */}
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
              )}
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
          {(editing || interests.length > 0 || skills.length > 0) && (
            <AnimatedItem>
              <Card>
                <SectionHeader title="Interesses & Habilidades" />
                {editing ? (
                  <div className="space-y-4">
                    {/* Interesses editing */}
                    <div>
                      <p className="text-[12px] font-medium text-text-secondary mb-2">Interesses</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {draftInterests.map((interest) => (
                          <span
                            key={interest}
                            className="flex items-center gap-1 px-3 py-1 rounded-full bg-brand-900/8 text-brand-900 text-[12px] font-medium"
                          >
                            {interest}
                            <button
                              onClick={() => setDraftInterests((prev) => prev.filter((i) => i !== interest))}
                              className="ml-0.5 hover:text-red-500 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newInterest.trim()) {
                              e.preventDefault();
                              if (!draftInterests.includes(newInterest.trim())) {
                                setDraftInterests((prev) => [...prev, newInterest.trim()]);
                              }
                              setNewInterest("");
                            }
                          }}
                          placeholder="Adicionar interesse..."
                          className="flex-1 text-[13px] px-3 py-1.5 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                        />
                        <button
                          onClick={() => {
                            if (newInterest.trim() && !draftInterests.includes(newInterest.trim())) {
                              setDraftInterests((prev) => [...prev, newInterest.trim()]);
                              setNewInterest("");
                            }
                          }}
                          className="p-1.5 rounded-xl bg-brand-900/10 text-brand-900 hover:bg-brand-900/20 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Habilidades editing */}
                    <div>
                      <p className="text-[12px] font-medium text-text-secondary mb-2">Habilidades</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {draftSkills.map((skill) => (
                          <span
                            key={skill}
                            className="flex items-center gap-1 px-3 py-1 rounded-full bg-gold-500/15 text-amber-700 text-[12px] font-medium"
                          >
                            {skill}
                            <button
                              onClick={() => setDraftSkills((prev) => prev.filter((s) => s !== skill))}
                              className="ml-0.5 hover:text-red-500 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newSkill.trim()) {
                              e.preventDefault();
                              if (!draftSkills.includes(newSkill.trim())) {
                                setDraftSkills((prev) => [...prev, newSkill.trim()]);
                              }
                              setNewSkill("");
                            }
                          }}
                          placeholder="Adicionar habilidade..."
                          className="flex-1 text-[13px] px-3 py-1.5 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                        />
                        <button
                          onClick={() => {
                            if (newSkill.trim() && !draftSkills.includes(newSkill.trim())) {
                              setDraftSkills((prev) => [...prev, newSkill.trim()]);
                              setNewSkill("");
                            }
                          }}
                          className="p-1.5 rounded-xl bg-gold-500/15 text-amber-700 hover:bg-gold-500/25 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
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
                )}
              </Card>
            </AnimatedItem>
          )}

          {/* Histórico de Tributos */}
          <AnimatedItem>
            <Card>
              <SectionHeader title="Histórico de Tributos" />
              {profile.pointsHistory.length > 0 ? (
                <div className="space-y-2">
                  {profile.pointsHistory.slice(0, visibleHistory).map((entry) => {
                    const Icon = sourceIcons[entry.sourceType] || Gem;
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between py-2 px-1 border-b border-muted/10 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gold-500/15 flex items-center justify-center">
                            <Icon size={14} className="text-gold-600" />
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-text-primary">
                              {ruleLabels[entry.ruleKey] || entry.ruleKey}
                            </p>
                            <p className="text-[11px] text-muted">
                              {formatDate(entry.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className="text-[13px] font-semibold text-gold-600">
                          +{entry.points}
                        </span>
                      </div>
                    );
                  })}
                  {profile.pointsHistory.length > visibleHistory && (
                    <button
                      onClick={() => setVisibleHistory((v) => v + 10)}
                      className="w-full py-2 text-[13px] font-medium text-brand-900 hover:text-brand-800 transition-colors"
                    >
                      Ver mais
                    </button>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon="gem"
                  message="Seu extrato de tributos aparecerá aqui conforme você participa da comunidade."
                />
              )}
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
