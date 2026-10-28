import { Router } from "express";
import {
  loginAdmin,
  getAdminSession,
  logoutAdmin,
} from "./adminAuth.controller.js";

const router = Router();

router.post("/login", loginAdmin);
router.get("/me", getAdminSession);
router.post("/logout", logoutAdmin);

export default router;
