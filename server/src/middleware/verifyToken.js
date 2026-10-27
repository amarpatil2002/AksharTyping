import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please log in to continue.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is required.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const userId = decoded.id || decoded.userId || decoded.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token.",
      });
    }

    const user = await User.findById(userId).select("_id role");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    req.user = {
      _id: user._id,
      id: user._id.toString(),
      role: user.role,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token.",
      });
    }

    next(error);
  }
}
