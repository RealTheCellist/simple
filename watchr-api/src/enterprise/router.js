import express from "express";
import { permissionRequired } from "./middleware.js";
import { listRoles } from "./roles.js";
import { issueToken } from "./token.js";

export function createEnterpriseRouter({
  store,
  audit,
  metrics,
  authRequired,
  tokenSecret,
  tokenTtlSec
}) {
  const router = express.Router();

  router.get("/health", (req, res) => {
    res.json({
      enabled: true,
      timestamp: new Date().toISOString(),
      roles: listRoles().map((item) => item.role)
    });
  });

  router.post("/auth/login", (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const user = store.validateLogin(email, password);

    if (!user) {
      metrics?.incAuth("loginFailure");
      audit.add({
        actorId: "anonymous",
        actorEmail: email || "anonymous",
        action: "auth.login",
        resource: "enterprise",
        status: "fail"
      });
      return res.status(401).json({ error: "invalid_credentials" });
    }
    metrics?.incAuth("loginSuccess");

    const token = issueToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        name: user.name
      },
      {
        secret: tokenSecret,
        ttlSec: tokenTtlSec
      }
    );

    audit.add({
      actorId: user.id,
      actorEmail: user.email,
      action: "auth.login",
      resource: "enterprise",
      status: "ok"
    });

    return res.json({
      tokenType: "Bearer",
      token,
      expiresInSec: tokenTtlSec,
      user
    });
  });

  router.get("/me", authRequired, (req, res) => {
    const user = req.enterpriseUser;
    audit.add({
      actorId: user.id,
      actorEmail: user.email,
      action: "auth.me",
      resource: "enterprise",
      status: "ok"
    });
    res.json({ user });
  });

  router.get("/roles", authRequired, (req, res) => {
    const user = req.enterpriseUser;
    audit.add({
      actorId: user.id,
      actorEmail: user.email,
      action: "roles.list",
      resource: "enterprise",
      status: "ok"
    });
    res.json({ roles: listRoles() });
  });

  router.get("/users", authRequired, permissionRequired("users:read"), (req, res) => {
    const user = req.enterpriseUser;
    const users = store.listUsers(user.orgId);
    audit.add({
      actorId: user.id,
      actorEmail: user.email,
      action: "users.list",
      resource: "enterprise",
      status: "ok",
      meta: { count: users.length }
    });
    res.json({ users });
  });

  router.post("/users", authRequired, permissionRequired("users:write"), (req, res) => {
    const actor = req.enterpriseUser;
    const created = store.addUser({
      email: req.body?.email,
      password: req.body?.password,
      name: req.body?.name,
      role: req.body?.role,
      orgId: actor.orgId
    });
    if (!created.ok) {
      audit.add({
        actorId: actor.id,
        actorEmail: actor.email,
        action: "users.create",
        resource: "enterprise",
        status: "fail",
        meta: { reason: created.reason }
      });
      return res.status(400).json({ error: created.reason });
    }

    audit.add({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "users.create",
      resource: "enterprise",
      status: "ok",
      meta: { userId: created.user.id, role: created.user.role }
    });
    return res.status(201).json({ user: created.user });
  });

  router.post("/decision", authRequired, permissionRequired("decision:write"), (req, res) => {
    const actor = req.enterpriseUser;
    const payload = {
      ticker: String(req.body?.ticker || "").toUpperCase(),
      side: String(req.body?.side || "").toLowerCase(),
      reason: String(req.body?.reason || ""),
      confidence: Number(req.body?.confidence ?? 0)
    };
    audit.add({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "decision.write",
      resource: payload.ticker || "unknown",
      status: "ok",
      meta: payload
    });
    return res.status(201).json({ ok: true, decision: payload });
  });

  router.get("/audit", authRequired, permissionRequired("audit:read"), (req, res) => {
    const actor = req.enterpriseUser;
    const limit = Number(req.query.limit ?? 100);
    const logs = audit.list({ limit });
    audit.add({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "audit.list",
      resource: "enterprise",
      status: "ok",
      meta: { limit, returned: logs.length }
    });
    res.json({ logs });
  });

  return router;
}
