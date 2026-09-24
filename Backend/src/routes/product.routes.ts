import { Router } from "express";
import { protect, adminOnly } from "../middlewares/auth.middleware";
import { createProduct, getAllProducts, getProductById } from "../controllers/product.controller";

const router = Router();

// Public reads
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Admin writes
router.post("/", protect, adminOnly, createProduct);

export default router;
