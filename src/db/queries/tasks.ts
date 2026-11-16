import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";

import { getDb } from "../index";
import {
  activities,
  myDayItems,
  projects,
  sections,
  tasks,
  users,
  type Task,
  type User,
} from "../schema";
import type { TaskStatus } from "@/lib/constants";

export type TaskPerson = Pick<
  User,
  "id" | "firstName" | "lastName" | "email" | "imageUrl"
>;

export type TaskCardData = Task & {
  assignee: TaskPerson | null;
  tags: Array<{ id: string; name: string; color: string }>;
  subtaskTotal: number;
  subtaskDone: number;
};

const personColumns = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  imageUrl: true,
} as const;

export type BoardData = {
  sections: Array<{ id: string; name: string; position: number }>;
  tasks: TaskCardData[];
};

export async function getBoardData(projectId: string): Promise<BoardData> {
  const db = getDb();

  const [sectionRows, taskRows] = await Promise.all([
    db
      .select({
        id: sections.id,
        name: sections.name,
        position: sections.position,
      })
      .from(sections)
      .where(eq(sections.projectId, projectId))
      .orderBy(asc(sections.position), asc(sections.createdAt)),
    db.query.tasks.findMany({
      where: and(
        eq(tasks.projectId, projectId),
        isNull(tasks.parentTaskId),
        eq(tasks.isArchived, false),
      ),
      orderBy: [asc(tasks.position), asc(tasks.createdAt)],
      with: {
        assignee: { columns: personColumns },
        tags: { with: { tag: true } },
        subtasks: { columns: { id: true, status: true } },
      },
    }),
  ]);

  return {
    sections: sectionRows,
    tasks: taskRows.map(({ tags, subtasks, ...task }) => ({
      ...task,
      tags: tags.map(({ tag }) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      })),
      subtaskTotal: subtasks.length,
      subtaskDone: subtasks.filter((subtask) => subtask.status === "done").length,
    })),
  };
}

export type TaskDetailData = NonNullable<
  Awaited<ReturnType<typeof getTaskDetail>>
>;

export async function getTaskDetail(taskId: string) {
  const db = getDb();

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: {
      project: true,
      creator: { columns: personColumns },
      assignee: { columns: personColumns },
      tags: { with: { tag: true } },
      subtasks: {
        with: { assignee: { columns: personColumns } },
        orderBy: (subtasks, { asc: ascFn }) => [ascFn(subtasks.position)],
      },
      comments: {
        with: { author: { columns: personColumns } },
        orderBy: (comments, { asc: ascFn }) => [ascFn(comments.createdAt)],
      },
      attachments: true,
      reminders: true,
    },
  });

  return task ?? null;
}

export type MyTaskRow = TaskCardData & {
  project: { id: string; name: string; color: string } | null;
};

export async function listMyTasks(
  userId: string,
  status?: TaskStatus,
): Promise<MyTaskRow[]> {
  const db = getDb();

  const rows = await db.query.tasks.findMany({
    where: and(
      or(eq(tasks.assigneeId, userId), eq(tasks.creatorId, userId)),
      status ? eq(tasks.status, status) : undefined,
      eq(tasks.isArchived, false),
      isNull(tasks.parentTaskId),
    ),
    orderBy: [desc(tasks.createdAt)],
    limit: 200,
    with: {
      assignee: { columns: personColumns },
      project: { columns: { id: true, name: true, color: true } },
      tags: { with: { tag: true } },
      subtasks: { columns: { id: true, status: true } },
    },
  });

  return rows.map(({ tags, subtasks, ...task }) => ({
    ...task,
    tags: tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    })),
    subtaskTotal: subtasks.length,
    subtaskDone: subtasks.filter((subtask) => subtask.status === "done").length,
  }));
}

export async function getTasksDueBetween(
  userId: string,
  from: Date,
  to: Date,
): Promise<MyTaskRow[]> {
  const db = getDb();

  const rows = await db.query.tasks.findMany({
    where: and(
      or(eq(tasks.assigneeId, userId), eq(tasks.creatorId, userId)),
      isNull(tasks.parentTaskId),
      eq(tasks.isArchived, false),
      gte(tasks.dueDate, from),
      lte(tasks.dueDate, to),
    ),
    orderBy: [asc(tasks.dueDate)],
    with: {
      assignee: { columns: personColumns },
      project: { columns: { id: true, name: true, color: true } },
      tags: { with: { tag: true } },
      subtasks: { columns: { id: true, status: true } },
    },
  });

  return rows.map(({ tags, subtasks, ...task }) => ({
    ...task,
    tags: tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    })),
    subtaskTotal: subtasks.length,
    subtaskDone: subtasks.filter((subtask) => subtask.status === "done").length,
  }));
}


export async function getMyOpenTasks(
  userId: string,
  limit = 50,
): Promise<MyTaskRow[]> {
  const db = getDb();

  const rows = await db.query.tasks.findMany({
    where: and(
      or(eq(tasks.assigneeId, userId), eq(tasks.creatorId, userId)),
      ne(tasks.status, "done"),
      eq(tasks.isArchived, false),
      isNull(tasks.parentTaskId),
    ),
    orderBy: [
      sql`${tasks.dueDate} asc nulls last`,
      desc(tasks.priority),
      desc(tasks.createdAt),
    ],
    limit,
    with: {
      assignee: { columns: personColumns },
      project: { columns: { id: true, name: true, color: true } },
      tags: { with: { tag: true } },
      subtasks: { columns: { id: true, status: true } },
    },
  });

  return rows.map(({ tags, subtasks, ...task }) => ({
    ...task,
    tags: tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    })),
    subtaskTotal: subtasks.length,
    subtaskDone: subtasks.filter((subtask) => subtask.status === "done").length,
  }));
}

export type TaskStatusCounts = {
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
};

export async function getTaskStatusCounts(
  userId: string,
): Promise<TaskStatusCounts> {
  const db = getDb();

  const [statusRows, overdueRow] = await Promise.all([
    db
      .select({ status: tasks.status, count: sql<number>`count(*)`.mapWith(Number) })
      .from(tasks)
      .where(
        and(
          or(eq(tasks.assigneeId, userId), eq(tasks.creatorId, userId)),
          isNull(tasks.parentTaskId),
          eq(tasks.isArchived, false),
        ),
      )
      .groupBy(tasks.status),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(tasks)
      .where(
        and(
          or(eq(tasks.assigneeId, userId), eq(tasks.creatorId, userId)),
          ne(tasks.status, "done"),
          isNull(tasks.parentTaskId),
          eq(tasks.isArchived, false),
          lt(tasks.dueDate, new Date()),
        ),
      ),
  ]);

  const counts: TaskStatusCounts = {
    todo: 0,
    in_progress: 0,
    done: 0,
    overdue: overdueRow[0]?.count ?? 0,
  };

  for (const row of statusRows) {
    counts[row.status] = row.count;
  }

  return counts;
}

export async function getInboxTasks(userId: string): Promise<TaskCardData[]> {
  const db = getDb();

  const rows = await db.query.tasks.findMany({
    where: and(
      eq(tasks.creatorId, userId),
      isNull(tasks.projectId),
      isNull(tasks.parentTaskId),
      eq(tasks.isArchived, false),
    ),
    orderBy: [desc(tasks.createdAt)],
    with: {
      assignee: { columns: personColumns },
      tags: { with: { tag: true } },
      subtasks: { columns: { id: true, status: true } },
    },
  });

  return rows.map(({ tags, subtasks, ...task }) => ({
    ...task,
    tags: tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    })),
    subtaskTotal: subtasks.length,
    subtaskDone: subtasks.filter((subtask) => subtask.status === "done").length,
  }));
}

export type MyDayTask = TaskCardData & {
  project: { id: string; name: string; color: string } | null;
};

export async function getMyDayTasks(
  userId: string,
  day: string,
): Promise<MyDayTask[]> {  const db = getDb();

  const rows = await db.query.myDayItems.findMany({
    where: and(eq(myDayItems.userId, userId), eq(myDayItems.day, day)),
    orderBy: [asc(myDayItems.position)],
    with: {
      task: {
        with: {
          assignee: { columns: personColumns },
          project: { columns: { id: true, name: true, color: true } },
          tags: { with: { tag: true } },
          subtasks: { columns: { id: true, status: true } },
        },
      },
    },
  });

  return rows.map(({ task }) => ({
    ...task,
    tags: task.tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    })),
    subtaskTotal: task.subtasks.length,
    subtaskDone: task.subtasks.filter((subtask) => subtask.status === "done")
      .length,
  }));
}

export async function isTaskInMyDay(
  userId: string,
  taskId: string,
  day: string,
): Promise<boolean> {
  const db = getDb();

  const [row] = await db
    .select({ id: myDayItems.id })
    .from(myDayItems)
    .where(
      and(
        eq(myDayItems.userId, userId),
        eq(myDayItems.taskId, taskId),
        eq(myDayItems.day, day),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export type ActivityRow = {
  id: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: Date;
  taskId: string | null;
  taskTitle: string | null;
  projectName: string | null;
  actorName: string | null;
};

export async function getActivityFeed(
  projectIds: string[],
  limit = 8,
): Promise<ActivityRow[]> {
  if (projectIds.length === 0) return [];

  const db = getDb();

  return db
    .select({
      id: activities.id,
      type: activities.type,
      data: activities.data,
      createdAt: activities.createdAt,
      taskId: activities.taskId,
      taskTitle: tasks.title,
      projectName: projects.name,
      actorName: users.firstName,
    })
    .from(activities)
    .leftJoin(tasks, eq(tasks.id, activities.taskId))
    .leftJoin(projects, eq(projects.id, activities.projectId))
    .leftJoin(users, eq(users.id, activities.actorId))
    .where(
      projectIds.length > 0
        ? inArray(activities.projectId, projectIds)
        : sql`false`,
    )
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}
