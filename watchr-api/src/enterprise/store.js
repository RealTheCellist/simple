import { permissionsForRole } from "./roles.js";

function safeUser(user) {
  const { password, ...rest } = user;
  return {
    ...rest,
    permissions: permissionsForRole(user.role)
  };
}

export function createEnterpriseStore() {
  const users = [
    {
      id: "u_admin",
      email: "admin@watchr.local",
      password: "admin123",
      name: "Ops Admin",
      role: "admin",
      orgId: "org_watchr",
      active: true
    },
    {
      id: "u_trader",
      email: "trader@watchr.local",
      password: "trader123",
      name: "Lead Trader",
      role: "trader",
      orgId: "org_watchr",
      active: true
    },
    {
      id: "u_viewer",
      email: "viewer@watchr.local",
      password: "viewer123",
      name: "Risk Viewer",
      role: "viewer",
      orgId: "org_watchr",
      active: true
    }
  ];

  function listUsers(orgId) {
    return users.filter((user) => user.orgId === orgId).map(safeUser);
  }

  function findById(id) {
    const user = users.find((u) => u.id === id);
    return user ? { raw: user, safe: safeUser(user) } : null;
  }

  function findByEmail(email) {
    return users.find((u) => u.email.toLowerCase() === String(email || "").toLowerCase()) ?? null;
  }

  function validateLogin(email, password) {
    const user = findByEmail(email);
    if (!user) return null;
    if (!user.active) return null;
    if (user.password !== String(password || "")) return null;
    return safeUser(user);
  }

  function addUser({ email, password, name, role, orgId }) {
    const existing = findByEmail(email);
    if (existing) {
      return { ok: false, reason: "email_exists" };
    }
    const user = {
      id: `u_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
      email: String(email || "").toLowerCase(),
      password: String(password || ""),
      name: String(name || "").trim() || "New User",
      role: String(role || "viewer"),
      orgId: String(orgId || "org_watchr"),
      active: true
    };
    users.push(user);
    return { ok: true, user: safeUser(user) };
  }

  return {
    listUsers,
    findById,
    validateLogin,
    addUser
  };
}
