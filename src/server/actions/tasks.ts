"use server";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db";
import {
  activities,
  myDayItems,
  projects,
  sections,
  tags,
  taskTags,
  tasks,
  type Project,
} from "@/db/schema";
import {
  actionError,
  actionOk,
  type ActionResult,
} from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth";
import { parseCapture } from "@/lib/nlp";
import { canManageTask } from "@/lib/rbac";
import {
  createTaskSchema,
  moveTaskSchema,
  myDaySchema,
  quickAddSchema,
  updateTaskSchema,
} from "@/lib/validation";
import { getProjectAccess } from "@/db/queries/projects";
import type { TaskStatus } from "@/lib/constants";
import { loadTaskAccess } from "@/server/access";

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

function revalidateWorkspace(projectId?: string | null): void {
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/my-day");
  revalidatePath("/inbox");
  revalidatePath("/projects");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

async function nextPosition(
  projectId: string | null,
  status: TaskStatus,
): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({
      max: sql<number>`coalesce(max(${tasks.position}), -1)`.mapWith(Number),
    })
    .from(tasks)
    .where(
      and(
        projectId ? eq(tasks.projectId, projectId) : isNull(tasks.projectId),
        eq(tasks.status, status),
        isNull(tasks.parentTaskId),
      ),
    );

  return (row?.max ?? -1) + 1;
}

async function logActivity(input: {
  projectId: string | null;
  taskId: string | null;
  actorId: string;
  type: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  const db = getDb();
  await db.insert(activities).values({
    projectId: input.projectId,
    taskId: input.taskId,
    actorId: input.actorId,
    type: input.type,
    data: input.data ?? {},
  });
}

/**
 * Tags are workspace-scoped. Accept only ids the caller owns so a crafted
 * request cannot attach someone else's tag to a task.
 */
async function filterOwnedTagIds(
  userId: string,
  tagIds: string[],
): Promise<string[]> {
  if (tagIds.length === 0) return [];
  const db = getDb();
  const rows = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.ownerId, userId), inArray(tags.id, tagIds)));
  return rows.map((row) => row.id);
}

function toDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/* -------------------------------------------------------------------------- */
/*                                Task actions                                */
/* -------------------------------------------------------------------------- */

export async function createTask(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await getSessionUser();
  if (!user) return actionError("You need to sign in to create a task.");

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Check the task details.", fieldErrorsFrom(parsed.error));
  }

  const data = parsed.data;
  const db = getDb();

  if (data.projectId) {
    const access = await getProjectAccess(data.projectId, user.id);
    if (!access) return actionError("You do not have access to this project.");

    if (data.sectionId) {
      const [section] = await db
        .select({ id: sections.id })
        .from(sections)
        .where(
          and(
            eq(sections.id, data.sectionId),
            eq(sections.projectId, data.projectId),
          ),
        )
        .limit(1);
      if (!section) return actionError("That section does not belong to the project.");
    }
  }

  const position = await nextPosition(data.projectId ?? null, data.status);

  const [task] = await db
    .insert(tasks)
    .values({
      projectId: data.projectId ?? null,
      sectionId: data.sectionId ?? null,
      creatorId: user.id,
      assigneeId: data.assigneeId ?? null,
      parentTaskId: data.parentTaskId ?? null,
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      priority: data.priority,
      position,
      startDate: toDate(data.startDate) ?? null,
      dueDate: toDate(data.dueDate) ?? null,
      allDay: data.allDay,
      estimateMinutes: data.estimateMinutes ?? null,
      recurrenceRule: data.recurrenceRule ?? null,
      recurrenceMode: data.recurrenceMode,
      completedAt: data.status === "done" ? new Date() : null,
    })
    .returning();

  if (!task) return actionError("Could not create the task. Try again.");

  const tagIds = await filterOwnedTagIds(user.id, data.tagIds ?? []);
  if (tagIds.length > 0) {
    await db
      .insert(taskTags)
      .values(tagIds.map((tagId) => ({ taskId: task.id, tagId })))
      .onConflictDoNothing();
  }

  await logActivity({
    projectId: task.projectId,
    taskId: task.id,
    actorId: user.id,
    type: "task.created",
    data: { title: task.title },
  });

  revalidateWorkspace(task.projectId);
  return actionOk({ id: task.id });
}

export async function updateTask(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await getSessionUser();
  if (!user) return actionError("You need to sign in to edit a task.");

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Check the task details.", fieldErrorsFrom(parsed.error));
  }

  const access = await loadTaskAccess(parsed.data.id, user.id);
  if (!access) return actionError("Task not found.");
  if (!canManageTask(access.role, access.task.creatorId === user.id)) {
    return actionError("You do not have permission to edit this task.");
  }

  const data = parsed.data;
  const updates: Partial<typeof tasks.$inferInsert> = {};

  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.sectionId !== undefined) updates.sectionId = data.sectionId;
  if (data.assigneeId !== undefined) updates.assigneeId = data.assigneeId;
  if (data.startDate !== undefined) updates.startDate = toDate(data.startDate);
  if (data.dueDate !== undefined) updates.dueDate = toDate(data.dueDate);
  if (data.allDay !== undefined) updates.allDay = data.allDay;
  if (data.estimateMinutes !== undefined)
    updates.estimateMinutes = data.estimateMinutes;
  if (data.recurrenceRule !== undefined)
    updates.recurrenceRule = data.recurrenceRule;
  if (data.recurrenceMode !== undefined)
    updates.recurrenceMode = data.recurrenceMode;

  if (data.status !== undefined && data.status !== access.task.status) {
    updates.status = data.status;
    updates.completedAt = data.status === "done" ? new Date() : null;
    if (data.status !== "done" || access.task.status !== "done") {
      updates.position = await nextPosition(
        access.task.projectId,
        data.status,
      );
    }
  }

  if (Object.keys(updates).length === 0 && data.tagIds === undefined) {
    return actionOk({ id: access.task.id });
  }

  const db = getDb();
  if (Object.keys(updates).length > 0) {
    await db.update(tasks).set(updates).where(eq(tasks.id, access.task.id));
  }

  if (data.tagIds !== undefined) {
    const tagIds = await filterOwnedTagIds(user.id, data.tagIds);
    await db.delete(taskTags).where(eq(taskTags.taskId, access.task.id));
    if (tagIds.length > 0) {
      await db
        .insert(taskTags)
        .values(tagIds.map((tagId) => ({ taskId: access.task.id, tagId })))
        .onConflictDoNothing();
    }
  }

  await logActivity({
    projectId: access.task.projectId,
    taskId: access.task.id,
    actorId: user.id,
    type: data.status === "done" ? "task.completed" : "task.updated",
    data: { title: updates.title ?? access.task.title },
  });

  revalidateWorkspace(access.task.projectId);
  revalidatePath(`/tasks/${access.task.id}`);
  return actionOk({ id: access.task.id });
}

export async function moveTask(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await getSessionUser();
  if (!user) return actionError("You need to sign in to move a task.");

  const parsed = moveTaskSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Invalid move request.", fieldErrorsFrom(parsed.error));
  }

  const access = await loadTaskAccess(parsed.data.id, user.id);
  if (!access) return actionError("Task not found.");
  if (!canManageTask(access.role, access.task.creatorId === user.id)) {
    return actionError("You do not have permission to move this task.");
  }

  const position =
    parsed.data.position ??
    (await nextPosition(access.task.projectId, parsed.data.status));

  const db = getDb();
  await db
    .update(tasks)
    .set({
      status: parsed.data.status,
      position,
      completedAt: parsed.data.status === "done" ? new Date() : null,
    })
    .where(eq(tasks.id, access.task.id));

  if (access.task.status !== parsed.data.status) {
    await logActivity({
      projectId: access.task.projectId,
      taskId: access.task.id,
      actorId: user.id,
      type: parsed.data.status === "done" ? "task.completed" : "task.moved",
      data: { from: access.task.status, to: parsed.data.status },
    });
  }

  revalidateWorkspace(access.task.projectId);
  return actionOk({ id: access.task.id });
}

export async function toggleTaskComplete(
  taskId: string,
): Promise<ActionResult<{ status: TaskStatus }>> {
  const user = await getSessionUser();
  if (!user) return actionError("You need to sign in.");

  const access = await loadTaskAccess(taskId, user.id);
  if (!access) return actionError("Task not found.");
  if (!canManageTask(access.role, access.task.creatorId === user.id)) {
    return actionError("You do not have permission to update this task.");
  }

  const nextStatus: TaskStatus =
    access.task.status === "done" ? "todo" : "done";
  const db = getDb();

  await db
    .update(tasks)
    .set({
      status: nextStatus,
      completedAt: nextStatus === "done" ? new Date() : null,
      position: await nextPosition(access.task.projectId, nextStatus),
    })
    .where(eq(tasks.id, access.task.id));

  await logActivity({
    projectId: access.task.projectId,
    taskId: access.task.id,
    actorId: user.id,
    type: nextStatus === "done" ? "task.completed" : "task.reopened",
    data: { title: access.task.title },
  });

  revalidateWorkspace(access.task.projectId);
  revalidatePath(`/tasks/${access.task.id}`);
  return actionOk({ status: nextStatus });
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return actionError("You need to sign in.");

  const access = await loadTaskAccess(taskId, user.id);
  if (!access) return actionError("Task not found.");
  if (!canManageTask(access.role, access.task.creatorId === user.id)) {
    return actionError("You do not have permission to delete this task.");
  }

  const db = getDb();
  await db.delete(tasks).where(eq(tasks.id, access.task.id));

  revalidateWorkspace(access.task.projectId);
  return actionOk(undefined);
}

/**
 * Frictionless capture. Parses dates/tags/priority locally then writes to the
 * Inbox (or a project when `/project` was typed).
 */
export async function quickAddTask(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await getSessionUser();
  if (!user) return actionError("You need to sign in to capture a task.");

  const parsed = quickAddSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Type something to capture.");
  }

  const capture = parseCapture(parsed.data.text);
  const db = getDb();

  let project: Pick<Project, "id"> | null = null;
  if (capture.projectName) {
    const [match] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.ownerId, user.id),
          eq(projects.isArchived, false),
          sql`lower(${projects.name}) = ${capture.projectName}`,
        ),
      )
      .limit(1);
    project = match ?? null;
  }

  const position = await nextPosition(project?.id ?? null, "todo");

  const [task] = await db
    .insert(tasks)
    .values({
      projectId: project?.id ?? null,
      creatorId: user.id,
      assigneeId: user.id,
      title: capture.title,
      status: "todo",
      priority: capture.priority,
      position,
      dueDate: capture.dueDate,
      allDay: capture.allDay,
      recurrenceRule: capture.recurrenceRule,
    })
    .returning();

  if (!task) return actionError("Could not capture the task. Try again.");

  if (capture.tagNames.length > 0) {
    const tagIds: string[] = [];
    for (const name of capture.tagNames) {
      const [existing] = await db
        .select({ id: tags.id })
        .from(tags)
        .where(and(eq(tags.ownerId, user.id), eq(tags.name, name)))
        .limit(1);

      if (existing) {
        tagIds.push(existing.id);
        continue;
      }

      const [created] = await db
        .insert(tags)
        .values({ ownerId: user.id, name })
        .onConflictDoNothing()
        .returning({ id: tags.id });

      if (created) {
        tagIds.push(created.id);
      } else {
        const [fallback] = await db
          .select({ id: tags.id })
          .from(tags)
          .where(and(eq(tags.ownerId, user.id), eq(tags.name, name)))
          .limit(1);
        if (fallback) tagIds.push(fallback.id);
      }
    }

    if (tagIds.length > 0) {
      await db
        .insert(taskTags)
        .values(tagIds.map((tagId) => ({ taskId: task.id, tagId })))
        .onConflictDoNothing();
    }
  }

  await logActivity({
    projectId: task.projectId,
    taskId: task.id,
    actorId: user.id,
    type: "task.captured",
    data: { title: task.title },
  });

  revalidateWorkspace(task.projectId);
  return actionOk({ id: task.id });
}

/* -------------------------------------------------------------------------- */
/*                                My Day actions                              */
/* -------------------------------------------------------------------------- */

export async function addToMyDay(input: unknown): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return actionError("You need to sign in.");

  const parsed = myDaySchema.safeParse(input);
  if (!parsed.success) return actionError("Invalid My Day request.");

  const access = await loadTaskAccess(parsed.data.taskId, user.id);
  if (!access) return actionError("Task not found.");

  const db = getDb();
  const [row] = await db
    .select({
      max: sql<number>`coalesce(max(${myDayItems.position}), -1)`.mapWith(
        Number,
      ),
    })
    .from(myDayItems)
    .where(
      and(
        eq(myDayItems.userId, user.id),
        eq(myDayItems.day, parsed.data.day),
      ),
    );

  await db
    .insert(myDayItems)
    .values({
      userId: user.id,
      taskId: parsed.data.taskId,
      day: parsed.data.day,
      position: (row?.max ?? -1) + 1,
    })
    .onConflictDoNothing();

  await logActivity({
    projectId: access.task.projectId,
    taskId: access.task.id,
    actorId: user.id,
    type: "myday.added",
    data: { day: parsed.data.day },
  });

  revalidatePath("/my-day");
  revalidatePath("/dashboard");
  return actionOk(undefined);
}

export async function removeFromMyDay(input: unknown): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return actionError("You need to sign in.");

  const parsed = myDaySchema.safeParse(input);
  if (!parsed.success) return actionError("Invalid My Day request.");

  const db = getDb();
  await db
    .delete(myDayItems)
    .where(
      and(
        eq(myDayItems.userId, user.id),
        eq(myDayItems.taskId, parsed.data.taskId),
        eq(myDayItems.day, parsed.data.day),
      ),
    );

  revalidatePath("/my-day");
  revalidatePath("/dashboard");
  return actionOk(undefined);
}
