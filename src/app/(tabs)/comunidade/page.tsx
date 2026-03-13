"use client";

import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/app-header";
import { Chip } from "@/components/chip";
import { PostCard } from "@/components/post-card";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toPost, toChannel } from "@/lib/transformers";
import type { Post, Channel } from "@/lib/types";

const ALL_CHANNEL: Channel = {
  id: "all",
  name: "Todos",
  icon: "LayoutGrid",
  slug: "all",
  postCount: 0,
};

export default function ComunidadePage() {
  const [channels, setChannels] = useState<Channel[]>([ALL_CHANNEL]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeChannel, setActiveChannel] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", body: "", channelId: "" });
  const [creating, setCreating] = useState(false);

  // Fetch channels
  useEffect(() => {
    fetch("/api/channels")
      .then((r) => r.json())
      .then((data) => {
        const mapped = data.map(toChannel);
        setChannels([ALL_CHANNEL, ...mapped]);
        if (mapped.length > 0 && !newPost.channelId) {
          setNewPost((p) => ({ ...p, channelId: mapped[0].id }));
        }
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch posts when channel changes
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeChannel !== "all" ? `?channelId=${activeChannel}` : "";
      const res = await fetch(`/api/posts${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.map(toPost));
      }
    } finally {
      setLoading(false);
    }
  }, [activeChannel]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function handleCreatePost() {
    if (!newPost.title.trim() || !newPost.body.trim() || !newPost.channelId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });
      if (res.ok) {
        setShowNewPost(false);
        setNewPost({ title: "", body: "", channelId: channels[1]?.id ?? "" });
        await fetchPosts();
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      {/* Header */}
      <AppHeader
        title="Comunidade"
        rightActions={
          <button
            onClick={() => setShowNewPost(!showNewPost)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white text-[13px] font-semibold hover:bg-white/20 transition-colors"
          >
            <Plus size={16} />
            Novo Post
          </button>
        }
      />

      {/* New Post Form */}
      <AnimatePresence>
        {showNewPost && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-surface border-b border-muted/20"
          >
            <div className="p-4 space-y-3">
              <select
                value={newPost.channelId}
                onChange={(e) => setNewPost((p) => ({ ...p, channelId: e.target.value }))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface focus:outline-none focus:ring-1 focus:ring-brand-900/30"
              >
                {channels.slice(1).map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Título do post"
                value={newPost.title}
                onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30"
              />
              <textarea
                placeholder="O que você quer compartilhar?"
                value={newPost.body}
                onChange={(e) => setNewPost((p) => ({ ...p, body: e.target.value }))}
                rows={3}
                className="w-full text-sm px-3 py-2 rounded-xl border border-muted/30 bg-surface placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-900/30 resize-none"
              />
              <button
                onClick={handleCreatePost}
                disabled={creating || !newPost.title.trim() || !newPost.body.trim()}
                className="w-full py-2 rounded-xl bg-brand-900 text-white text-sm font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50"
              >
                {creating ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Channel chips */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          {channels.map((channel) => (
            <Chip
              key={channel.id}
              label={channel.name}
              icon={channel.icon}
              active={activeChannel === channel.id}
              onClick={() => setActiveChannel(channel.id)}
            />
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="px-4 pb-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-surface rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeChannel}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {posts.length > 0 ? (
                posts.map((post, i) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    delay={i * 0.05}
                  />
                ))
              ) : (
                <div className="py-16 text-center">
                  <p className="text-[14px] text-text-secondary">
                    Nenhuma publicação neste canal ainda.
                  </p>
                  <button
                    onClick={() => setShowNewPost(true)}
                    className="mt-3 px-4 py-2 rounded-[var(--radius-btn)] bg-brand-900 text-white text-[13px] font-semibold hover:bg-brand-800 transition-colors"
                  >
                    Criar primeiro post
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </>
  );
}
