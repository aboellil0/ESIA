import { Router, Request, Response } from "express";
import { protect, adminOnly, userOnly, adminOrUser } from "../middlewares/auth.middleware";
import categoryRoutes from "./category.routes";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({ message: "API v1" });
});

router.use("/categories", categoryRoutes);

// Auth routes mounted directly in app.ts with rate-limit, so no mount here
// Example usage:
// router.get("/admin/dashboard", protect, adminOnly, (req,res)=>res.json({ok:true}));
// router.get("/user/orders", protect, userOnly, (req,res)=>res.json({ok:true}));

export default router;
export { protect, adminOnly, userOnly, adminOrUser };