import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCarts,
} from "../controllers/cart.controller";
import { protect, optionalProtect, userOnly, adminOrUser, requireVerifiedUser } from "../middlewares/auth.middleware";

const router = Router();

// All routes work for both authenticated users and guests (via x-guest-token header).
// optionalProtect populates req.user when a valid access token is present,
// so logged-in users read/write their DB user cart; guests use the guest cart.
router.get("/", optionalProtect, getCart);
router.post("/items", optionalProtect, addToCart);
router.patch("/items/:itemId", optionalProtect, updateCartItem);
router.delete("/items/:itemId", optionalProtect, removeFromCart);
router.delete("/", optionalProtect, clearCart);

// Authenticated user only - merge guest cart after login
router.post("/merge", protect, userOnly, requireVerifiedUser, mergeCarts);

export default router;