export const ROLE_PERMISSIONS = {
  admin: [
    "signals:read",
    "users:read",
    "users:write",
    "audit:read",
    "settings:write",
    "decision:write"
  ],
  trader: ["signals:read", "decision:write"],
  viewer: ["signals:read"],
  auditor: ["signals:read", "audit:read"],
  ops: ["signals:read", "users:read", "audit:read"]
};

export function listRoles() {
  return Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => ({
    role,
    permissions
  }));
}

export function permissionsForRole(role) {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role, permission) {
  return permissionsForRole(role).includes(permission);
}
