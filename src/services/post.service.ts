import { z } from "zod/v4";
import { postRepository } from "@/repositories/post.repository";
import { pointsService } from "@/services/points.service";
import { presenceService } from "@/services/presence.service";

export const createPostSchema = z.object({
  channelId: z.string().min(1),
  title: z.string().min(1, "Título é obrigatório").max(200),
  body: z.string().min(1, "Conteúdo é obrigatório"),
  imageUrl: z.string().url().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const postService = {
  async listByChannel(channelId: string | null, opts?: { take?: number; skip?: number }) {
    return postRepository.findByChannel(channelId, opts);
  },

  async listByChannelForUser(channelId: string | null, userId: string, opts?: { take?: number; skip?: number }) {
    const posts = await postRepository.findByChannel(channelId, opts);
    const postIds = posts.map((p) => p.id);
    const likedSet = await postRepository.getLikedPostIds(postIds, userId);
    return posts.map((p) => ({ ...p, liked: likedSet.has(p.id) }));
  },

  async listRecent(limit?: number) {
    return postRepository.findRecent(limit);
  },

  async listTopByLikes(days?: number, limit?: number) {
    return postRepository.findTopByLikes(days, limit);
  },

  async create(input: CreatePostInput, authorId: string) {
    const post = await postRepository.create({
      ...input,
      authorId,
    });

    // Side-effects: award points + record presence
    await Promise.all([
      pointsService.awardPoints(authorId, "CREATE_POST", "post", post.id),
      presenceService.recordGeneral(authorId, "post", post.id),
    ]);

    return post;
  },

  async findById(id: string) {
    return postRepository.findById(id);
  },
};
