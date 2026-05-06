"use client";

import { Card } from "@/components/card";
import { UserAvatar } from "@/components/user-avatar";
import { Users } from "lucide-react";
import Link from "next/link";

interface MemberPreview {
  id: string;
  name: string;
  image: string | null;
  slug: string | null;
}

interface MembersGalleryWidgetProps {
  members: MemberPreview[];
  totalCount: number;
}

export function SidebarMembersGalleryWidget({ members, totalCount }: MembersGalleryWidgetProps) {
  if (members.length === 0) return null;

  const remaining = totalCount - members.length;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold text-text-primary flex items-center gap-2">
          <Users size={16} className="text-brand-900" />
          Rainhas do Reino
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {members.map((member) => (
          <Link key={member.id} href={`/perfil/${member.slug || member.id}`} title={member.name}>
            <UserAvatar src={member.image ?? ""} name={member.name} size="md" />
          </Link>
        ))}
      </div>

      {remaining > 0 && (
        <Link
          href="/comunidade"
          className="block mt-3 text-[12px] font-medium text-brand-900 hover:text-brand-800 transition-colors"
        >
          +{remaining} outras rainhas →
        </Link>
      )}
    </Card>
  );
}
