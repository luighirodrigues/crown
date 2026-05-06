"use client";

import { useState, useEffect, useCallback } from "react";
import { useIsDesktop } from "@/lib/use-media-query";
import Link from "next/link";
import { Card } from "@/components/card";
import { UserAvatar } from "@/components/user-avatar";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import { AppHeader } from "@/components/app-header";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  MapPin,
  MessageCircle,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

interface MemberData {
  id: string;
  name: string | null;
  slug: string | null;
  image: string | null;
  createdAt: string;
  profile: {
    bannerUrl: string | null;
    profession: string | null;
    city: string | null;
    bio: string | null;
    instagram: string | null;
  } | null;
}

interface MembersResponse {
  members: MemberData[];
  total: number;
  page: number;
  totalPages: number;
}

const PER_PAGE = 12;

export default function MembrosPage() {
  const isDesktop = useIsDesktop();

  if (isDesktop) return <MembrosDesktopPage />;
  return <MembrosDesktopPage />;
}

function MembrosDesktopPage() {
  const [data, setData] = useState<MembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [searchInput, setSearchInput] = useState("");

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mode: "paginated",
        page: String(page),
        limit: String(PER_PAGE),
        sort,
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/members?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, sort]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  return (
    <>
      <div className="lg:hidden">
        <AppHeader title="Membros" />
      </div>

      <div className="desktop-container py-8 pb-16">
        {/* ── Header Row ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-[28px] lg:text-[32px] font-bold text-text-primary tracking-tight">
              Mural de Membros
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                placeholder="Pesquise pelo nome, profissão, hobbies..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={() => {
                  if (searchInput !== search) {
                    setPage(1);
                    setSearch(searchInput);
                  }
                }}
                className="pl-9 pr-4 py-2 w-72 text-[13px] rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900/30 transition-all"
              />
            </form>
            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 text-[13px] rounded-xl border border-muted/30 bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-900/20 cursor-pointer"
            >
              <option value="recent">Mais Recentes</option>
              <option value="name">Nome A-Z</option>
            </select>
          </div>
        </motion.div>

        {/* ── Section Title ── */}
        <p className="text-[14px] font-semibold text-text-primary mb-5">
          Todos os Membros
          {data && (
            <span className="text-text-secondary font-normal ml-2">
              ({data.total})
            </span>
          )}
        </p>

        {/* ── Members Grid ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: PER_PAGE }).map((_, i) => (
              <div
                key={i}
                className="h-64 bg-surface rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : data && data.members.length > 0 ? (
          <AnimatedList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {data.members.map((member) => (
              <AnimatedItem key={member.id}>
                <MemberCard member={member} />
              </AnimatedItem>
            ))}
          </AnimatedList>
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-900/8 flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-brand-900/40" />
            </div>
            <p className="text-[15px] text-text-secondary font-medium">
              {search
                ? "Nenhum membro encontrado para esta busca."
                : "Nenhum membro cadastrado."}
            </p>
          </div>
        )}

        {/* ── Pagination ── */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-muted/30 text-text-secondary hover:bg-surface-alt transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: data.totalPages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, current, and neighbors
                if (p === 1 || p === data.totalPages) return true;
                if (Math.abs(p - page) <= 1) return true;
                return false;
              })
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <span key={p} className="flex items-center gap-2">
                    {showEllipsis && (
                      <span className="text-text-secondary text-[13px]">
                        …
                      </span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 flex items-center justify-center rounded-full text-[13px] font-medium transition-colors ${
                        p === page
                          ? "bg-brand-900 text-white"
                          : "border border-muted/30 text-text-secondary hover:bg-surface-alt"
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                );
              })}

            <button
              onClick={() =>
                setPage((p) => Math.min(data.totalPages, p + 1))
              }
              disabled={page >= data.totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-muted/30 text-text-secondary hover:bg-surface-alt transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Member Card ── */
function MemberCard({ member }: { member: MemberData }) {
  const name = member.name ?? "Membro";
  const profileLink = member.slug ? `/perfil/${member.slug}` : "#";

  return (
    <Card className="overflow-hidden p-0">
      {/* Banner */}
      <div className="h-24 relative overflow-hidden">
        {member.profile?.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.profile.bannerUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-900/80 via-brand-900/50 to-teal-500/60" />
        )}
        {/* Avatar overlay */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
          <UserAvatar
            src={member.image ?? ""}
            name={name}
            size="lg"
            className="ring-3 ring-surface"
          />
        </div>
      </div>

      {/* Content */}
      <div className="pt-8 pb-4 px-4 text-center">
        <h3 className="text-[14px] font-bold text-text-primary truncate">
          {name}
        </h3>
        {member.slug && (
          <p className="text-[11px] text-text-secondary truncate mt-0.5">
            @{member.slug}
          </p>
        )}

        {/* Profession + City */}
        <div className="mt-2.5 space-y-1">
          {member.profile?.profession && (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-secondary">
              <Briefcase size={12} className="shrink-0" />
              <span className="truncate">{member.profile.profession}</span>
            </div>
          )}
          {member.profile?.city && (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-secondary">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{member.profile.city}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <Link
            href={profileLink}
            className="flex-1 py-2 rounded-xl border border-brand-900/30 text-brand-900 text-[12px] font-semibold hover:bg-brand-900/5 transition-colors text-center"
          >
            Ver Perfil
          </Link>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-success-500/30 text-success-500 hover:bg-success-500/5 transition-colors shrink-0"
            title="Enviar mensagem"
          >
            <MessageCircle size={15} />
          </button>
        </div>
      </div>
    </Card>
  );
}
