// ── CROWN Type Definitions ──

export type Role = "MEMBER" | "ADMIN" | "MODERATOR";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type MissionType = "MANUAL" | "AUTOMATIC";
export type PresenceType = "GENERAL" | "ROUTINE";

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  role: Role;
  joinedAt: string;
}

export interface Profile extends User {
  bannerUrl?: string;
  bio?: string;
  interests: string[];
  skills: string[];
  totalTributos: number;
  presencaGeral: number;
  presencaRotina: number;
  postsCount: number;
  commentsCount: number;
  rankPosition?: number;
  badges: Badge[];
  achievements: Achievement[];
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  variant: "gold" | "brand" | "neutral";
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface Channel {
  id: string;
  name: string;
  icon: string;
  slug: string;
  postCount: number;
}

export interface Post {
  id: string;
  channelId: string;
  author: User;
  title: string;
  body: string;
  imageUrl?: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  createdAt: string;
  pinned?: boolean;
}

export interface CrownEvent {
  id: string;
  title: string;
  description: string;
  datetime: string;
  link?: string;
  location?: string;
}

export interface Ritual {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  pointsValue: number;
  startAt: string;
  endAt: string;
  monthLabel: string;
  totalDays: number;
  completedDays: number;
  autoApprove: boolean;
  participantCount: number;
  todayCheckedIn: boolean;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  type: MissionType;
  status: ApprovalStatus;
  submitted: boolean;
  autoApprove: boolean;
  startAt?: string;
  endAt?: string;
  evidenceUrl?: string;
  reviewNote?: string;
  tributos?: number;
}

export interface CourseLesson {
  id: string;
  title: string;
  link: string;
  order: number;
  completed: boolean;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  lessonCount: number;
  completedLessons: number;
  lessons?: CourseLesson[];
}

export interface RankingEntry {
  user: User;
  position: number;
  tributos: number;
}

export interface Notification {
  id: string;
  type: "like" | "comment" | "approval" | "event" | "system";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface JourneyEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: string;
}
