import { AppDataSource } from "../config/data-source";
import { Color } from "../models/Color";
import { AppError } from "../utils/AppError";

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

function validateColorInput(data: { nameEn?: string; nameAr?: string; hexCode?: string }) {
  if (!data.nameEn || !data.nameEn.trim()) throw AppError.validation("nameEn is required");
  if (!data.nameAr || !data.nameAr.trim()) throw AppError.validation("nameAr is required");
  if (!data.hexCode || !HEX_REGEX.test(data.hexCode)) throw AppError.validation("hexCode must be a valid hex color (e.g., #FF0000)");
}

export const ColorService = {
  async getAll() {
    const repo = AppDataSource.getRepository(Color);
    return repo.find({ order: { nameEn: "ASC" } });
  },

  async create(data: { nameEn: string; nameAr: string; hexCode: string }) {
    validateColorInput(data);

    const repo = AppDataSource.getRepository(Color);

    const existingByNameEn = await repo.findOne({ where: { nameEn: data.nameEn.trim() } });
    if (existingByNameEn) throw AppError.conflict("Color with this English name already exists");

    const existingByNameAr = await repo.findOne({ where: { nameAr: data.nameAr.trim() } });
    if (existingByNameAr) throw AppError.conflict("Color with this Arabic name already exists");

    const existingByHex = await repo.findOne({ where: { hexCode: data.hexCode.toUpperCase() } });
    if (existingByHex) throw AppError.conflict("Color with this hex code already exists");

    const color = repo.create({
      nameEn: data.nameEn.trim(),
      nameAr: data.nameAr.trim(),
      hexCode: data.hexCode.toUpperCase(),
    });
    return repo.save(color);
  },

  async delete(id: number) {
    const repo = AppDataSource.getRepository(Color);
    const color = await repo.findOne({ where: { id } });
    if (!color) throw AppError.notFound("Color not found");
    await repo.remove(color);
    return { success: true };
  },
};