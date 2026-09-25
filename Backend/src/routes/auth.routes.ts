import { Router } from "express";
import { register, login, refresh, logout, me, createAdmin } from "../controllers/auth.controller";
import { protect, adminOnly } from "../middlewares/auth.middleware";

const router = Router();

// Public
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

// Authenticated
router.get("/me", protect, me);
router.post("/admins", createAdmin);

export default router;