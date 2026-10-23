import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Please log in to continue.",
      });
    }

    const user = await User.findById(req.session.userId).select("_id role");

    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({
        message: "Your session is no longer valid.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
