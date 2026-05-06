"use client";

import { Card } from "@/components/card";
import { UserAvatar } from "@/components/user-avatar";
import { Crown, Gem, Trophy } from "lucide-react";
import Link from "next/link";

interface ProfileCardProps {
  userName: string;
  userAvatar: string;
  userSlug?: string;
  userId: string;
  totalTributos: number;
  rankPosition: number | null;
  presencaGeral: number;
}

export function SidebarProfileCard({
  userName,
  userAvatar,
  userSlug,
  userId,
  totalTributos,
  rankPosition,
  presencaGeral,
}: ProfileCardProps) {
  return (
    <Card className="text-center">
      {rankPosition && (
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-900/8 text-brand-900 text-[11px] font-semibold mb-3">
          <Trophy size={12} />
          #{rankPosition} Ranking
        </div>
      )}

      <div className="flex justify-center mb-3">
        <UserAvatar src={userAvatar} name={userName} size="xl" goldBorder />
      </div>

      <h3 className="text-[16px] font-bold text-text-primary">{userName}</h3>
      <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-gold-300/40 text-[11px] font-medium text-text-secondary">
        Integrante
      </span>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Crown size={14} className="text-gold-500" />
          </div>
          <p className="text-[16px] font-bold text-text-primary">{presencaGeral}</p>
          <p className="text-[10px] text-text-secondary">Conquistas</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Trophy size={14} className="text-brand-900" />
          </div>
          <p className="text-[16px] font-bold text-text-primary">{rankPosition ?? "—"}</p>
          <p className="text-[10px] text-text-secondary">Ranking</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Gem size={14} className="text-gold-500" />
          </div>
          <p className="text-[16px] font-bold text-text-primary">{totalTributos}</p>
          <p className="text-[10px] text-text-secondary">Pontos</p>
        </div>
      </div>

      <Link
        href={`/perfil/${userSlug || userId}`}
        className="block mt-4 text-[13px] font-medium text-brand-900 hover:text-brand-800 transition-colors"
      >
        Ver perfil completo →
      </Link>
    </Card>
  );
}
