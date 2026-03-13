/**
 * Transform raw Prisma/API data into the UI types expected by components.
 * This bridges the gap between DB schema (e.g., user.image) and UI types (e.g., user.avatarUrl).
 */

import type {
  Post,
  CrownEvent,
  Ritual,
  Mission,
  RankingEntry,
  Channel,
  Course,
  Notification,
} from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

/** Transform a Prisma Post (with author + _count) to UI Post */
export function toPost(raw: AnyRecord): Post {
  return {
    id: raw.id,
    channelId: raw.channelId,
    author: {
      id: raw.author?.id ?? "",
      name: raw.author?.name ?? "Desconhecida",
      avatarUrl: raw.author?.image ?? "",
      slug: raw.author?.slug ?? undefined,
      role: raw.author?.role ?? "MEMBER",
      joinedAt: raw.author?.createdAt ?? "",
    },
    title: raw.title ?? "",
    body: raw.body ?? "",
    imageUrl: raw.imageUrl ?? undefined,
    likeCount: raw._count?.likes ?? raw.likeCount ?? 0,
    commentCount: raw._count?.comments ?? raw.commentCount ?? 0,
    liked: raw.liked ?? false,
    createdAt: raw.createdAt ?? "",
    pinned: raw.pinned ?? false,
  };
}

/** Transform a Prisma Event to UI CrownEvent */
export function toEvent(raw: AnyRecord): CrownEvent {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    datetime: raw.datetime,
    link: raw.link ?? undefined,
    location: raw.location ?? undefined,
  };
}

/** Transform a Prisma Channel to UI Channel */
export function toChannel(raw: AnyRecord): Channel {
  return {
    id: raw.id,
    name: raw.name,
    icon: raw.icon ?? "Hash",
    slug: raw.slug,
    postCount: raw._count?.posts ?? 0,
  };
}

/** Transform a Prisma Ritual to UI Ritual (with computed fields) */
export function toRitual(raw: AnyRecord, userCheckIns?: AnyRecord[]): Ritual {
  const startAt = new Date(raw.startAt);
  const endAt = new Date(raw.endAt);
  const totalDays = Math.max(1, Math.ceil((endAt.getTime() - startAt.getTime()) / 86400000));
  const monthLabel = startAt.toLocaleDateString("pt-BR", { month: "long", timeZone: "America/Sao_Paulo" });
  const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  // Use pre-computed completedDays from API, or count from userCheckIns, or 0
  const completedDays = raw.completedDays != null
    ? raw.completedDays
    : userCheckIns
      ? userCheckIns.filter((c: AnyRecord) => c.isCounted && c.status === "APPROVED").length
      : 0;

  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    imageUrl: raw.imageUrl ?? "",
    pointsValue: raw.pointsValue ?? 0,
    startAt: raw.startAt,
    endAt: raw.endAt,
    monthLabel: capitalizedMonth,
    totalDays,
    completedDays,
    autoApprove: raw.autoApprove ?? true,
    participantCount: raw.participantCount ?? 0,
    todayCheckedIn: raw.todayCheckedIn ?? false,
  };
}

/** Transform ranking data from API to UI RankingEntry */
export function toRankingEntry(raw: AnyRecord): RankingEntry {
  return {
    position: raw.position,
    user: {
      id: raw.user?.id ?? "",
      name: raw.user?.name ?? "Desconhecida",
      avatarUrl: raw.user?.image ?? "",
      slug: raw.user?.slug ?? undefined,
      role: "MEMBER",
      joinedAt: "",
    },
    tributos: raw.tributos ?? 0,
  };
}

/** Transform a Prisma Mission to UI Mission (for a specific user) */
export function toMission(raw: AnyRecord, userCompletion?: AnyRecord | null): Mission {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    type: raw.type ?? "MANUAL",
    status: userCompletion?.status ?? "PENDING",
    submitted: !!userCompletion,
    autoApprove: raw.autoApprove ?? false,
    startAt: raw.startAt ?? undefined,
    endAt: raw.endAt ?? undefined,
    evidenceUrl: userCompletion?.evidenceUrl ?? undefined,
    reviewNote: userCompletion?.reviewNote ?? undefined,
    tributos: raw.tributos ?? 0,
  };
}

/** Transform a Prisma Course to UI Course */
export function toCourse(raw: AnyRecord): Course {
  const lessonCount = raw.lessons?.length ?? 0;
  const completedLessons = raw.completedLessons ?? 0;

  const lessons = raw.lessons?.map((l: AnyRecord) => ({
    id: l.id,
    title: l.title,
    link: l.link,
    order: l.order ?? 0,
    completed: l.completed ?? false,
  }));

  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    imageUrl: raw.imageUrl ?? "",
    lessonCount,
    completedLessons,
    lessons,
  };
}

/** Transform a Prisma Notification to UI Notification */
export function toNotification(raw: AnyRecord): Notification {
  const typeMap: Record<string, Notification["type"]> = {
    LIKE: "like",
    COMMENT: "comment",
    REPLY: "comment",
    APPROVAL: "approval",
    EVENT: "event",
    SYSTEM: "system",
  };
  return {
    id: raw.id,
    type: typeMap[raw.type] ?? "system",
    title: raw.title,
    body: raw.body,
    read: raw.read,
    createdAt: raw.createdAt,
  };
}
