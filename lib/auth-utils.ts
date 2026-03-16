export const ROLES = {
  superAdmin: "superAdmin",
  admin: "admin",
  viewer: "viewer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export function canManageUsers(role: string | undefined | null): boolean {
  return role === ROLES.superAdmin || role === ROLES.admin;
}

export function canCreateRole(creatorRole: string, targetRole: string): boolean {
  if (targetRole === ROLES.superAdmin) return false;
  if (creatorRole === ROLES.superAdmin) return true;
  if (creatorRole === ROLES.admin) {
    return targetRole === ROLES.viewer || targetRole === ROLES.admin;
  }
  return false;
}

export function canDeleteUser(
  creatorRole: string,
  targetRole: string
): boolean {
  if (creatorRole === ROLES.superAdmin) return targetRole !== ROLES.superAdmin;
  if (creatorRole === ROLES.admin) {
    return targetRole === ROLES.viewer || targetRole === ROLES.admin;
  }
  return false;
}

export function canChangeRole(role: string | undefined | null): boolean {
  return role === ROLES.superAdmin;
}
