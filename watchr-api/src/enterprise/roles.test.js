import test from "node:test";
import assert from "node:assert/strict";
import { hasPermission, permissionsForRole } from "./roles.js";

test("admin has users:write permission", () => {
  assert.equal(hasPermission("admin", "users:write"), true);
});

test("viewer does not have users:read permission", () => {
  assert.equal(hasPermission("viewer", "users:read"), false);
});

test("permissionsForRole returns empty array for unknown role", () => {
  assert.deepEqual(permissionsForRole("unknown"), []);
});
