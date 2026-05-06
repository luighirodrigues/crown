"use client";

import { Card } from "@/components/card";
import { UserAvatar } from "@/components/user-avatar";
import { UserPlus } from "lucide-react";
import Link from "next/link";

interface MemberPreview {
  id: string;
  name: string;
  image: string | null;
  slug: string | null;
  createdAt?: string;
}

interface NewMembersWidgetProps {
  members: MemberPreview[];
}

export function SidebarNewMembersWidget({ members }: NewMembersWidgetProps) {
  if (members.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold text-text-primary flex items-center gap-2">
          <UserPlus size={16} className="text-brand-900" />
          Novas Rainhas
        </h3>
        <Link href="/comunidade" className="text-[12px] font-medium text-brand-900 hover:text-brand-800">
          Membros &gt;
        </Link>
      </div>

      <div className="space-y-2.5">
        {members.map((member) => (
          <Link
            key={member.id}
            href={`/perfil/${member.slug || member.id}`}
            className="flex items-center gap-3 hover:bg-surface-alt rounded-lg p-1.5 -mx-1.5 transition-colors"
          >
            <UserAvatar src={member.image ?? ""} name={member.name} size="sm" />
            <span className="text-[13px] font-medium text-text-primary flex-1 truncate">
              {member.name}
            </span>
            <span className="text-[10px] font-semibold text-success-500 bg-success-500/10 px-2 py-0.5 rounded-full">
              Nova
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
