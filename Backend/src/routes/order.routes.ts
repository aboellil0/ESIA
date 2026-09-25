import { Router } from "express";
import {
  createOrder,
  submitPayment,
  trackOrder,
  getUserOrders,
  getUserOrderById,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  verifyPayment,
  updateOrderNotes,
  cancelOrder,
} from "../controllers/order.controller";
import { protect, adminOnly, userOnly } from "../middlewares/auth.middleware";

const router = Router();

// Public routes (no authentication required)
router.post("/", createOrder);
router.post("/:orderNumber/payment", submitPayment);
router.get("/track/:orderNumber", trackOrder);

// Authenticated user routes
router.get("/my-orders", protect, userOnly, getUserOrders);
router.get("/my-orders/:id", protect, userOnly, getUserOrderById);
router.patch("/my-orders/:id/cancel", protect, userOnly, cancelOrder);

// Admin routes
router.get("/", protect, adminOnly, getAllOrders);
router.get("/:id", protect, adminOnly, getOrderById);
router.patch("/:id/status", protect, adminOnly, updateOrderStatus);
router.patch("/:id/verify-payment", protect, adminOnly, verifyPayment);
router.patch("/:id/notes", protect, adminOnly, updateOrderNotes);

export default router;