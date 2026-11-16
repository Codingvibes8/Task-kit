import { z } from "zod";

import {
  COMMENT_BODY_MAX,
  PROJECT_NAME_MAX,
  RECURRENCE_MODES,
  TAG_NAME_MAX,
  TASK_DESCRIPTION_MAX,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TITLE_MAX,
} from "@/lib/constants";

export const taskStatusSchema = z.enum(TASK_STATUSES);
export const taskPrioritySchema = z.enum(TASK_PRIORITIES);
export const recurrenceModeSchema = z.enum(RECURRENCE_MODES);

const nullableIsoDate = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .optional();

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "A title is required").max(TASK_TITLE_MAX),
  description: z.string().max(TASK_DESCRIPTION_MAX).nullable().optional(),
  projectId: z.uuid().nullable().optional(),
  sectionId: z.uuid().nullable().optional(),
  assigneeId: z.string().min(1).max(120).nullable().optional(),
  parentTaskId: z.uuid().nullable().optional(),
  status: taskStatusSchema.default("todo"),
  priority: taskPrioritySchema.default("none"),
  startDate: nullableIsoDate,
  dueDate: nullableIsoDate,
  allDay: z.boolean().default(false),
  estimateMinutes: z.number().int().min(0).max(10_000).nullable().optional(),
  recurrenceRule: z.string().max(500).nullable().optional(),
  recurrenceMode: recurrenceModeSchema.default("scheduled"),
  tagIds: z.array(z.uuid()).max(20).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(TASK_TITLE_MAX).optional(),
  description: z.string().max(TASK_DESCRIPTION_MAX).nullable().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  sectionId: z.uuid().nullable().optional(),
  assigneeId: z.string().min(1).max(120).nullable().optional(),
  startDate: nullableIsoDate,
  dueDate: nullableIsoDate,
  allDay: z.boolean().optional(),
  estimateMinutes: z.number().int().min(0).max(10_000).nullable().optional(),
  recurrenceRule: z.string().max(500).nullable().optional(),
  recurrenceMode: recurrenceModeSchema.optional(),
  tagIds: z.array(z.uuid()).max(20).optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const moveTaskSchema = z.object({
  id: z.uuid(),
  status: taskStatusSchema,
  position: z.number().int().min(0).max(1_000_000).optional(),
});

export const quickAddSchema = z.object({
  text: z.string().trim().min(1).max(1_000),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(PROJECT_NAME_MAX),
  description: z.string().max(2_000).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour")
    .default("#d6ff4b"),
  icon: z.string().max(40).default("layers"),
});

export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(TAG_NAME_MAX),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour")
    .default("#a18bff"),
});

export const createCommentSchema = z.object({
  taskId: z.uuid(),
  body: z.string().trim().min(1).max(COMMENT_BODY_MAX),
});

export const myDaySchema = z.object({
  taskId: z.uuid(),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
