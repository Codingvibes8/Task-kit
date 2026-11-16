import * as chrono from "chrono-node";

import { PRIORITY_PARSE_TOKENS, type TaskPriority } from "./constants";

export type ParsedCapture = {
  title: string;
  dueDate: Date | null;
  allDay: boolean;
  priority: TaskPriority;
  tagNames: string[];
  projectName: string | null;
  recurrenceRule: string | null;
};

const TAG_PATTERN = /(^|\s)#([\p{L}\p{N}_-]{1,40})/gu;
const PRIORITY_PATTERN = /(^|\s)(!(?:urgent|high|medium|med|low|p[0-4]))\b/gi;
const PROJECT_PATTERN = /(^|\s)\/([\p{L}][\p{L}\p{N}_-]{0,80})/gu;
const RECURRENCE_PATTERN =
  /(^|\s)(every\s+(?:day|weekday|week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday))(?=\s|$)/i;

/**
 * Parse frictionless-capture syntax. 100% local, deterministic, and unit-test
 * friendly. Keeps the original text if parsing produces an empty title.
 *
 * `Meeting with Sarah tomorrow at 3 PM #work !high`
 *   → title "Meeting with Sarah", due tomorrow 15:00, tag work, priority high
 */
export function parseCapture(
  input: string,
  referenceDate: Date = new Date(),
): ParsedCapture {
  const original = input.trim();
  const tagNames: string[] = [];
  let working = ` ${original} `;

  working = working.replace(TAG_PATTERN, (_match, lead: string, name: string) => {
    const normalized = name.toLowerCase();
    if (!tagNames.includes(normalized)) tagNames.push(normalized);
    return lead;
  });

  let priority: TaskPriority = "none";
  working = working.replace(
    PRIORITY_PATTERN,
    (_match, lead: string, token: string) => {
      const mapped = PRIORITY_PARSE_TOKENS[token.toLowerCase()];
      if (mapped && priority === "none") priority = mapped;
      return lead;
    },
  );

  let projectName: string | null = null;
  working = working.replace(
    PROJECT_PATTERN,
    (_match, lead: string, name: string) => {
      if (!projectName) projectName = name.toLowerCase();
      return lead;
    },
  );

  let recurrenceRule: string | null = null;
  const recurrenceMatch = working.match(RECURRENCE_PATTERN);
  if (recurrenceMatch) {
    recurrenceRule = toRRule(recurrenceMatch[2]);
    working = working.replace(recurrenceMatch[0], " ");
  }

  let dueDate: Date | null = null;
  let allDay = false;

  const parsed = chrono.parse(working, referenceDate, { forwardDate: true })[0];
  if (parsed) {
    dueDate = parsed.start.date();
    allDay = !parsed.start.isCertain("hour");
    working = `${working.slice(0, parsed.index)} ${working.slice(
      parsed.index + parsed.text.length,
    )}`;
  }

  const title = working.replace(/\s+/g, " ").trim();

  return {
    title: title || original,
    dueDate,
    allDay,
    priority,
    tagNames,
    projectName,
    recurrenceRule,
  };
}

function toRRule(phrase: string): string {
  const normalized = phrase.toLowerCase().replace(/\s+/g, " ").trim();

  switch (normalized) {
    case "every day":
      return "FREQ=DAILY";
    case "every weekday":
      return "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR";
    case "every week":
      return "FREQ=WEEKLY";
    case "every month":
      return "FREQ=MONTHLY";
    case "every year":
      return "FREQ=YEARLY";
    default: {
      const weekday = normalized.replace("every ", "").toUpperCase();
      const map: Record<string, string> = {
        MONDAY: "MO",
        TUESDAY: "TU",
        WEDNESDAY: "WE",
        THURSDAY: "TH",
        FRIDAY: "FR",
        SATURDAY: "SA",
        SUNDAY: "SU",
      };
      return map[weekday]
        ? `FREQ=WEEKLY;BYDAY=${map[weekday]}`
        : "FREQ=WEEKLY";
    }
  }
}
