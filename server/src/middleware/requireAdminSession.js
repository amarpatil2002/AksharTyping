export function requireAdminSession(req, res, next) {
  const admin = req.session?.admin;

  if (!admin?.userId || admin.role !== "admin") {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }

  next();
}
