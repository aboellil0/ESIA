import { Router } from "express";
import { register, login, refresh, logout, me, getProfile, updateProfile, changePassword, createAdmin, verifyEmail, resendVerification, forgotPassword, resetPassword } from "../controllers/auth.controller";
import { protect, adminOnly, userOnly, requireVerifiedUser } from "../middlewares/auth.middleware";

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
router.get("/profile", protect, userOnly, requireVerifiedUser, getProfile);
router.patch("/profile", protect, userOnly, requireVerifiedUser, updateProfile);
router.post("/change-password", protect, userOnly, requireVerifiedUser, changePassword);
router.post("/admins", protect, adminOnly, createAdmin);

export default router;