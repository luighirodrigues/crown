import { z } from "zod/v4";
import { commentRepository } from "@/repositories/comment.repository";
import { postRepository } from "@/repositories/post.repository";
import { pointsService } from "@/services/points.service";
import { presenceService } from "@/services/presence.service";
import { notificationTriggerService } from "@/services/notification-trigger.service";

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comentário não pode ser vazio"),
  parentId: z.string().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const commentService = {
  async listByPost(postId: string) {
    return commentRepository.findByPost(postId);
  },

  async create(postId: string, input: CreateCommentInput, authorId: string) {
    const comment = await commentRepository.create({
      postId,
      authorId,
      body: input.body,
      parentId: input.parentId,
    });

    // Side-effects: award points + record presence
    await Promise.all([
      pointsService.awardPoints(authorId, "COMMENT", "comment", comment.id),
      presenceService.recordGeneral(authorId, "comment", comment.id),
    ]);

    // Notifications — fetch post to get author info
    const post = await postRepository.findById(postId);
    if (post && post.authorId !== authorId) {
      const commenterName = comment.author?.name ?? "Alguém";
      await notificationTriggerService.onPostCommented(
        post.authorId,
        commenterName,
        post.title
      );
    }

    // If this is a reply, notify the parent comment author
    if (input.parentId) {
      const parentComment = await commentRepository.findById(input.parentId);
      if (parentComment && parentComment.authorId !== authorId && post) {
        const replierName = comment.author?.name ?? "Alguém";
        await notificationTriggerService.onCommentReplied(
          parentComment.authorId,
          replierName,
          post.title
        );
      }
    }

    return comment;
  },
};
