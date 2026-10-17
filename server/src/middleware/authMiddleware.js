import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const accessToken = authHeader.slice(7);

    const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    if (
      typeof payload === "string" ||
      payload.typ !== "access" ||
      !payload.sub
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token.",
      });
    }

    const user = await User.findById(payload.sub);

    if (!user || !user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: "User authentication is invalid.",
      });
    }

    req.user = user;
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

    return next(error);
  }
};
