"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db";
import { activities, commentMentions, comments } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth";
import { createCommentSchema } from "@/lib/validation";
import { hasCapability, loadTaskAccess } from "@/server/access";

function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

export async function addComment(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await getSessionUser();
  if (!user) return actionError("You need to sign in to comment.");

  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Write a comment first.", fieldErrorsFrom(parsed.error));
  }

  const access = await loadTaskAccess(parsed.data.taskId, user.id);
  if (!access) return actionError("Task not found.");
  if (!hasCapability(access, "task:update", user.id)) {
    return actionError("You have read-only access to this task.");
  }

  const db = getDb();
  const [comment] = await db
    .insert(comments)
    .values({
      taskId: access.task.id,
      authorId: user.id,
      body: parsed.data.body,
    })
    .returning();

  if (!comment) return actionError("Could not post the comment.");

  // Future-proof mention storage; the autocomplete UI lands in Phase 7.
  const mentionedUserIds = Array.from(
    parsed.data.body.matchAll(/@\[([^\]]+)\]\(([^)]+)\)/g),
  ).map((match) => match[2]);

  if (mentionedUserIds.length > 0) {
    await db
      .insert(commentMentions)
      .values(
        mentionedUserIds.map((userId) => ({
          commentId: comment.id,
          userId,
        })),
      )
      .onConflictDoNothing();
  }

  await db.insert(activities).values({
    projectId: access.task.projectId,
    taskId: access.task.id,
    actorId: user.id,
    type: "comment.created",
    data: { commentId: comment.id },
  });

  revalidatePath(`/tasks/${access.task.id}`);
  if (access.task.projectId) {
    revalidatePath(`/projects/${access.task.projectId}`);
  }
  return actionOk({ id: comment.id });
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return actionError("You need to sign in.");

  const db = getDb();
  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (!comment) return actionError("Comment not found.");

  const access = await loadTaskAccess(comment.taskId, user.id);
  if (!access) return actionError("Comment not found.");

  const isAuthor = comment.authorId === user.id;
  const isAdmin =
    access.role === "owner" || access.role === "admin";

  if (!isAuthor && !isAdmin) {
    return actionError("You cannot delete this comment.");
  }

  await db
    .delete(comments)
    .where(eq(comments.id, commentId));

  revalidatePath(`/tasks/${comment.taskId}`);
  return actionOk(undefined);
}
