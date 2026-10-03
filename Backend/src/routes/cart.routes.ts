import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCarts,
} from "../controllers/cart.controller";
import { protect, userOnly, adminOrUser, requireVerifiedUser } from "../middlewares/auth.middleware";

const router = Router();

// All routes work for both authenticated users and guests (via x-guest-token header)
router.get("/", getCart);
router.post("/items", addToCart);
router.patch("/items/:itemId", updateCartItem);
router.delete("/items/:itemId", removeFromCart);
router.delete("/", clearCart);

// Authenticated user only - merge guest cart after login
router.post("/merge", protect, userOnly, requireVerifiedUser, mergeCarts);

export default router;