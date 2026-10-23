import { requireAuth } from "./requireAuth.js";
import User from "../models/User.js";

// Use after requireAuth for admin-only endpoints.
export async function requireAdmin(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Please log in to continue." });
    }

    const user = await User.findById(req.session.userId).select("_id role");

    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Your session is no longer valid." });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Administrator access is required." });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
