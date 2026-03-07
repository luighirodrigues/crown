"use client";

import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { UserAvatar } from "./user-avatar";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
  delay?: number;
  onLike?: () => void;
}

export function PostCard({ post, delay = 0, onLike }: PostCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "bg-surface rounded-[var(--radius-card)] p-4",
        "shadow-[var(--shadow-card)]"
      )}
    >
      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        <UserAvatar src={post.author.avatarUrl} name={post.author.name} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-text-primary truncate">
            {post.author.name}
          </p>
          <p className="text-[11px] text-text-secondary">{timeAgo(post.createdAt)}</p>
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <h3 className="text-[15px] font-semibold text-text-primary mb-1.5 leading-snug">
          {post.title}
        </h3>
      )}

      {/* Body */}
      <p className="text-[14px] text-text-secondary leading-relaxed line-clamp-4">
        {post.body}
      </p>

      {/* Image */}
      {post.imageUrl && (
        <div className="mt-3 rounded-[var(--radius-img)] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt=""
            className="w-full h-44 object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 mt-3 pt-3 border-t border-muted/20">
        <button onClick={onLike} className="flex items-center gap-1.5 text-text-secondary hover:text-brand-900 transition-colors">
          <Heart size={16} strokeWidth={1.8} />
          <span className="text-[12px] font-medium">{post.likeCount}</span>
        </button>
        <button className="flex items-center gap-1.5 text-text-secondary hover:text-brand-900 transition-colors">
          <MessageCircle size={16} strokeWidth={1.8} />
          <span className="text-[12px] font-medium">{post.commentCount}</span>
        </button>
        <button className="ml-auto text-text-secondary hover:text-brand-900 transition-colors">
          <Share2 size={16} strokeWidth={1.8} />
        </button>
      </div>
    </motion.article>
  );
}
