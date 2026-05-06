"use client";

import { useState, useEffect, useCallback } from "react";
import { PostCard } from "@/components/post-card";
import { ImageUpload } from "@/components/image-upload";
import { AnimatedList, AnimatedItem } from "@/components/animated-list";
import {
  Plus,
  Hash,
  ChevronRight,
  MessageSquare,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toPost, toChannel } from "@/lib/transformers";
import type { Post, Channel } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ComunidadeDesktopPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", body: "", channelId: "", imageUrl: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/channels")
      .then((r) => r.json())
      .then((data) => {
        const mapped = data.map(toChannel);
        setChannels(mapped);
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
      const params = activeChannel ? `?channelId=${activeChannel}` : "";
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
        setNewPost({ title: "", body: "", channelId: channels[0]?.id ?? "", imageUrl: "" });
        await fetchPosts();
      }
    } finally {
      setCreating(false);
    }
  }

  const activeChannelData = channels.find((c) => c.id === activeChannel);
  const activeChannelName = activeChannelData?.name ?? "Feed Geral";
  const activeChannelPostCount = activeChannelData?.postCount ?? posts.length;

  // Split channels into "canais" (main channels) and "categorias" (categories)
  // For now treat all channels as canais — categorias is a visual placeholder
  const mainChannels = channels;

  return (
    <div className="desktop-container py-0">
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* ── Left Sidebar ── */}
        <aside className="w-[240px] shrink-0 border-r border-muted/15 bg-surface/60 backdrop-blur-sm">
          <div className="sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto py-5 px-4 flex flex-col">
            {/* New Post Button */}
            <button
              onClick={() => setShowNewPost(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-900 text-white text-[13px] font-bold hover:bg-brand-800 transition-all duration-200 shadow-md hover:shadow-lg group mb-6"
            >
              <Plus size={16} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
              Nova Publicação
            </button>

            {/* Canais Section */}
            <div className="mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted mb-3 px-1">
                Canais
              </h3>
              <nav className="space-y-0.5">
                {/* Feed Geral (all channels) */}
                <button
                  onClick={() => setActiveChannel(null)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group",
                    activeChannel === null
                      ? "bg-brand-900/8 text-brand-900"
                      : "text-text-secondary hover:bg-surface-alt hover:text-text-primary"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    activeChannel === null ? "bg-brand-900/15" : "bg-muted/15 group-hover:bg-muted/25"
                  )}>
                    <Hash size={14} strokeWidth={activeChannel === null ? 2.2 : 1.8} />
                  </div>
                  <span className={cn(
                    "text-[13px] flex-1 truncate",
                    activeChannel === null ? "font-semibold" : "font-medium"
                  )}>
                    Feed Geral
                  </span>
                  <ChevronRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Dynamic Channels */}
                {mainChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group",
                      activeChannel === channel.id
                        ? "bg-brand-900/8 text-brand-900"
                        : "text-text-secondary hover:bg-surface-alt hover:text-text-primary"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      activeChannel === channel.id ? "bg-brand-900/15" : "bg-muted/15 group-hover:bg-muted/25"
                    )}>
                      <MessageSquare size={14} strokeWidth={activeChannel === channel.id ? 2.2 : 1.8} />
                    </div>
                    <span className={cn(
                      "text-[13px] flex-1 truncate",
                      activeChannel === channel.id ? "font-semibold" : "font-medium"
                    )}>
                      {channel.name}
                    </span>
                    {channel.postCount > 0 && (
                      <span className={cn(
                        "min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                        activeChannel === channel.id
                          ? "bg-brand-900 text-white"
                          : "bg-brand-900/10 text-brand-900"
                      )}>
                        {channel.postCount > 99 ? "99+" : channel.postCount}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Categorias Section (placeholder) */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted mb-3 px-1">
                Categorias
              </h3>
              <nav className="space-y-0.5">
                {["Colaborações", "Mostre seu Trabalho", "Promoções"].map((cat) => (
                  <button
                    key={cat}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-all duration-200 group"
                  >
                    <span className="text-[13px] font-medium flex-1">{cat}</span>
                    <ChevronRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* ── Main Feed ── */}
        <main className="flex-1 min-w-0 max-w-[720px]">
          {/* Channel Header */}
          <div className="sticky top-[64px] z-30 bg-bg/80 backdrop-blur-md border-b border-muted/15 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-900/10 flex items-center justify-center">
                  <Hash size={18} className="text-brand-900" />
                </div>
                <div>
                  <h1 className="text-[18px] font-bold text-text-primary leading-tight">
                    {activeChannelName}
                  </h1>
                  <p className="text-[12px] text-text-secondary mt-0.5">
                    {activeChannelPostCount} publicações
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* New Post Modal */}
          <AnimatePresence>
            {showNewPost && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mx-6 mt-4 bg-surface rounded-2xl shadow-lg border border-muted/15 overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-muted/15">
                  <h3 className="text-[15px] font-semibold text-text-primary">Nova Publicação</h3>
                  <button
                    onClick={() => setShowNewPost(false)}
                    className="p-1 rounded-full hover:bg-surface-alt transition-colors text-muted hover:text-text-primary"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  <select
                    value={newPost.channelId}
                    onChange={(e) => setNewPost((p) => ({ ...p, channelId: e.target.value }))}
                    className="w-full text-[13px] px-3 py-2.5 rounded-xl border border-muted/30 bg-surface-alt focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900/30 transition-all"
                  >
                    {channels.map((ch) => (
                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Título do post"
                    value={newPost.title}
                    onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
                    className="w-full text-[14px] font-semibold px-3 py-2.5 rounded-xl border border-muted/30 bg-surface-alt placeholder:text-muted placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900/30 transition-all"
                  />
                  <textarea
                    placeholder="O que você quer compartilhar com a comunidade?"
                    value={newPost.body}
                    onChange={(e) => setNewPost((p) => ({ ...p, body: e.target.value }))}
                    rows={4}
                    className="w-full text-[14px] px-3 py-2.5 rounded-xl border border-muted/30 bg-surface-alt placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900/30 transition-all resize-none leading-relaxed"
                  />
                  <ImageUpload
                    folder="posts"
                    variant="inline"
                    currentImageUrl={newPost.imageUrl || null}
                    onUpload={(url) => setNewPost((p) => ({ ...p, imageUrl: url }))}
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleCreatePost}
                      disabled={creating || !newPost.title.trim() || !newPost.body.trim()}
                      className="px-6 py-2.5 rounded-xl bg-brand-900 text-white text-[13px] font-semibold hover:bg-brand-800 transition-colors disabled:opacity-40 shadow-sm"
                    >
                      {creating ? "Publicando..." : "Publicar"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Posts Feed */}
          <div className="px-6 py-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-surface rounded-2xl animate-pulse"
                    style={{ height: `${160 + i * 40}px` }}
                  />
                ))}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeChannel ?? "all"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  {posts.length > 0 ? (
                    <AnimatedList className="space-y-4">
                      {posts.map((post, i) => (
                        <AnimatedItem key={post.id}>
                          <PostCard post={post} delay={i * 0.04} />
                        </AnimatedItem>
                      ))}
                    </AnimatedList>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-20 text-center"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-brand-900/8 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={28} className="text-brand-900/40" />
                      </div>
                      <p className="text-[15px] font-medium text-text-secondary mb-1">
                        Nenhuma publicação neste canal ainda.
                      </p>
                      <p className="text-[13px] text-muted mb-5">
                        Seja a primeira a compartilhar algo com a comunidade!
                      </p>
                      <button
                        onClick={() => setShowNewPost(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-900 text-white text-[13px] font-semibold hover:bg-brand-800 transition-colors shadow-sm"
                      >
                        <Plus size={16} />
                        Criar primeiro post
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </main>

        {/* ── Right Spacer (balances layout) ── */}
        <div className="w-[60px] shrink-0 hidden xl:block" />
      </div>
    </div>
  );
}
