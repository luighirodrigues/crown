"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import { Heart, MessageCircle, Share2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserAvatar } from "./user-avatar";
import { ImageUpload } from "./image-upload";
import Link from "next/link";
import type { Post } from "@/lib/types";

interface Comment {
  id: string;
  body: string;
  imageUrl?: string | null;
  createdAt: string;
  author: { id: string; name: string; image?: string; slug?: string | null };
  replies?: Comment[];
}

interface PostCardProps {
  post: Post;
  delay?: number;
}

export function PostCard({ post, delay = 0 }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [liking, setLiking] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentImageUrl, setCommentImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLike = useCallback(async () => {
    if (liking) return;
    // Optimistic update
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    setLiking(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/likes`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.count);
      } else {
        // Revert on error
        setLiked((prev) => !prev);
        setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
      }
    } catch {
      setLiked((prev) => !prev);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
    } finally {
      setLiking(false);
    }
  }, [post.id, liked, liking]);

  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } finally {
      setLoadingComments(false);
    }
  }, [post.id]);

  const toggleComments = useCallback(() => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments((prev) => !prev);
  }, [showComments, fetchComments]);

  const handleSubmitComment = useCallback(async () => {
    if ((!commentText.trim() && !commentImageUrl) || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: commentText.trim() || " ",
          imageUrl: commentImageUrl || undefined,
        }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [...prev, newComment]);
        setCommentCount((prev) => prev + 1);
        setCommentText("");
        setCommentImageUrl("");
      }
    } finally {
      setSubmitting(false);
    }
  }, [post.id, commentText, commentImageUrl, submitting]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "bg-surface rounded-[var(--radius-card)]",
        "shadow-[var(--shadow-card)]"
      )}
    >
      <div className="p-4">
        {/* Author row */}
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/perfil/${post.author.slug || post.author.id}`}>
            <UserAvatar src={post.author.avatarUrl} name={post.author.name} size="sm" />
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/perfil/${post.author.slug || post.author.id}`} className="hover:underline">
              <p className="text-[13px] font-semibold text-text-primary truncate">
                {post.author.name}
              </p>
            </Link>
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
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              liked ? "text-red-500" : "text-text-secondary hover:text-red-500"
            )}
          >
            <Heart
              size={16}
              strokeWidth={1.8}
              className={cn(liked && "fill-current")}
            />
            <span className="text-[12px] font-medium">{likeCount}</span>
          </button>
          <button
            onClick={toggleComments}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              showComments ? "text-brand-900" : "text-text-secondary hover:text-brand-900"
            )}
          >
            <MessageCircle
              size={16}
              strokeWidth={1.8}
              className={cn(showComments && "fill-brand-900/20")}
            />
            <span className="text-[12px] font-medium">{commentCount}</span>
          </button>
          <button className="ml-auto text-text-secondary hover:text-brand-900 transition-colors">
            <Share2 size={16} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-muted/20"
          >
            <div className="px-4 py-3 space-y-3">
              {/* Comment input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                    placeholder="Escreva um comentário..."
                    className="flex-1 text-[13px] px-3 py-2 rounded-full border border-muted/30 bg-surface-alt placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={(!commentText.trim() && !commentImageUrl) || submitting}
                    className="p-2 rounded-full bg-brand-900 text-white hover:bg-brand-800 transition-colors disabled:opacity-40"
                  >
                    <Send size={14} />
                  </button>
                </div>
                <ImageUpload
                  folder="comments"
                  variant="inline"
                  currentImageUrl={commentImageUrl || null}
                  onUpload={(url) => setCommentImageUrl(url)}
                />
              </div>

              {/* Comments list */}
              {loadingComments ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-10 bg-surface-alt rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-[12px] text-text-secondary text-center py-2">
                  Nenhum comentário ainda. Seja a primeira!
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Link href={`/perfil/${comment.author.slug || comment.author.id}`}>
          <UserAvatar
            src={comment.author.image ?? ""}
            name={comment.author.name}
            size="sm"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-surface-alt rounded-xl px-3 py-2">
            <Link href={`/perfil/${comment.author.slug || comment.author.id}`} className="hover:underline">
              <p className="text-[12px] font-semibold text-text-primary">
                {comment.author.name}
              </p>
            </Link>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              {comment.body}
            </p>
            {comment.imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={comment.imageUrl}
                  alt=""
                  className="w-full max-h-40 object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted mt-0.5 ml-3">
            {timeAgo(comment.createdAt)}
          </p>
        </div>
      </div>
      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-10 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex gap-2">
              <Link href={`/perfil/${reply.author.slug || reply.author.id}`}>
                <UserAvatar
                  src={reply.author.image ?? ""}
                  name={reply.author.name}
                  size="sm"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="bg-surface-alt rounded-xl px-3 py-2">
                  <Link href={`/perfil/${reply.author.slug || reply.author.id}`} className="hover:underline">
                    <p className="text-[12px] font-semibold text-text-primary">
                      {reply.author.name}
                    </p>
                  </Link>
                  <p className="text-[13px] text-text-secondary leading-relaxed">
                    {reply.body}
                  </p>
                  {reply.imageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={reply.imageUrl}
                        alt=""
                        className="w-full max-h-40 object-cover rounded-lg"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-muted mt-0.5 ml-3">
                  {timeAgo(reply.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
