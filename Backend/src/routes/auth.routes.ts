import { Router } from "express";
import { register, login, refresh, logout, me } from "../controllers/auth.controller";
import { protect, adminOnly, userOnly } from "../middlewares/auth.middleware";

const router = Router();

// Public
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

// Authenticated
router.get("/me", protect, me);
router.get("/me/user", protect, userOnly, me);
router.get("/me/admin", protect, adminOnly, me);

export default router;