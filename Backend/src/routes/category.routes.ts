import { Router } from "express";
import { protect, adminOnly } from "../middlewares/auth.middleware";
import {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategoryProducts,
} from "../controllers/category.controller";

const router = Router();

// Public read endpoints
router.get("/", getAllCategories);
router.get("/slug/:slug", getCategoryBySlug);
router.get("/:id", getCategoryById);

// Admin write endpoints — require Bearer token with role=admin
router.post("/", protect, adminOnly, createCategory);
router.put("/:categoryId/reorder", protect, adminOnly, reorderCategoryProducts);
router.patch("/:id", protect, adminOnly, updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

export default router;
