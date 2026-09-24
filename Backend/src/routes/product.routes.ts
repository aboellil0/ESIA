import { Router } from "express";
import { protect, adminOnly } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import { processMedia } from "../middlewares/media.middleware";
import {
  createProduct,
  getAllProducts,
  getProductById,
  addProductImages,
  removeProductImage,
  reorderProductImages,
  setMainProductImage,
} from "../controllers/product.controller";

const router = Router();

// Public reads — list and detail (detail includes sorted images, main is order 0 like Al Rouba)
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Admin writes — Al Rouba best: upload.any() + processMedia (compress, validate 3MB image) before controller
// Accepts multipart/form-data files fieldname "images" / "files" and JSON body fields.
// Also accepts pure JSON with images: [{imageUrl}] for backward compat.
router.post("/", protect, adminOnly, upload.any(), processMedia, createProduct);

// ─── Al Rouba media management — best scenarios for existing product ───
// Add images to existing product (like Al Rouba POST /:id/media)
router.post("/:id/images", protect, adminOnly, upload.any(), processMedia, addProductImages);
// Alternative alias: POST /:id/media for parity with Al Rouba
router.post("/:id/media", protect, adminOnly, upload.any(), processMedia, addProductImages);

// Remove image by order or imageId (like Al Rouba DELETE /:id/media)
router.delete("/:id/images/:order", protect, adminOnly, removeProductImage);
router.delete("/:id/media", protect, adminOnly, removeProductImage);

// Reorder images: body { currentOrder, newOrder } — like Al Rouba PUT /:id/media/reorder
router.put("/:id/images/reorder", protect, adminOnly, reorderProductImages);
router.put("/:id/media/reorder", protect, adminOnly, reorderProductImages);

// Set main image for card (isMain attribute) — is_main boolean + mainImageUrl synced
router.patch("/:id/images/main", protect, adminOnly, setMainProductImage);
router.put("/:id/images/main", protect, adminOnly, setMainProductImage);
router.patch("/:id/media/main", protect, adminOnly, setMainProductImage);

export default router;
