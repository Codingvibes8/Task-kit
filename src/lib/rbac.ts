import {
  ROLE_CAPABILITIES,
  ROLE_RANK,
  type Capability,
  type ProjectRole,
} from "./constants";

export function can(role: ProjectRole, capability: Capability): boolean {
  const required = ROLE_CAPABILITIES[capability];
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

export function isAtLeast(role: ProjectRole, minimum: ProjectRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function canManageTask(
  role: ProjectRole | null,
  isCreator: boolean,
): boolean {
  // Inbox tasks have no project role; only the creator may touch them.
  if (role === null) return isCreator;
  return can(role, "task:update");
}
