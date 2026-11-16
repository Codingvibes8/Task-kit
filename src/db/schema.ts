import { relations } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import {
  NOTIFICATION_CHANNELS,
  PROJECT_ROLES,
  PROJECT_VISIBILITIES,
  RECURRENCE_MODES,
  REMINDER_KINDS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "../lib/constants";

/* -------------------------------------------------------------------------- */
/*                                   Enums                                    */
/* -------------------------------------------------------------------------- */

export const taskStatusEnum = pgEnum("task_status", TASK_STATUSES);
export const taskPriorityEnum = pgEnum("task_priority", TASK_PRIORITIES);
export const projectRoleEnum = pgEnum("project_role", PROJECT_ROLES);
export const projectVisibilityEnum = pgEnum(
  "project_visibility",
  PROJECT_VISIBILITIES,
);
export const recurrenceModeEnum = pgEnum("recurrence_mode", RECURRENCE_MODES);
export const reminderKindEnum = pgEnum("reminder_kind", REMINDER_KINDS);
export const notificationChannelEnum = pgEnum(
  "notification_channel",
  NOTIFICATION_CHANNELS,
);

/* -------------------------------------------------------------------------- */
/*                                   Users                                    */
/* -------------------------------------------------------------------------- */

/**
 * Mirrors Clerk identities. `id` is the Clerk user id (`user_…`), which makes
 * webhook sync and authorization lookups cheap. A local preview identity is
 * used only when `DEV_AUTH_BYPASS` is enabled outside production.
 */
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    firstName: varchar("first_name", { length: 120 }),
    lastName: varchar("last_name", { length: 120 }),
    imageUrl: text("image_url"),
    timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

/* -------------------------------------------------------------------------- */
/*                                 Projects                                   */
/* -------------------------------------------------------------------------- */

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 24 }).notNull().default("#c9f73f"),
    icon: varchar("icon", { length: 40 }).notNull().default("layers"),
    visibility: projectVisibilityEnum("visibility")
      .notNull()
      .default("private"),
    position: integer("position").notNull().default(0),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("projects_owner_idx").on(table.ownerId),
    index("projects_archived_idx").on(table.ownerId, table.isArchived),
  ],
);

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: projectRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("project_members_project_user_unique").on(
      table.projectId,
      table.userId,
    ),
    index("project_members_user_idx").on(table.userId),
  ],
);

export const projectInvites = pgTable(
  "project_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }).notNull(),
    role: projectRoleEnum("role").notNull().default("member"),
    token: text("token").notNull(),
    invitedById: text("invited_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("project_invites_token_unique").on(table.token),
    index("project_invites_project_idx").on(table.projectId),
    index("project_invites_email_idx").on(table.email),
  ],
);

/* -------------------------------------------------------------------------- */
/*                            Sections (board columns)                        */
/* -------------------------------------------------------------------------- */

export const sections = pgTable(
  "sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    position: integer("position").notNull().default(0),
    isCollapsed: boolean("is_collapsed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("sections_project_idx").on(table.projectId, table.position)],
);

/* -------------------------------------------------------------------------- */
/*                                   Tasks                                    */
/* -------------------------------------------------------------------------- */

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Null means the task lives in the personal Inbox. */
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    sectionId: uuid("section_id").references(() => sections.id, {
      onDelete: "set null",
    }),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assigneeId: text("assignee_id").references(() => users.id, {
      onDelete: "set null",
    }),
    parentTaskId: uuid("parent_task_id").references(
      (): AnyPgColumn => tasks.id,
      { onDelete: "cascade" },
    ),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("todo"),
    priority: taskPriorityEnum("priority").notNull().default("none"),
    /** Ordering inside a status column / section. Sparse integers. */
    position: integer("position").notNull().default(0),
    startDate: timestamp("start_date", { withTimezone: true }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    allDay: boolean("all_day").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** RFC 5545 RRULE body, e.g. FREQ=MONTHLY;BYDAY=-1FR. */
    recurrenceRule: text("recurrence_rule"),
    recurrenceMode: recurrenceModeEnum("recurrence_mode")
      .notNull()
      .default("scheduled"),
    estimateMinutes: integer("estimate_minutes"),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("tasks_project_status_idx").on(
      table.projectId,
      table.status,
      table.position,
    ),
    index("tasks_section_idx").on(table.sectionId, table.position),
    index("tasks_assignee_idx").on(table.assigneeId, table.status),
    index("tasks_due_idx").on(table.dueDate),
    index("tasks_parent_idx").on(table.parentTaskId),
    index("tasks_creator_idx").on(table.creatorId),
    index("tasks_updated_idx").on(table.updatedAt),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                  My Day                                    */
/* -------------------------------------------------------------------------- */

export const myDayItems = pgTable(
  "my_day_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("my_day_user_task_day_unique").on(
      table.userId,
      table.taskId,
      table.day,
    ),
    index("my_day_user_day_idx").on(table.userId, table.day, table.position),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                    Tags                                    */
/* -------------------------------------------------------------------------- */

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 40 }).notNull(),
    color: varchar("color", { length: 24 }).notNull().default("#8b7bff"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("tags_owner_name_unique").on(table.ownerId, table.name),
    index("tags_owner_idx").on(table.ownerId),
  ],
);

export const taskTags = pgTable(
  "task_tags",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.tagId] }),
    index("task_tags_tag_idx").on(table.tagId),
  ],
);

/* -------------------------------------------------------------------------- */
/*                          Comments & collaboration                          */
/* -------------------------------------------------------------------------- */

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("comments_task_idx").on(table.taskId, table.createdAt),
    index("comments_author_idx").on(table.authorId),
  ],
);

export const commentMentions = pgTable(
  "comment_mentions",
  {
    commentId: uuid("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.commentId, table.userId] }),
    index("comment_mentions_user_idx").on(table.userId),
  ],
);

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    commentId: uuid("comment_id").references(() => comments.id, {
      onDelete: "cascade",
    }),
    uploaderId: text("uploader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    url: text("url").notNull(),
    mimeType: varchar("mime_type", { length: 120 }),
    sizeBytes: integer("size_bytes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("attachments_task_idx").on(table.taskId)],
);

/* -------------------------------------------------------------------------- */
/*                             Activity & reminders                           */
/* -------------------------------------------------------------------------- */

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    actorId: text("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    type: varchar("type", { length: 64 }).notNull(),
    data: jsonb("data")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("activities_project_idx").on(table.projectId, table.createdAt),
    index("activities_task_idx").on(table.taskId, table.createdAt),
  ],
);

export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: reminderKindEnum("kind").notNull().default("time"),
    remindAt: timestamp("remind_at", { withTimezone: true }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    radiusMeters: integer("radius_meters").notNull().default(250),
    channel: notificationChannelEnum("channel").notNull().default("in_app"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("reminders_due_idx").on(table.remindAt, table.sentAt),
    index("reminders_task_idx").on(table.taskId),
    index("reminders_user_idx").on(table.userId),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    type: varchar("type", { length: 64 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_user_unread_idx").on(table.userId, table.readAt),
    index("notifications_created_idx").on(table.createdAt),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                 Relations                                  */
/* -------------------------------------------------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects),
  memberships: many(projectMembers),
  createdTasks: many(tasks, { relationName: "taskCreator" }),
  assignedTasks: many(tasks, { relationName: "taskAssignee" }),
  comments: many(comments),
  tags: many(tags),
  myDayItems: many(myDayItems),
  notifications: many(notifications),
  reminders: many(reminders),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  members: many(projectMembers),
  invites: many(projectInvites),
  sections: many(sections),
  tasks: many(tasks),
  activities: many(activities),
}));

export const projectMembersRelations = relations(
  projectMembers,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectMembers.projectId],
      references: [projects.id],
    }),
    user: one(users, {
      fields: [projectMembers.userId],
      references: [users.id],
    }),
  }),
);

export const projectInvitesRelations = relations(
  projectInvites,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectInvites.projectId],
      references: [projects.id],
    }),
    invitedBy: one(users, {
      fields: [projectInvites.invitedById],
      references: [users.id],
    }),
  }),
);

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  project: one(projects, {
    fields: [sections.projectId],
    references: [projects.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  section: one(sections, {
    fields: [tasks.sectionId],
    references: [sections.id],
  }),
  creator: one(users, {
    fields: [tasks.creatorId],
    references: [users.id],
    relationName: "taskCreator",
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: "taskAssignee",
  }),
  parent: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: "subtasks",
  }),
  subtasks: many(tasks, { relationName: "subtasks" }),
  comments: many(comments),
  attachments: many(attachments),
  tags: many(taskTags),
  reminders: many(reminders),
  myDayItems: many(myDayItems),
}));

export const myDayItemsRelations = relations(myDayItems, ({ one }) => ({
  user: one(users, {
    fields: [myDayItems.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [myDayItems.taskId],
    references: [tasks.id],
  }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  owner: one(users, {
    fields: [tags.ownerId],
    references: [users.id],
  }),
  tasks: many(taskTags),
}));

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, {
    fields: [taskTags.taskId],
    references: [tasks.id],
  }),
  tag: one(tags, {
    fields: [taskTags.tagId],
    references: [tags.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  mentions: many(commentMentions),
  attachments: many(attachments),
}));

export const commentMentionsRelations = relations(
  commentMentions,
  ({ one }) => ({
    comment: one(comments, {
      fields: [commentMentions.commentId],
      references: [comments.id],
    }),
    user: one(users, {
      fields: [commentMentions.userId],
      references: [users.id],
    }),
  }),
);

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  task: one(tasks, {
    fields: [attachments.taskId],
    references: [tasks.id],
  }),
  comment: one(comments, {
    fields: [attachments.commentId],
    references: [comments.id],
  }),
  uploader: one(users, {
    fields: [attachments.uploaderId],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  project: one(projects, {
    fields: [activities.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [activities.taskId],
    references: [tasks.id],
  }),
  actor: one(users, {
    fields: [activities.actorId],
    references: [users.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  task: one(tasks, {
    fields: [reminders.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [notifications.taskId],
    references: [tasks.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/*                              Inferred types                               */
/* -------------------------------------------------------------------------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type MyDayItem = typeof myDayItems.$inferSelect;
