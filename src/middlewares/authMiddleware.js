const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const user = jwt.verify(token, process.env.SECRET_KEY);
    req.user = user; // Attach user info (including user.type)
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user?.type !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

const authorizeDriver = (req, res, next) => {
  if (req.user?.type !== "driver") {
    return res.status(403).json({ error: "Driver access required" });
  }
  next();
};

const authorizeDriverOrAdmin = (req, res, next) => {
  if (req.user?.type !== "driver" && req.user?.type !== "admin") {
    return res.status(403).json({ error: "Driver or Admin access required" });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin, authorizeDriver, authorizeDriverOrAdmin };
