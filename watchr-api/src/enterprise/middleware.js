import { hasPermission } from "./roles.js";
import { verifyToken } from "./token.js";

function bearerTokenFromHeader(req) {
  const raw = String(req.headers.authorization || "");
  if (!raw.startsWith("Bearer ")) return "";
  return raw.slice("Bearer ".length).trim();
}

export function enterpriseAuthRequired({ tokenSecret, store, audit, metrics }) {
  return (req, res, next) => {
    const token = bearerTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ error: "unauthorized", reason: "missing_token" });
    }
    const verified = verifyToken(token, { secret: tokenSecret });
    if (!verified.ok) {
      audit.add({
        actorId: "anonymous",
        actorEmail: "anonymous",
        action: "auth.verify",
        resource: req.path,
        status: "fail",
        meta: { reason: verified.reason }
      });
      metrics?.incAuth("tokenFailure");
      return res.status(401).json({ error: "unauthorized", reason: verified.reason });
    }

    const userHit = store.findById(verified.payload.sub);
    if (!userHit) {
      return res.status(401).json({ error: "unauthorized", reason: "unknown_user" });
    }
    req.enterpriseUser = userHit.safe;
    return next();
  };
}

export function permissionRequired(permission) {
  return (req, res, next) => {
    const user = req.enterpriseUser;
    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!hasPermission(user.role, permission)) {
      return res.status(403).json({ error: "forbidden", permission });
    }
    return next();
  };
}
