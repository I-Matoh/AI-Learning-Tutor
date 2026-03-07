const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Missing Bearer token." });
  }

  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) {
    return res
      .status(500)
      .json({ error: "Server misconfiguration: missing JWT secret." });
  }

  try {
    // Supabase access tokens are signed JWTs. Verify signature and required claims.
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });

    req.user = {
      id: decoded.sub,
      email: decoded.email || null,
      role: decoded.role || null,
    };

    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

module.exports = { authMiddleware };
