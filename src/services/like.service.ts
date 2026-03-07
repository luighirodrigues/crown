import { likeRepository } from "@/repositories/like.repository";
import { postRepository } from "@/repositories/post.repository";
import { presenceService } from "@/services/presence.service";
import { notificationTriggerService } from "@/services/notification-trigger.service";

export const likeService = {
  async toggle(postId: string, userId: string) {
    const result = await likeRepository.toggle(postId, userId);
    const count = await likeRepository.countByPost(postId);

    // On like (not unlike): record presence (GENERAL only — NO tributo per spec)
    if (result.liked) {
      await presenceService.recordGeneral(userId, "like", result.likeId);

      // Notify post author (skip self)
      const post = await postRepository.findById(postId);
      if (post && post.authorId !== userId) {
        const user = await import("@/repositories/user.repository").then(
          (m) => m.userRepository.findById(userId)
        );
        const likerName = user?.name ?? "Alguém";
        await notificationTriggerService.onPostLiked(post.authorId, likerName, post.title);
      }
    }

    return { ...result, count };
  },
};
