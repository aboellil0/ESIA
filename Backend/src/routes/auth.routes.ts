import { Router } from "express";
import { register, login, refresh, logout, me, createAdmin, verifyEmail, resendVerification, forgotPassword, resetPassword } from "../controllers/auth.controller";
import { protect, adminOnly, requireVerifiedUser } from "../middlewares/auth.middleware";

const router = Router();

// Public
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/verify-email", verifyEmail);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Authenticated
router.get("/me", protect, requireVerifiedUser, me);
router.post("/admins", createAdmin);

export default router;