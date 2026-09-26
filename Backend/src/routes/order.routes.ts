import { Router } from "express";
import {
  createOrder,
  trackOrder,
  getUserOrders,
  getUserOrderById,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  verifyPayment,
  updateOrderNotes,
} from "../controllers/order.controller";
import { protect, adminOnly, userOnly } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import { processMedia } from "../middlewares/media.middleware";

const router = Router();

// Public routes (no authentication required)
// Support multipart/form-data for proof image upload (like products)
router.post("/", upload.any(), processMedia, createOrder);
router.get("/track/:orderNumber", trackOrder);

// Authenticated user routes
router.get("/my-orders", protect, userOnly, getUserOrders);
router.get("/my-orders/:id", protect, userOnly, getUserOrderById);

// Admin routes
router.get("/", protect, adminOnly, getAllOrders);
router.get("/:id", protect, adminOnly, getOrderById);
router.patch("/:id/status", protect, adminOnly, updateOrderStatus);
router.patch("/:id/verify-payment", protect, adminOnly, verifyPayment);
router.patch("/:id/notes", protect, adminOnly, updateOrderNotes);

export default router;