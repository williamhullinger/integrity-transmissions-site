import { forbidden } from "./errors.mjs";

export const STAFF_ROLES = Object.freeze(["viewer", "operations", "finance", "administrator"]);

const roleCapabilities = Object.freeze({
  viewer: new Set(["viewer"]),
  operations: new Set(["viewer", "operations"]),
  finance: new Set(["viewer", "finance"]),
  administrator: new Set(STAFF_ROLES),
});

export const normalizeRoles = (roles) => Object.freeze([
  ...new Set((Array.isArray(roles) ? roles : []).filter((role) => STAFF_ROLES.includes(role))),
]);

export const can = (principal, requiredRole) => normalizeRoles(principal?.roles)
  .some((role) => roleCapabilities[role].has(requiredRole));

export const requireRole = (principal, requiredRole) => {
  if (!STAFF_ROLES.includes(requiredRole)) throw new TypeError(`Unknown staff role: ${requiredRole}`);
  if (!can(principal, requiredRole)) throw forbidden();
  return principal;
};

export const mayViewFinancials = (principal) => can(principal, "finance");
