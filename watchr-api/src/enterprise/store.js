import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { permissionsForRole } from "./roles.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashPassword(password, saltHex = randomBytes(16).toString("hex")) {
  const hash = scryptSync(String(password || ""), saltHex, 64).toString("hex");
  return `${saltHex}:${hash}`;
}

function verifyPassword(password, stored) {
  const raw = String(stored || "");
  const [saltHex, expectedHashHex] = raw.split(":");
  if (!saltHex || !expectedHashHex) return false;
  const actualHashHex = scryptSync(String(password || ""), saltHex, 64).toString("hex");
  const expected = Buffer.from(expectedHashHex, "hex");
  const actual = Buffer.from(actualHashHex, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

function isStrongPassword(password, minLength) {
  const raw = String(password || "");
  if (raw.length < minLength) return false;
  if (!/[a-z]/i.test(raw)) return false;
  if (!/\d/.test(raw)) return false;
  return true;
}

function safeUser(user) {
  const { password, ...rest } = user;
  return {
    ...rest,
    permissions: permissionsForRole(user.role)
  };
}

export function createEnterpriseStore({
  allowDemoUsers = true,
  bootstrapAdminEmail = "",
  bootstrapAdminPassword = "",
  passwordMinLength = 10
} = {}) {
  const users = [];

  function pushUser({ id, email, password, name, role, orgId, active = true }) {
    users.push({
      id,
      email: normalizeEmail(email),
      password: hashPassword(password),
      name,
      role,
      orgId,
      active
    });
  }

  if (allowDemoUsers) {
    pushUser({
      id: "u_admin",
      email: "admin@watchr.local",
      password: "admin12345",
      name: "Ops Admin",
      role: "admin",
      orgId: "org_watchr"
    });
    pushUser({
      id: "u_trader",
      email: "trader@watchr.local",
      password: "trader12345",
      name: "Lead Trader",
      role: "trader",
      orgId: "org_watchr"
    });
    pushUser({
      id: "u_viewer",
      email: "viewer@watchr.local",
      password: "viewer12345",
      name: "Risk Viewer",
      role: "viewer",
      orgId: "org_watchr"
    });
  }

  const bootstrapEmail = normalizeEmail(bootstrapAdminEmail);
  if (bootstrapEmail && bootstrapAdminPassword) {
    pushUser({
      id: "u_bootstrap_admin",
      email: bootstrapEmail,
      password: bootstrapAdminPassword,
      name: "Bootstrap Admin",
      role: "admin",
      orgId: "org_watchr"
    });
  }

  function listUsers(orgId) {
    return users.filter((user) => user.orgId === orgId).map(safeUser);
  }

  function countUsers() {
    return users.length;
  }

  function findById(id) {
    const user = users.find((u) => u.id === id);
    return user ? { raw: user, safe: safeUser(user) } : null;
  }

  function findByEmail(email) {
    const normalized = normalizeEmail(email);
    return users.find((u) => u.email === normalized) ?? null;
  }

  function validateLogin(email, password) {
    const user = findByEmail(email);
    if (!user) return null;
    if (!user.active) return null;
    if (!verifyPassword(password, user.password)) return null;
    return safeUser(user);
  }

  function addUser({ email, password, name, role, orgId }) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { ok: false, reason: "invalid_email" };
    }
    const existing = findByEmail(email);
    if (existing) {
      return { ok: false, reason: "email_exists" };
    }
    const normalizedRole = String(role || "viewer");
    if (permissionsForRole(normalizedRole).length === 0) {
      return { ok: false, reason: "invalid_role" };
    }
    if (!isStrongPassword(password, passwordMinLength)) {
      return { ok: false, reason: "weak_password" };
    }
    const user = {
      id: `u_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
      email: normalizedEmail,
      password: hashPassword(password),
      name: String(name || "").trim() || "New User",
      role: normalizedRole,
      orgId: String(orgId || "org_watchr"),
      active: true
    };
    users.push(user);
    return { ok: true, user: safeUser(user) };
  }

  return {
    countUsers,
    listUsers,
    findById,
    validateLogin,
    addUser
  };
}
