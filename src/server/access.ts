import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { getProjectAccess, type ProjectAccess } from "@/db/queries/projects";
import { tasks, type Task } from "@/db/schema";
import type { Capability } from "@/lib/constants";
import { can } from "@/lib/rbac";

export type TaskAccess = { task: Task; role: ProjectAccess["role"] | null };

/**
 * Resolve a task only if the caller can see it. Inbox tasks belong to their
 * creator; project tasks require a membership row. Used by every task mutation
 * and by comment/attachment actions.
 */
export async function loadTaskAccess(
  taskId: string,
  userId: string,
): Promise<TaskAccess | null> {
  const db = getDb();
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task) return null;

  if (!task.projectId) {
    return task.creatorId === userId ? { task, role: null } : null;
  }

  const access = await getProjectAccess(task.projectId, userId);
  if (!access) return null;

  return { task, role: access.role };
}

export function hasCapability(
  access: TaskAccess,
  capability: Capability,
  userId: string,
): boolean {
  if (access.role === null) return access.task.creatorId === userId;
  return can(access.role, capability);
}
