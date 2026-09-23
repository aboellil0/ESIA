import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Category } from "../models/Category";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

const getRepo = () => AppDataSource.getRepository(Category);

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    // keep letters (including Arabic \u0600-\u06FF), numbers, spaces and hyphens
    .replace(/[^\w\s\u0600-\u06FF-]+/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateName(name: unknown): string {
  if (typeof name !== "string" || !name.trim()) {
    throw AppError.badRequest("Category name is required");
  }
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 100) {
    throw AppError.badRequest("Category name must be between 2 and 100 characters");
  }
  return trimmed;
}

function validateSlug(slug: unknown, fallbackName?: string): string {
  const raw = typeof slug === "string" && slug.trim() ? slug.trim() : fallbackName ? slugify(fallbackName) : "";
  if (!raw) throw AppError.badRequest("Category slug is required");
  const normalized = slugify(raw);
  if (normalized.length < 2 || normalized.length > 120) {
    throw AppError.badRequest("Category slug must be between 2 and 120 characters");
  }
  if (!/^[a-z0-9\u0600-\u06FF-]+$/.test(normalized)) {
    throw AppError.badRequest("Category slug may only contain letters, numbers and hyphens");
  }
  return normalized;
}

export const getAllCategories = asyncHandler(async (_req: Request, res: Response) => {
  const repo = getRepo();
  const categories = await repo.find({ order: { id: "ASC" } });
  res.status(200).json({
    success: true,
    message: "Operation completed successfully",
    data: categories,
    statusCode: 200,
  });
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw AppError.badRequest("Invalid category id");

  const repo = getRepo();
  const category = await repo.findOne({ where: { id } });
  if (!category) throw AppError.notFound("Category not found");

  res.status(200).json({
    success: true,
    message: "Operation completed successfully",
    data: category,
    statusCode: 200,
  });
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const repo = getRepo();
  const category = await repo.findOne({ where: { slug } });
  if (!category) throw AppError.notFound("Category not found");
  res.status(200).json({
    success: true,
    message: "Operation completed successfully",
    data: category,
    statusCode: 200,
  });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const name = validateName(req.body.name);
  const slug = validateSlug(req.body.slug, name);

  const repo = getRepo();

  const existingName = await repo.findOne({ where: { name } });
  if (existingName) throw AppError.conflict(`Category with name "${name}" already exists`);

  const existingSlug = await repo.findOne({ where: { slug } });
  if (existingSlug) throw AppError.conflict(`Category with slug "${slug}" already exists`);

  try {
    const category = repo.create({ name, slug });
    const saved = await repo.save(category);
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: saved,
      statusCode: 201,
    });
  } catch (err: any) {
    // handle race-condition unique violation (Postgres 23505)
    if (err?.code === "23505") {
      const detail = err?.detail as string | undefined;
      if (detail?.includes("slug")) throw AppError.conflict(`Category with slug "${slug}" already exists`);
      if (detail?.includes("name")) throw AppError.conflict(`Category with name "${name}" already exists`);
      throw AppError.conflict("Category already exists");
    }
    throw err;
  }
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw AppError.badRequest("Invalid category id");

  const repo = getRepo();
  const category = await repo.findOne({ where: { id } });
  if (!category) throw AppError.notFound("Category not found");

  const hasName = req.body.name !== undefined;
  const hasSlug = req.body.slug !== undefined;

  if (!hasName && !hasSlug) {
    throw AppError.badRequest("At least one of 'name' or 'slug' must be provided");
  }

  let newName = category.name;
  let newSlug = category.slug;

  if (hasName) {
    newName = validateName(req.body.name);
  }
  if (hasSlug) {
    // if slug explicitly provided (even empty string => auto from newName)
    const rawSlug = typeof req.body.slug === "string" && req.body.slug.trim() ? req.body.slug : newName;
    newSlug = validateSlug(rawSlug);
  } else if (hasName) {
    // name changed but slug not provided -> auto-regenerate slug from new name to keep consistent
    newSlug = validateSlug(slugify(newName));
  }

  // uniqueness checks excluding self
  if (newName !== category.name) {
    const dup = await repo.findOne({ where: { name: newName } });
    if (dup) throw AppError.conflict(`Category with name "${newName}" already exists`);
  }
  if (newSlug !== category.slug) {
    const dup = await repo.findOne({ where: { slug: newSlug } });
    if (dup) throw AppError.conflict(`Category with slug "${newSlug}" already exists`);
  }

  category.name = newName;
  category.slug = newSlug;

  try {
    const saved = await repo.save(category);
    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: saved,
      statusCode: 200,
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      const detail = err?.detail as string | undefined;
      if (detail?.includes("slug")) throw AppError.conflict(`Category with slug "${newSlug}" already exists`);
      if (detail?.includes("name")) throw AppError.conflict(`Category with name "${newName}" already exists`);
      throw AppError.conflict("Category already exists");
    }
    throw err;
  }
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw AppError.badRequest("Invalid category id");

  const repo = getRepo();
  const category = await repo.findOne({ where: { id } });
  if (!category) throw AppError.notFound("Category not found");

  // Note: FK products.category_id ON DELETE CASCADE — deleting a category will delete its products.
  // If you want to prevent deletion when products exist, uncomment the check below:
  // const productCount = await AppDataSource.getRepository(Product).count({ where: { categoryId: id } });
  // if (productCount > 0) throw AppError.conflict("Cannot delete category with existing products");

  await repo.remove(category);

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
    data: null,
    statusCode: 200,
  });
});
