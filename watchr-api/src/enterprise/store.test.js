import test from "node:test";
import assert from "node:assert/strict";
import { createEnterpriseStore } from "./store.js";

test("store can disable demo users", () => {
  const store = createEnterpriseStore({ allowDemoUsers: false });
  assert.equal(store.countUsers(), 0);
  const users = store.listUsers("org_watchr");
  assert.equal(users.length, 0);
  assert.equal(store.validateLogin("admin@watchr.local", "admin12345"), null);
});

test("store bootstrap admin login works", () => {
  const store = createEnterpriseStore({
    allowDemoUsers: false,
    bootstrapAdminEmail: "root@watchr.local",
    bootstrapAdminPassword: "RootPass123"
  });
  const user = store.validateLogin("root@watchr.local", "RootPass123");
  assert.ok(user);
  assert.equal(user.role, "admin");
});

test("addUser enforces password and role policy", () => {
  const store = createEnterpriseStore({ allowDemoUsers: false, passwordMinLength: 10 });
  const weakPassword = store.addUser({
    email: "a@watchr.local",
    password: "abc123",
    role: "viewer"
  });
  assert.equal(weakPassword.ok, false);
  assert.equal(weakPassword.reason, "weak_password");

  const invalidRole = store.addUser({
    email: "b@watchr.local",
    password: "StrongPass123",
    role: "owner"
  });
  assert.equal(invalidRole.ok, false);
  assert.equal(invalidRole.reason, "invalid_role");
});

test("addUser uses hashed password and validateLogin verifies it", () => {
  const store = createEnterpriseStore({ allowDemoUsers: false });
  const created = store.addUser({
    email: "user@watchr.local",
    password: "StrongPass123",
    role: "viewer"
  });
  assert.equal(created.ok, true);
  const ok = store.validateLogin("user@watchr.local", "StrongPass123");
  const fail = store.validateLogin("user@watchr.local", "wrongpass");
  assert.ok(ok);
  assert.equal(fail, null);
});
