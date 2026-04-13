import crypto from "node:crypto";

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input) {
  const normalized = String(input).replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf-8");
}

function sign(payloadSegment, secret) {
  return base64UrlEncode(
    crypto.createHmac("sha256", secret).update(payloadSegment).digest()
  );
}

export function issueToken(payload, { secret, ttlSec }) {
  const nowSec = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: nowSec,
    exp: nowSec + ttlSec
  };
  const payloadSegment = base64UrlEncode(JSON.stringify(tokenPayload));
  const signature = sign(payloadSegment, secret);
  return `${payloadSegment}.${signature}`;
}

export function verifyToken(token, { secret }) {
  const [payloadSegment, signature] = String(token || "").split(".");
  if (!payloadSegment || !signature) {
    return { ok: false, reason: "bad_format" };
  }

  const expected = sign(payloadSegment, secret);
  if (signature !== expected) {
    return { ok: false, reason: "bad_signature" };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadSegment));
    const nowSec = Math.floor(Date.now() / 1000);
    if (Number(payload.exp) <= nowSec) {
      return { ok: false, reason: "expired" };
    }
    return { ok: true, payload };
  } catch (error) {
    return { ok: false, reason: "bad_payload" };
  }
}
