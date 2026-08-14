import jwt from "jsonwebtoken";

function getCookieToken(req) {
  if (!req.headers.cookie) return null;
  // Parse Cookie header safely
  const cookies = req.headers.cookie.split(";").reduce((acc, cookieStr) => {
    const parts = cookieStr.split("=");
    const key = parts[0].trim();
    const val = parts.slice(1).join("=");
    acc[key] = val;
    return acc;
  }, {});
  return cookies.token || null;
}

export function requireAuth(req, res, next) {
  let token = null;
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    token = header.slice("Bearer ".length);
  } else {
    token = getCookieToken(req);
  }

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid session" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

// Decodes the token if one is present, but never blocks the request.
// Useful for routes that behave slightly differently for logged-in visitors
// (e.g. showing whether the current user has already saved a property).
export function optionalAuth(req, _res, next) {
  let token = null;
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    token = header.slice("Bearer ".length);
  } else {
    token = getCookieToken(req);
  }

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = payload.userId;
    } catch {
      // ignore invalid/expired token — treat as anonymous
    }
  }
  next();
}
