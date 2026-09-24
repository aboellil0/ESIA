import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Product } from "../models/Product";
import { ProductColor } from "../models/ProductColor";
import { ProductSize } from "../models/ProductSize";
import { ProductImage } from "../models/ProductImage";
import { Category } from "../models/Category";
import { ProductTag, DefaultShape, ProductSize as SizeEnum } from "../models/enums";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

function validateProductPayload(body: any) {
  const errors: string[] = [];

  // name
  if (typeof body.name !== "string" || !body.name.trim()) errors.push("name is required");
  else if (body.name.trim().length < 2 || body.name.trim().length > 200) errors.push("name must be between 2 and 200 characters");

  // categoryId / categorySlug
  let categoryId: number | undefined;
  if (body.categoryId !== undefined) {
    const n = Number(body.categoryId);
    if (!Number.isInteger(n) || n <= 0) errors.push("categoryId must be a positive integer");
    else categoryId = n;
  } else if (body.categorySlug !== undefined) {
    if (typeof body.categorySlug !== "string" || !body.categorySlug.trim()) errors.push("categorySlug must be a non-empty string");
  } else if (body.category_id !== undefined) {
    const n = Number(body.category_id);
    if (!Number.isInteger(n) || n <= 0) errors.push("categoryId must be a positive integer");
    else categoryId = n;
  } else {
    errors.push("categoryId or categorySlug is required");
  }

  // price
  if (body.price === undefined || body.price === null || body.price === "") errors.push("price is required");
  else {
    const p = Number(body.price);
    if (Number.isNaN(p) || p < 0) errors.push("price must be a valid non-negative number");
  }

  // oldPrice optional
  if (body.oldPrice !== undefined && body.oldPrice !== null && body.oldPrice !== "") {
    const op = Number(body.oldPrice);
    if (Number.isNaN(op) || op < 0) errors.push("oldPrice must be a valid non-negative number");
  }

  // tag optional
  if (body.tag !== undefined && body.tag !== null && body.tag !== "") {
    if (!Object.values(ProductTag).includes(body.tag)) errors.push(`tag must be one of: ${Object.values(ProductTag).join(", ")}`);
  }

  // defaultShape optional nullable
  if (body.defaultShape !== undefined && body.defaultShape !== null && body.defaultShape !== "") {
    if (!Object.values(DefaultShape).includes(body.defaultShape)) errors.push(`defaultShape must be one of: ${Object.values(DefaultShape).join(", ")}`);
  }

  // shortDescription optional
  if (body.shortDescription !== undefined && body.shortDescription !== null && body.shortDescription !== "") {
    if (typeof body.shortDescription !== "string") errors.push("shortDescription must be a string");
    else if (body.shortDescription.length > 5000) errors.push("shortDescription must be <= 5000 characters");
  }

  // isActive optional boolean
  if (body.isActive !== undefined && body.isActive !== null) {
    if (typeof body.isActive !== "boolean" && body.isActive !== "true" && body.isActive !== "false" && body.isActive !== 0 && body.isActive !== 1) {
      // allow boolean coercion but warn
      if (typeof body.isActive !== "boolean") errors.push("isActive must be a boolean");
    }
  }

  // mainImageUrl optional
  if (body.mainImageUrl !== undefined && body.mainImageUrl !== null && body.mainImageUrl !== "") {
    if (typeof body.mainImageUrl !== "string" || !body.mainImageUrl.trim()) errors.push("mainImageUrl must be a non-empty string");
    else if (body.mainImageUrl.length > 2000) errors.push("mainImageUrl too long");
  }

  // colors required
  if (!Array.isArray(body.colors) || body.colors.length === 0) {
    errors.push("colors is required and must be a non-empty array of { nameEn, nameAr, hexCode }");
  } else {
    const seenEn = new Set<string>();
    const seenAr = new Set<string>();
    const seenHex = new Set<string>();
    body.colors.forEach((c: any, idx: number) => {
      if (!c || typeof c !== "object") {
        errors.push(`colors[${idx}] must be an object`);
        return;
      }
      // support legacy {color} fallback -> map to nameEn
      const nameEn = c.nameEn ?? c.name_en ?? c.color;
      const nameAr = c.nameAr ?? c.name_ar;
      const hexCode = c.hexCode ?? c.hex_code ?? c.hex;

      if (typeof nameEn !== "string" || !nameEn.trim()) errors.push(`colors[${idx}].nameEn is required`);
      else if (nameEn.trim().length < 1 || nameEn.trim().length > 50) errors.push(`colors[${idx}].nameEn must be 1-50 chars`);
      else {
        const lower = nameEn.trim().toLowerCase();
        if (seenEn.has(lower)) errors.push(`colors[${idx}].nameEn "${nameEn}" is duplicate within product`);
        else seenEn.add(lower);
      }

      if (typeof nameAr !== "string" || !nameAr.trim()) errors.push(`colors[${idx}].nameAr is required`);
      else if (nameAr.trim().length < 1 || nameAr.trim().length > 50) errors.push(`colors[${idx}].nameAr must be 1-50 chars`);
      else {
        const key = nameAr.trim();
        if (seenAr.has(key)) errors.push(`colors[${idx}].nameAr "${nameAr}" is duplicate within product`);
        else seenAr.add(key);
      }

      if (typeof hexCode !== "string" || !hexCode.trim()) errors.push(`colors[${idx}].hexCode is required`);
      else if (!HEX_REGEX.test(hexCode.trim())) errors.push(`colors[${idx}].hexCode must match ^#[0-9A-Fa-f]{6}$ (e.g. #C67B90)`);
      else {
        const upper = hexCode.trim().toUpperCase();
        if (seenHex.has(upper)) errors.push(`colors[${idx}].hexCode "${hexCode}" is duplicate within product`);
        else seenHex.add(upper);
      }
    });
    if (body.colors.length > 20) errors.push("colors must contain at most 20 items");
  }

  // sizes required
  if (!Array.isArray(body.sizes) || body.sizes.length === 0) {
    errors.push("sizes is required and must be a non-empty array of { size, isAvailable } or size strings (S,M,L,XL)");
  } else {
    const seenSize = new Set<string>();
    const validSizes = Object.values(SizeEnum);
    body.sizes.forEach((s: any, idx: number) => {
      let sizeVal: string | undefined;
      let isAvailable: any = true;
      if (typeof s === "string") {
        sizeVal = s;
      } else if (s && typeof s === "object") {
        sizeVal = s.size ?? s.value;
        if (s.isAvailable !== undefined) isAvailable = s.isAvailable;
        if (s.is_available !== undefined) isAvailable = s.is_available;
      } else {
        errors.push(`sizes[${idx}] must be a string or object { size }`);
        return;
      }
      if (!sizeVal || typeof sizeVal !== "string") errors.push(`sizes[${idx}].size is required`);
      else if (!validSizes.includes(sizeVal as SizeEnum)) errors.push(`sizes[${idx}].size must be one of: ${validSizes.join(", ")}`);
      else {
        if (seenSize.has(sizeVal)) errors.push(`sizes[${idx}].size "${sizeVal}" is duplicate within product`);
        else seenSize.add(sizeVal);
      }
      if (isAvailable !== undefined && typeof isAvailable !== "boolean") {
        // allow 0/1 coercion but prefer boolean
        if (isAvailable !== 0 && isAvailable !== 1 && isAvailable !== "true" && isAvailable !== "false") {
          errors.push(`sizes[${idx}].isAvailable must be a boolean`);
        }
      }
    });
    if (body.sizes.length > 10) errors.push("sizes must contain at most 10 items");
  }

  // images optional
  if (body.images !== undefined && body.images !== null) {
    if (!Array.isArray(body.images)) errors.push("images must be an array of { imageUrl, sortOrder }");
    else {
      body.images.forEach((img: any, idx: number) => {
        if (!img || typeof img !== "object") {
          errors.push(`images[${idx}] must be an object`);
          return;
        }
        const url = img.imageUrl ?? img.image_url ?? img.url;
        if (typeof url !== "string" || !url.trim()) errors.push(`images[${idx}].imageUrl is required`);
        else if (url.length > 2000) errors.push(`images[${idx}].imageUrl too long`);
        if (img.sortOrder !== undefined && img.sort_order !== undefined) {
          const so = Number(img.sortOrder ?? img.sort_order);
          if (!Number.isInteger(so) || so < 0) errors.push(`images[${idx}].sortOrder must be a non-negative integer`);
        } else if (img.sortOrder !== undefined) {
          const so = Number(img.sortOrder);
          if (!Number.isInteger(so) || so < 0) errors.push(`images[${idx}].sortOrder must be a non-negative integer`);
        }
      });
      if (body.images.length > 20) errors.push("images must contain at most 20 items");
    }
  }

  if (errors.length > 0) {
    throw AppError.badRequest(errors);
  }

  // return normalized values
  const normalized: any = {};
  normalized.name = body.name.trim();
  if (categoryId !== undefined) normalized.categoryId = categoryId;
  else if (body.categorySlug) normalized.categorySlug = String(body.categorySlug).trim();
  else if (body.category_id) normalized.categoryId = Number(body.category_id);

  normalized.price = Number(body.price);
  normalized.oldPrice = body.oldPrice !== undefined && body.oldPrice !== null && body.oldPrice !== "" ? Number(body.oldPrice) : null;
  normalized.tag = body.tag ?? ProductTag.NONE;
  normalized.defaultShape = body.defaultShape ?? null;
  normalized.shortDescription = body.shortDescription ?? null;
  normalized.isActive = body.isActive !== undefined ? Boolean(body.isActive === "true" ? true : body.isActive === "false" ? false : body.isActive) : true;
  normalized.mainImageUrl = body.mainImageUrl ?? null;

  normalized.colors = body.colors.map((c: any) => ({
    nameEn: String(c.nameEn ?? c.name_en ?? c.color).trim(),
    nameAr: String(c.nameAr ?? c.name_ar).trim(),
    hexCode: String(c.hexCode ?? c.hex_code ?? c.hex).trim().toUpperCase(),
  }));

  normalized.sizes = body.sizes.map((s: any) => {
    if (typeof s === "string") return { size: s, isAvailable: true };
    return {
      size: String(s.size ?? s.value).trim(),
      isAvailable: s.isAvailable !== undefined ? Boolean(s.isAvailable === "true" ? true : s.isAvailable === "false" ? false : s.isAvailable) : s.is_available !== undefined ? Boolean(s.is_available) : true,
    };
  });

  normalized.images = Array.isArray(body.images)
    ? body.images.map((img: any, idx: number) => ({
        imageUrl: String(img.imageUrl ?? img.image_url ?? img.url).trim(),
        sortOrder: img.sortOrder !== undefined ? Number(img.sortOrder) : img.sort_order !== undefined ? Number(img.sort_order) : idx,
      }))
    : [];

  return normalized;
}

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = validateProductPayload(req.body);

  // resolve category
  let categoryId = data.categoryId as number | undefined;
  if (!categoryId && data.categorySlug) {
    const catRepo = AppDataSource.getRepository(Category);
    const cat = await catRepo.findOne({ where: { slug: data.categorySlug } });
    if (!cat) throw AppError.notFound(`Category with slug "${data.categorySlug}" not found`);
    categoryId = cat.id;
  }

  if (!categoryId) throw AppError.badRequest("categoryId or categorySlug is required");

  const categoryRepo = AppDataSource.getRepository(Category);
  const category = await categoryRepo.findOne({ where: { id: categoryId } });
  if (!category) throw AppError.notFound(`Category with id ${categoryId} not found`);

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const productRepo = queryRunner.manager.getRepository(Product);
    const colorRepo = queryRunner.manager.getRepository(ProductColor);
    const sizeRepo = queryRunner.manager.getRepository(ProductSize);
    const imageRepo = queryRunner.manager.getRepository(ProductImage);

    const product = productRepo.create({
      categoryId,
      name: data.name,
      tag: data.tag,
      mainImageUrl: data.mainImageUrl,
      defaultShape: data.defaultShape,
      price: data.price,
      oldPrice: data.oldPrice,
      shortDescription: data.shortDescription,
      isActive: data.isActive,
    });

    const savedProduct = await productRepo.save(product);

    // colors
    const colorEntities = data.colors.map((c: any) =>
      colorRepo.create({
        productId: savedProduct.id,
        nameEn: c.nameEn,
        nameAr: c.nameAr,
        hexCode: c.hexCode,
      })
    );
    await colorRepo.save(colorEntities);

    // sizes
    const sizeEntities = data.sizes.map((s: any) =>
      sizeRepo.create({
        productId: savedProduct.id,
        size: s.size,
        isAvailable: s.isAvailable,
      })
    );
    await sizeRepo.save(sizeEntities);

    // images
    if (data.images.length > 0) {
      const imageEntities = data.images.map((img: any) =>
        imageRepo.create({
          productId: savedProduct.id,
          imageUrl: img.imageUrl,
          sortOrder: img.sortOrder,
        })
      );
      await imageRepo.save(imageEntities);
      // if mainImageUrl not set but images exist, set first image as main
      if (!savedProduct.mainImageUrl && imageEntities.length > 0) {
        savedProduct.mainImageUrl = imageEntities[0].imageUrl;
        await productRepo.save(savedProduct);
      }
    }

    await queryRunner.commitTransaction();

    // reload with relations
    const fullProduct = await AppDataSource.getRepository(Product).findOne({
      where: { id: savedProduct.id },
      relations: { colors: true, sizes: true, images: true, category: true },
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: fullProduct,
      statusCode: 201,
    });
  } catch (err: any) {
    await queryRunner.rollbackTransaction();
    // handle unique violations for colors (per productId + nameEn/nameAr/hexCode)
    if (err?.code === "23505") {
      const detail = err?.detail as string | undefined;
      if (detail?.includes("name_en")) throw AppError.conflict("Duplicate color nameEn for this product");
      if (detail?.includes("name_ar")) throw AppError.conflict("Duplicate color nameAr for this product");
      if (detail?.includes("hex_code")) throw AppError.conflict("Duplicate color hexCode for this product");
      if (detail?.includes("UQ_product_sizes")) throw AppError.conflict("Duplicate size for this product");
      throw AppError.conflict("Duplicate product relation (color/size already exists for this product)");
    }
    if (err instanceof AppError) throw err;
    // handle check violation for hex
    if (err?.code === "23514" && err?.constraint?.includes("hex_code")) {
      throw AppError.badRequest("hexCode must match ^#[0-9A-Fa-f]{6}$");
    }
    throw err;
  } finally {
    await queryRunner.release();
  }
});

export const getAllProducts = asyncHandler(async (_req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Product);
  const products = await repo.find({ relations: { colors: true, sizes: true, images: true, category: true }, order: { id: "ASC" } as any });
  res.status(200).json({ success: true, message: "Operation completed successfully", data: products, statusCode: 200 });
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw AppError.badRequest("Invalid product id");
  const repo = AppDataSource.getRepository(Product);
  const product = await repo.findOne({ where: { id }, relations: { colors: true, sizes: true, images: true, category: true } });
  if (!product) throw AppError.notFound("Product not found");
  res.status(200).json({ success: true, message: "Operation completed successfully", data: product, statusCode: 200 });
});
