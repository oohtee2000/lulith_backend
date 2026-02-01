const superAdminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthenticated" });
  }

  if (req.user.role !== "super_admin") {
    return res.status(403).json({
      message: "Access denied: Super-admins only",
    });
  }

  next();
};

module.exports = superAdminMiddleware;
