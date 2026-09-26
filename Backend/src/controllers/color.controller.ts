import { Request, Response } from "express";
import { ColorService } from "../services/color.service";
import { asyncHandler } from "../utils/asyncHandler";

export const getAllColors = asyncHandler(async (_req: Request, res: Response) => {
  const data = await ColorService.getAll();
  res.status(200).json({ success: true, message: "Operation completed successfully", data, statusCode: 200 });
});

export const createColor = asyncHandler(async (req: Request, res: Response) => {
  const { nameEn, nameAr, hexCode } = req.body;
  const data = await ColorService.create({ nameEn, nameAr, hexCode });
  res.status(201).json({ success: true, message: "Color created successfully", data, statusCode: 201 });
});

export const deleteColor = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) throw new Error("Invalid color id");
  await ColorService.delete(id);
  res.status(200).json({ success: true, message: "Color deleted successfully", data: null, statusCode: 200 });
});