import test from "node:test";
import assert from "node:assert/strict";
import { issueToken, verifyToken } from "./token.js";

test("issueToken and verifyToken success path", () => {
  const token = issueToken(
    { sub: "u_admin", role: "admin" },
    { secret: "test_secret", ttlSec: 60 }
  );
  const verified = verifyToken(token, { secret: "test_secret" });
  assert.equal(verified.ok, true);
  assert.equal(verified.payload.sub, "u_admin");
  assert.equal(verified.payload.role, "admin");
});

test("verifyToken fails with wrong secret", () => {
  const token = issueToken(
    { sub: "u_admin", role: "admin" },
    { secret: "test_secret", ttlSec: 60 }
  );
  const verified = verifyToken(token, { secret: "wrong_secret" });
  assert.equal(verified.ok, false);
});
