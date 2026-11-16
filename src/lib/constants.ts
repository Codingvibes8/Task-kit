/**
 * Shared domain constants.
 *
 * This file is safe to import from client components: it contains no database
 * or server-only dependencies. The Drizzle schema derives its enums from these
 * tuples so runtime validation and Postgres can never drift apart.
 */

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = [
  "none",
  "low",
  "medium",
  "high",
  "urgent",
] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const PROJECT_ROLES = ["owner", "admin", "member", "viewer"] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

export const PROJECT_VISIBILITIES = ["private", "shared"] as const;
export type ProjectVisibility = (typeof PROJECT_VISIBILITIES)[number];

export const RECURRENCE_MODES = ["scheduled", "completion"] as const;
export type RecurrenceMode = (typeof RECURRENCE_MODES)[number];

export const REMINDER_KINDS = ["time", "location"] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

export const NOTIFICATION_CHANNELS = [
  "in_app",
  "email",
  "push",
] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const STATUS_META: Record<
  TaskStatus,
  { label: string; short: string; dot: string; text: string; ring: string }
> = {
  todo: {
    label: "To Do",
    short: "Todo",
    dot: "bg-sky-400",
    text: "text-sky-300",
    ring: "ring-sky-400/25",
  },
  in_progress: {
    label: "In Progress",
    short: "Doing",
    dot: "bg-amber-400",
    text: "text-amber-300",
    ring: "ring-amber-400/25",
  },
  done: {
    label: "Done",
    short: "Done",
    dot: "bg-lime-400",
    text: "text-lime-300",
    ring: "ring-lime-400/25",
  },
};

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; chip: string; dot: string; weight: number }
> = {
  none: {
    label: "No priority",
    chip: "text-zinc-400 bg-white/5 ring-white/10",
    dot: "bg-zinc-500",
    weight: 0,
  },
  low: {
    label: "Low",
    chip: "text-sky-300 bg-sky-400/10 ring-sky-400/20",
    dot: "bg-sky-400",
    weight: 1,
  },
  medium: {
    label: "Medium",
    chip: "text-emerald-300 bg-emerald-400/10 ring-emerald-400/20",
    dot: "bg-emerald-400",
    weight: 2,
  },
  high: {
    label: "High",
    chip: "text-amber-300 bg-amber-400/10 ring-amber-400/20",
    dot: "bg-amber-400",
    weight: 3,
  },
  urgent: {
    label: "Urgent",
    chip: "text-rose-300 bg-rose-400/10 ring-rose-400/20",
    dot: "bg-rose-400",
    weight: 4,
  },
};

export const ROLE_RANK: Record<ProjectRole, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

/** Minimum role required for a capability. */
export const ROLE_CAPABILITIES = {
  "task:create": "member",
  "task:update": "member",
  "task:delete": "member",
  "project:update": "admin",
  "project:archive": "admin",
  "project:delete": "owner",
  "project:invite": "admin",
  "member:manage": "admin",
} as const satisfies Record<string, ProjectRole>;

export type Capability = keyof typeof ROLE_CAPABILITIES;

export const TASK_TITLE_MAX = 500;
export const TASK_DESCRIPTION_MAX = 20_000;
export const COMMENT_BODY_MAX = 10_000;
export const PROJECT_NAME_MAX = 160;
export const TAG_NAME_MAX = 40;

export const PRIORITY_PARSE_TOKENS: Record<string, TaskPriority> = {
  "!p0": "urgent",
  "!p1": "urgent",
  "!urgent": "urgent",
  "!high": "high",
  "!p2": "high",
  "!medium": "medium",
  "!med": "medium",
  "!p3": "medium",
  "!low": "low",
  "!p4": "low",
};
