"use client";

import { useState, useEffect, useCallback } from "react";
import { Chip } from "@/components/chip";
import { PostCard } from "@/components/post-card";
import { ImageUpload } from "@/components/image-upload";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import { Plus, Search } from "lucide-react";
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

export default function ComunidadeV2Page() {
  const [channels, setChannels] = useState<Channel[]>([ALL_CHANNEL]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeChannel, setActiveChannel] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", body: "", channelId: "", imageUrl: "" });
  const [creating, setCreating] = useState(false);

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
      const payload = {
        title: newPost.title,
        body: newPost.body,
        channelId: newPost.channelId,
        ...(newPost.imageUrl ? { imageUrl: newPost.imageUrl } : {}),
      };
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowNewPost(false);
        setNewPost({ title: "", body: "", channelId: channels[1]?.id ?? "", imageUrl: "" });
        await fetchPosts();
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="bg-bg min-h-screen">
      {/* ── Header ── */}
      <div className="bg-brand-900 text-white px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[20px] font-bold">Comunidade</h1>
          <button
            onClick={() => setShowNewPost(!showNewPost)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-brand-900 text-[13px] font-bold hover:bg-white/90 transition-colors shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} />
            Novo Post
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            placeholder="Buscar publicações..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/10 text-white text-[13px] placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30 border border-white/10"
          />
        </div>
      </div>

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
              <ImageUpload
                folder="posts"
                variant="inline"
                currentImageUrl={newPost.imageUrl || null}
                onUpload={(url) => setNewPost((p) => ({ ...p, imageUrl: url }))}
              />
              <button
                onClick={handleCreatePost}
                disabled={creating || !newPost.title.trim() || !newPost.body.trim()}
                className="w-full py-2.5 rounded-xl bg-brand-900 text-white text-sm font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50"
              >
                {creating ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Channel filter chips ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeChannel === channel.id
                  ? "bg-brand-900 text-white shadow-sm"
                  : "bg-surface text-text-secondary border border-muted/30 hover:border-brand-100"
              }`}
            >
              {channel.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Feed ── */}
      <div className="px-4 pb-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-surface rounded-2xl animate-pulse" />
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
                  <PostCard key={post.id} post={post} delay={i * 0.05} />
                ))
              ) : (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-brand-900/8 flex items-center justify-center mx-auto mb-3">
                    <Plus size={24} className="text-brand-900" />
                  </div>
                  <p className="text-[14px] text-text-secondary mb-3">
                    Nenhuma publicação neste canal ainda.
                  </p>
                  <button
                    onClick={() => setShowNewPost(true)}
                    className="px-5 py-2.5 rounded-full bg-brand-900 text-white text-[13px] font-semibold hover:bg-brand-800 transition-colors"
                  >
                    Criar primeiro post
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
