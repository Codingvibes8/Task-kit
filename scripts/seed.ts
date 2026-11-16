/**
 * Deterministic development seed. Safe to run repeatedly: it exits early when
 * the demo project already exists.
 *
 *   npm run db:seed
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { and, eq } from "drizzle-orm";
import { addDays, addHours, format, startOfDay } from "date-fns";

import { getDb } from "../src/db/index";
import {
  activities,
  comments,
  myDayItems,
  projectMembers,
  projects,
  sections,
  taskTags,
  tasks,
  tags,
  users,
} from "../src/db/schema";
import { DEV_USER } from "../src/lib/env";
import type { TaskPriority, TaskStatus } from "../src/lib/constants";

type Fixture = {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueOffset?: number;
  dueHour?: number;
  sectionIndex: number;
  tags: string[];
  estimateMinutes?: number;
};

type ProjectFixture = {
  name: string;
  description: string;
  color: string;
  sections: string[];
  tasks: Fixture[];
};

const fixtures: ProjectFixture[] = [
  {
    name: "Website Relaunch",
    description:
      "Ship the new marketing site, pricing page, and launch narrative before the end of the quarter.",
    color: "#d6ff4b",
    sections: ["Now", "Next", "Later"],
    tasks: [
      {
        title: "Finalize pricing narrative",
        description:
          "Align the value metric with the new tiers. Needs sign-off from Sam before the launch post goes out.",
        status: "in_progress",
        priority: "high",
        dueOffset: 0,
        dueHour: 17,
        sectionIndex: 0,
        tags: ["writing", "launch"],
        estimateMinutes: 90,
      },
      {
        title: "Ship recurring task engine",
        description:
          "RRULE storage, next-occurrence calculation, and a completion-anchored mode.",
        status: "in_progress",
        priority: "urgent",
        dueOffset: 2,
        dueHour: 16,
        sectionIndex: 0,
        tags: ["engineering", "launch"],
        estimateMinutes: 240,
      },
      {
        title: "Write launch checklist",
        status: "todo",
        priority: "high",
        dueOffset: 1,
        dueHour: 12,
        sectionIndex: 0,
        tags: ["launch"],
        estimateMinutes: 45,
      },
      {
        title: "Review onboarding flow",
        description:
          "Walk the first-run experience on a fresh account and note every unnecessary click.",
        status: "todo",
        priority: "medium",
        dueOffset: 1,
        dueHour: 15,
        sectionIndex: 1,
        tags: ["design"],
        estimateMinutes: 45,
      },
      {
        title: "Fix drag-and-drop on Safari",
        status: "todo",
        priority: "urgent",
        dueOffset: -1,
        dueHour: 11,
        sectionIndex: 0,
        tags: ["engineering"],
        estimateMinutes: 60,
      },
      {
        title: "Design empty states",
        description: "Board, list, My Day, and inbox zero.",
        status: "todo",
        priority: "low",
        dueOffset: 6,
        sectionIndex: 1,
        tags: ["design"],
      },
      {
        title: "Interview three early users",
        status: "in_progress",
        priority: "high",
        dueOffset: 3,
        sectionIndex: 1,
        tags: ["research"],
        estimateMinutes: 120,
      },
      {
        title: "Publish changelog for v0.2",
        status: "todo",
        priority: "medium",
        dueOffset: 4,
        sectionIndex: 2,
        tags: ["writing"],
      },
      {
        title: "Prepare investor update",
        status: "todo",
        priority: "medium",
        dueOffset: 8,
        sectionIndex: 2,
        tags: ["writing"],
      },
      {
        title: "Clean up dead feature flags",
        status: "done",
        priority: "low",
        dueOffset: -3,
        sectionIndex: 2,
        tags: ["engineering"],
      },
      {
        title: "Migrate analytics events",
        status: "done",
        priority: "medium",
        dueOffset: -5,
        sectionIndex: 2,
        tags: ["engineering"],
      },
      {
        title: "Plan Q1 roadmap",
        status: "todo",
        priority: "none",
        dueOffset: 14,
        sectionIndex: 2,
        tags: ["planning"],
      },
    ],
  },
  {
    name: "Life Admin",
    description:
      "The small things that keep the week running. Keep it light and capped.",
    color: "#a18bff",
    sections: ["This week", "Someday"],
    tasks: [
      {
        title: "Book dentist appointment",
        status: "todo",
        priority: "medium",
        dueOffset: 2,
        dueHour: 10,
        sectionIndex: 0,
        tags: ["personal"],
      },
      {
        title: "Plan weekend hike",
        status: "todo",
        priority: "low",
        dueOffset: 4,
        sectionIndex: 0,
        tags: ["personal", "outside"],
      },
      {
        title: "Renew passport",
        status: "todo",
        priority: "high",
        dueOffset: 21,
        sectionIndex: 1,
        tags: ["personal", "admin"],
      },
      {
        title: "Back up photo library",
        status: "done",
        priority: "none",
        dueOffset: -2,
        sectionIndex: 1,
        tags: ["admin"],
      },
    ],
  },
];

async function main() {
  const db = getDb();

  const [user] = await db
    .insert(users)
    .values({ ...DEV_USER })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: DEV_USER.email,
        firstName: DEV_USER.firstName,
        lastName: DEV_USER.lastName,
      },
    })
    .returning();

  if (!user) throw new Error("Could not provision the preview user");

  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.ownerId, user.id),
        eq(projects.name, "Website Relaunch"),
      ),
    )
    .limit(1);

  if (existing) {
    console.log("✓ Seed already applied — nothing to do.");
    return;
  }

  const now = new Date();
  const today = startOfDay(now);
  const todayKey = format(now, "yyyy-MM-dd");

  const tagRows = new Map<string, string>();
  for (const name of [
    "writing",
    "launch",
    "engineering",
    "design",
    "research",
    "planning",
    "personal",
    "outside",
    "admin",
  ]) {
    const [inserted] = await db
      .insert(tags)
      .values({
        ownerId: user.id,
        name,
        color:
          name === "engineering"
            ? "#66c7ff"
            : name === "design"
              ? "#ffb45c"
              : name === "personal"
                ? "#a18bff"
                : "#8aa39b",
      })
      .onConflictDoNothing()
      .returning({ id: tags.id });

    if (inserted) {
      tagRows.set(name, inserted.id);
    } else {
      const [row] = await db
        .select({ id: tags.id })
        .from(tags)
        .where(and(eq(tags.ownerId, user.id), eq(tags.name, name)))
        .limit(1);
      if (row) tagRows.set(name, row.id);
    }
  }

  const seededTitles = new Map<string, string>();

  for (const projectFixture of fixtures) {
    const [project] = await db
      .insert(projects)
      .values({
        ownerId: user.id,
        name: projectFixture.name,
        description: projectFixture.description,
        color: projectFixture.color,
        icon: "layers",
      })
      .returning();

    if (!project) throw new Error(`Could not create ${projectFixture.name}`);

    await db.insert(projectMembers).values({
      projectId: project.id,
      userId: user.id,
      role: "owner",
    });

    const sectionIds: string[] = [];
    for (const [index, name] of projectFixture.sections.entries()) {
      const [section] = await db
        .insert(sections)
        .values({ projectId: project.id, name, position: index })
        .returning({ id: sections.id });
      if (section) sectionIds.push(section.id);
    }

    const counters: Record<TaskStatus, number> = {
      todo: 0,
      in_progress: 0,
      done: 0,
    };

    for (const task of projectFixture.tasks) {
      const position = counters[task.status]++;
      const dueDate =
        task.dueOffset === undefined
          ? null
          : addHours(addDays(today, task.dueOffset), task.dueHour ?? 17);

      const [row] = await db
        .insert(tasks)
        .values({
          projectId: project.id,
          sectionId: sectionIds[task.sectionIndex] ?? null,
          creatorId: user.id,
          assigneeId: user.id,
          title: task.title,
          description: task.description ?? null,
          status: task.status,
          priority: task.priority,
          position,
          dueDate,
          estimateMinutes: task.estimateMinutes ?? null,
          completedAt:
            task.status === "done" ? addDays(now, -2) : null,
        })
        .returning({ id: tasks.id });

      if (!row) throw new Error(`Could not create task ${task.title}`);
      seededTitles.set(task.title, row.id);

      for (const tagName of task.tags) {
        const tagId = tagRows.get(tagName);
        if (tagId) {
          await db
            .insert(taskTags)
            .values({ taskId: row.id, tagId })
            .onConflictDoNothing();
        }
      }
    }

    await db.insert(activities).values({
      projectId: project.id,
      actorId: user.id,
      type: "project.created",
      data: { name: project.name },
    });
  }

  const myDayTitles = [
    "Finalize pricing narrative",
    "Review onboarding flow",
    "Write launch checklist",
  ];

  let myDayPosition = 0;
  for (const title of myDayTitles) {
    const taskId = seededTitles.get(title);
    if (!taskId) continue;
    await db
      .insert(myDayItems)
      .values({
        userId: user.id,
        taskId,
        day: todayKey,
        position: myDayPosition++,
      })
      .onConflictDoNothing();
  }

  const firstTask = seededTitles.get("Finalize pricing narrative");
  if (firstTask) {
    await db.insert(comments).values({
      taskId: firstTask,
      authorId: user.id,
      body: "Pulled the competitive tiers into the doc. The middle tier needs a clearer value metric before we publish.",
    });

    await db.insert(activities).values({
      taskId: firstTask,
      projectId: null,
      actorId: user.id,
      type: "task.created",
      data: { title: "Finalize pricing narrative" },
    });
  }

  console.log("✓ Seed complete");
  console.log(`  user:     ${DEV_USER.email}`);
  console.log(`  projects: ${fixtures.length}`);
  console.log(
    `  tasks:    ${fixtures.reduce((sum, p) => sum + p.tasks.length, 0)}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
