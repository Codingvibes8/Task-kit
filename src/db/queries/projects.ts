import { and, asc, eq, getTableColumns, or, sql } from "drizzle-orm";

import type { ProjectRole } from "@/lib/constants";

import { getDb } from "../index";
import {
  projectMembers,
  projects,
  sections,
  tags,
  tasks,
  users,
  type Project,
  type Section,
  type Tag,
} from "../schema";

export type ProjectSummary = Project & {
  role: ProjectRole;
  taskCount: number;
  doneCount: number;
};

export type ProjectAccess = { project: Project; role: ProjectRole };

/**
 * Every project the user can see, with a role and progress roll-up. One query
 * (plus correlated counts) keeps the project index cheap.
 */
export async function listProjectsForUser(
  userId: string,
): Promise<ProjectSummary[]> {
  const db = getDb();

  const role = sql<ProjectRole>`case
    when ${projects.ownerId} = ${userId} then 'owner'
    else ${projectMembers.role}::text
  end`;

  const taskCount = sql<number>`(
    select count(*) from ${tasks}
    where ${tasks.projectId} = ${projects.id}
      and ${tasks.parentTaskId} is null
      and ${tasks.isArchived} = false
  )`.mapWith(Number);

  const doneCount = sql<number>`(
    select count(*) from ${tasks}
    where ${tasks.projectId} = ${projects.id}
      and ${tasks.parentTaskId} is null
      and ${tasks.isArchived} = false
      and ${tasks.status} = 'done'
  )`.mapWith(Number);

  return db
    .select({
      ...getTableColumns(projects),
      role,
      taskCount,
      doneCount,
    })
    .from(projects)
    .leftJoin(
      projectMembers,
      and(
        eq(projectMembers.projectId, projects.id),
        eq(projectMembers.userId, userId),
      ),
    )
    .where(
      and(
        eq(projects.isArchived, false),
        or(eq(projects.ownerId, userId), eq(projectMembers.userId, userId)),
      ),
    )
    .orderBy(asc(projects.position), asc(projects.createdAt));
}

export async function listProjectsSimple(
  userId: string,
): Promise<Array<Pick<Project, "id" | "name" | "color" | "icon">>> {
  const db = getDb();

  return db
    .select({
      id: projects.id,
      name: projects.name,
      color: projects.color,
      icon: projects.icon,
    })
    .from(projects)
    .leftJoin(
      projectMembers,
      and(
        eq(projectMembers.projectId, projects.id),
        eq(projectMembers.userId, userId),
      ),
    )
    .where(
      and(
        eq(projects.isArchived, false),
        or(eq(projects.ownerId, userId), eq(projectMembers.userId, userId)),
      ),
    )
    .orderBy(asc(projects.position), asc(projects.createdAt));
}

export async function getProjectAccess(
  projectId: string,
  userId: string,
): Promise<ProjectAccess | null> {
  const db = getDb();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) return null;

  if (project.ownerId === userId) {
    return { project, role: "owner" };
  }

  const [membership] = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
      ),
    )
    .limit(1);

  return membership ? { project, role: membership.role } : null;
}

export async function listAccessibleProjectIds(
  userId: string,
): Promise<string[]> {
  const db = getDb();

  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .leftJoin(
      projectMembers,
      and(
        eq(projectMembers.projectId, projects.id),
        eq(projectMembers.userId, userId),
      ),
    )
    .where(
      and(
        eq(projects.isArchived, false),
        or(eq(projects.ownerId, userId), eq(projectMembers.userId, userId)),
      ),
    );

  return rows.map((row) => row.id);
}

export type ProjectMemberView = {
  userId: string;
  role: ProjectRole;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

export async function listProjectMembers(
  projectId: string,
): Promise<ProjectMemberView[]> {
  const db = getDb();

  return db
    .select({
      userId: users.id,
      role: projectMembers.role,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      imageUrl: users.imageUrl,
    })
    .from(projectMembers)
    .innerJoin(users, eq(users.id, projectMembers.userId))
    .where(eq(projectMembers.projectId, projectId))
    .orderBy(asc(projectMembers.createdAt));
}

export async function listProjectSections(
  projectId: string,
): Promise<Section[]> {
  const db = getDb();

  return db
    .select()
    .from(sections)
    .where(eq(sections.projectId, projectId))
    .orderBy(asc(sections.position), asc(sections.createdAt));
}

export async function listTags(ownerId: string): Promise<Tag[]> {
  const db = getDb();

  return db
    .select()
    .from(tags)
    .where(eq(tags.ownerId, ownerId))
    .orderBy(asc(tags.name));
}
