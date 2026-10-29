import { Router } from "express";
import {
  loginAdmin,
  getAdminSession,
  logoutAdmin,
} from "./adminAuth.controller.js";
import { requireAdminSession } from "../../../middleware/requireAdminSession.js";

const router = Router();

router.post("/login", loginAdmin);
router.get("/me", requireAdminSession, getAdminSession);
router.post("/logout", requireAdminSession, logoutAdmin);

export default router;
