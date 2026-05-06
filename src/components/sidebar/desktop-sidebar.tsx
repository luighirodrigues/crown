"use client";

import { SidebarProfileCard } from "./profile-card";
import { SidebarEventWidget } from "./event-widget";
import { SidebarCourseWidget } from "./course-widget";
import { SidebarRankingWidget } from "./ranking-widget";
import { SidebarNewMembersWidget } from "./new-members-widget";
import { SidebarMembersGalleryWidget } from "./members-gallery-widget";
import type { CrownEvent, Course, RankingEntry } from "@/lib/types";

interface MemberPreview {
  id: string;
  name: string;
  image: string | null;
  slug: string | null;
  createdAt?: string;
}

interface DesktopSidebarProps {
  userName: string;
  userAvatar: string;
  userSlug?: string;
  userId: string;
  totalTributos: number;
  rankPosition: number | null;
  presencaGeral: number;
  nextEvent: CrownEvent | null;
  currentCourse: Course | null;
  rankings: RankingEntry[];
  userTributos?: number;
  recentMembers: MemberPreview[];
  allMembers: MemberPreview[];
  totalMemberCount: number;
}

export function DesktopSidebar({
  userName,
  userAvatar,
  userSlug,
  userId,
  totalTributos,
  rankPosition,
  presencaGeral,
  nextEvent,
  currentCourse,
  rankings,
  userTributos,
  recentMembers,
  allMembers,
  totalMemberCount,
}: DesktopSidebarProps) {
  return (
    <aside className="space-y-4 sticky top-[80px] self-start">
      <SidebarProfileCard
        userName={userName}
        userAvatar={userAvatar}
        userSlug={userSlug}
        userId={userId}
        totalTributos={totalTributos}
        rankPosition={rankPosition}
        presencaGeral={presencaGeral}
      />
      <SidebarEventWidget event={nextEvent} />
      <SidebarCourseWidget course={currentCourse} />
      <SidebarRankingWidget
        rankings={rankings}
        userRank={rankPosition}
        userTributos={userTributos ?? totalTributos}
      />
      <SidebarNewMembersWidget members={recentMembers} />
      <SidebarMembersGalleryWidget members={allMembers} totalCount={totalMemberCount} />
    </aside>
  );
}
