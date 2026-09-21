import { Router } from "express";
import { register, login, adminLogin, refresh, logout, me } from "../controllers/auth.controller";
import { protect, adminOnly, userOnly, adminOrUser } from "../middlewares/auth.middleware";

const router = Router();

// Public - same style as Basira
router.post("/register", register);
router.post("/login", login);
router.post("/admin/login", adminLogin);
router.post("/refresh", refresh);
router.post("/logout", logout);

// Authenticated
router.get("/me", protect, me);
router.get("/me/user", protect, userOnly, me);
router.get("/me/admin", protect, adminOnly, me);
router.get("/me/admin-or-user", protect, adminOrUser, me);

// Role examples
router.get("/admin-only", protect, adminOnly, me);
router.get("/user-only", protect, userOnly, me);

export default router;