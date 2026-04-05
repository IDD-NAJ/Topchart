/**
 * Role-based access control (RBAC) constants and helpers.
 * Centralizes role values and type-safe checks for security and maintainability.
 */

export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
  RESELLER: "RESELLER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** All allowed role values for validation */
export const ALLOWED_ROLES: Role[] = [ROLES.USER, ROLES.ADMIN, ROLES.RESELLER];

/**
 * Normalizes a raw role string to a canonical Role or null.
 * Case-insensitive.
 */
export function normalizeRole(raw: string | null | undefined): Role | null {
  if (raw == null || raw === "") return null;
  const u = String(raw).trim().toUpperCase();
  return ALLOWED_ROLES.includes(u as Role) ? (u as Role) : null;
}

/**
 * Returns true if the role is ADMIN.
 */
export function isAdmin(role: string | null | undefined): boolean {
  return normalizeRole(role) === ROLES.ADMIN;
}

/**
 * Returns true if the role is USER (or any non-ADMIN when strict is false).
 */
export function isUser(role: string | null | undefined, strict = false): boolean {
  const r = normalizeRole(role);
  if (strict) return r === ROLES.USER;
  return r === ROLES.USER || r === null;
}

/**
 * Checks if the user has at least the required role.
 * Order: USER < ADMIN. ADMIN satisfies requirements for USER.
 */
export function hasRole(
  userRole: string | null | undefined,
  required: Role
): boolean {
  const r = normalizeRole(userRole);
  if (!r) return required === ROLES.USER;
  if (required === ROLES.USER) return true;
  if (required === ROLES.ADMIN) return r === ROLES.ADMIN;
  return false;
}

/**
 * Returns true if the role is RESELLER.
 */
export function isReseller(role: string | null | undefined): boolean {
  return normalizeRole(role) === ROLES.RESELLER;
}

/**
 * Validates that a string is an allowed role. Used for role assignment/updates.
 */
export function isValidRole(value: string): value is Role {
  return ALLOWED_ROLES.includes(value as Role);
}

/**
 * Checks if user can access reseller features.
 */
export function canAccessReseller(role: string | null | undefined): boolean {
  const r = normalizeRole(role);
  return r === ROLES.RESELLER || r === ROLES.ADMIN;
}
