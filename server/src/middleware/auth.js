import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Decodes the token if one is present, but never blocks the request.
// Useful for routes that behave slightly differently for logged-in visitors
// (e.g. showing whether the current user has already saved a property).
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.slice("Bearer ".length), process.env.JWT_SECRET);
      req.userId = payload.userId;
    } catch {
      // ignore invalid/expired token — treat as anonymous
    }
  }
  next();
}
