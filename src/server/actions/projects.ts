"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db";
import { activities, projectMembers, projects, tags } from "@/db/schema";
import { getProjectAccess } from "@/db/queries/projects";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { createProjectSchema, createTagSchema } from "@/lib/validation";

function revalidateProjects(projectId?: string): void {
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/board`);
  }
}

function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

export async function createProject(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await getSessionUser();
  if (!user) return actionError("You need to sign in.");

  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Check the project details.", fieldErrorsFrom(parsed.error));
  }

  const db = getDb();

  const [project] = await db
    .insert(projects)
    .values({
      ownerId: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      color: parsed.data.color,
      icon: parsed.data.icon,
    })
    .returning();

  if (!project) return actionError("Could not create the project.");

  await db
    .insert(projectMembers)
    .values({
      projectId: project.id,
      userId: user.id,
      role: "owner",
    })
    .onConflictDoNothing();

  await db.insert(activities).values({
    projectId: project.id,
    actorId: user.id,
    type: "project.created",
    data: { name: project.name },
  });

  revalidateProjects(project.id);
  return actionOk({ id: project.id });
}

export async function updateProject(
  projectId: string,
  input: unknown,
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return actionError("You need to sign in.");

  const access = await getProjectAccess(projectId, user.id);
  if (!access) return actionError("Project not found.");
  if (!can(access.role, "project:update")) {
    return actionError("Only project admins can edit this project.");
  }

  const parsed = createProjectSchema.partial().safeParse(input);
  if (!parsed.success) {
    return actionError("Check the project details.", fieldErrorsFrom(parsed.error));
  }

  const db = getDb();
  await db
    .update(projects)
    .set({
      name: parsed.data.name,
      description: parsed.data.description,
      color: parsed.data.color,
      icon: parsed.data.icon,
    })
    .where(eq(projects.id, projectId));

  revalidateProjects(projectId);
  return actionOk(undefined);
}

export async function archiveProject(
  projectId: string,
  archived = true,
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return actionError("You need to sign in.");

  const access = await getProjectAccess(projectId, user.id);
  if (!access) return actionError("Project not found.");
  if (!can(access.role, "project:archive")) {
    return actionError("Only project admins can archive this project.");
  }

  const db = getDb();
  await db
    .update(projects)
    .set({ isArchived: archived })
    .where(eq(projects.id, projectId));

  revalidateProjects(projectId);
  return actionOk(undefined);
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return actionError("You need to sign in.");

  const access = await getProjectAccess(projectId, user.id);
  if (!access) return actionError("Project not found.");
  if (access.role !== "owner") {
    return actionError("Only the owner can delete a project.");
  }

  const db = getDb();
  await db.delete(projects).where(eq(projects.id, projectId));

  revalidateProjects(projectId);
  return actionOk(undefined);
}

export async function createTag(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await getSessionUser();
  if (!user) return actionError("You need to sign in.");

  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Check the tag details.", fieldErrorsFrom(parsed.error));
  }

  const db = getDb();
  const name = parsed.data.name.replace(/^#/, "").toLowerCase();

  const [tag] = await db
    .insert(tags)
    .values({ ownerId: user.id, name, color: parsed.data.color })
    .onConflictDoNothing()
    .returning();

  if (tag) {
    revalidatePath("/settings");
    return actionOk({ id: tag.id });
  }

  const [existing] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.ownerId, user.id), eq(tags.name, name)))
    .limit(1);

  if (!existing) return actionError("Could not create the tag.");
  return actionOk({ id: existing.id });
}
