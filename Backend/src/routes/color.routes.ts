import { Router } from "express";
import { protect, adminOnly } from "../middlewares/auth.middleware";
import { getAllColors, createColor, deleteColor } from "../controllers/color.controller";

const router = Router();

// Public - list all colors
router.get("/", getAllColors);

// Admin - create and delete colors
router.post("/", protect, adminOnly, createColor);
router.delete("/:id", protect, adminOnly, deleteColor);

export default router;