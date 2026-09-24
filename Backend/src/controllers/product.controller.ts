import { Request, Response } from "express";
import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Product } from "../models/Product";
import { ProductColor } from "../models/ProductColor";
import { ProductSize } from "../models/ProductSize";
import { ProductImage } from "../models/ProductImage";
import { Category } from "../models/Category";
import { ProductTag, DefaultShape, ProductSize as SizeEnum } from "../models/enums";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { deleteFile } from "../utils/fileUtils";

// ─── Al Rouba helpers: parse JSON-stringified arrays when coming via multipart/form-data ───
function tryParseJsonArray(val: any): any[] | null {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return null;
    // JSON array string: "[1,2]" or '[{"size":"M"}]'
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
        return [parsed];
      } catch {
        // fallback: try single-quoted JSON
        try {
          const parsed = JSON.parse(trimmed.replace(/'/g, '"'));
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    // comma-separated: "1,2,3" or "S,M,L"
    if (trimmed.includes(",")) return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    // single primitive
    return [trimmed];
  }
  return null;
}

// ─── Frontend-easy indexed image helper: image[0] file, image[0].isMain bool, image[0].url text ───
// Supports: image[0] (file), image[0].isMain, image[0].url, image[0].sortOrder, and same for images[0]
// Returns sorted array or null if no indexed pattern detected
function parseIndexedImages(body: any, files: Express.Multer.File[]): { imageUrl: string; isMain: boolean; sortOrder: number }[] | null {
  const map = new Map<number, { file?: Express.Multer.File; url?: string; isMain?: boolean; sortOrder?: number }>();
  const fileRegex = /^(?:image|images)\[(\d+)\](?:\.file)?$/;
  for (const f of files) {
    const m = f.fieldname.match(fileRegex);
    if (m) {
      const idx = Number(m[1]);
      if (!map.has(idx)) map.set(idx, {});
      map.get(idx)!.file = f;
    }
  }
  const keyRegex = /^(?:image|images)\[(\d+)\]\.(.+)$/;
  for (const key of Object.keys(body)) {
    const m = key.match(keyRegex);
    if (!m) continue;
    const idx = Number(m[1]);
    const prop = m[2];
    if (!map.has(idx)) map.set(idx, {});
    const entry = map.get(idx)!;
    const raw = body[key];
    const normProp = prop.toLowerCase().replace(/_/g, "");
    if (normProp === "ismain" || normProp === "ismainbool") {
      entry.isMain = raw === true || raw === "true" || raw === "1" || raw === 1;
    } else if (normProp === "url" || normProp === "imageurl") {
      if (typeof raw === "string" && raw.trim()) entry.url = raw.trim();
    } else if (normProp === "sortorder" || normProp === "order") {
      const n = Number(raw);
      if (!Number.isNaN(n) && Number.isInteger(n) && n >= 0) entry.sortOrder = n;
    }
  }
  if (map.size === 0) return null;
  const result: { imageUrl: string; isMain: boolean; sortOrder: number }[] = [];
  const sortedIdx = Array.from(map.keys()).sort((a, b) => a - b);
  for (const idx of sortedIdx) {
    const e = map.get(idx)!;
    let imageUrl: string | null = null;
    if (e.file) imageUrl = `/uploads/products/images/${e.file.filename}`;
    else if (e.url) imageUrl = e.url;
    else continue; // skip empty slot
    result.push({
      imageUrl,
      isMain: !!e.isMain,
      sortOrder: e.sortOrder !== undefined ? e.sortOrder : idx,
    });
  }
  if (result.length === 0) return null;
  // sort by sortOrder then idx, then re-normalize contiguous like Al Rouba
  result.sort((a, b) => a.sortOrder - b.sortOrder);
  return result.map((r, i) => ({ ...r, sortOrder: i }));
}

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

  // colors required — now array of existing ProductColor IDs (no DB change)
  // Supports both JSON array and multipart form-data JSON-stringified array (Al Rouba pattern: tryParse)
  // We keep product_colors table unchanged (id, product_id, name_en, name_ar, hex_code) and clone the
  // referenced palette rows for the new product inside the transaction.
  let colorsRaw: any = body.colors;
  const parsedColors = tryParseJsonArray(colorsRaw);
  if (parsedColors !== null) body.colors = parsedColors;
  if (!Array.isArray(body.colors) || body.colors.length === 0) {
    errors.push("colors is required and must be a non-empty array of existing ProductColor IDs (e.g. [1,2])");
  } else {
    if (body.colors.length > 20) errors.push("colors must contain at most 20 items");
    const seenIds = new Set<number>();
    body.colors.forEach((c: any, idx: number) => {
      const n = Number(c);
      if (c === null || c === undefined || c === "" || Number.isNaN(n) || !Number.isInteger(n) || n <= 0) {
        errors.push(`colors[${idx}] must be a positive integer ID (existing product_colors.id)`);
        return;
      }
      if (seenIds.has(n)) errors.push(`colors[${idx}] ID ${n} is duplicate within product`);
      else seenIds.add(n);
    });
  }

  // sizes required — also handle stringified JSON from multipart
  {
    const parsedSizes = tryParseJsonArray(body.sizes as any);
    if (parsedSizes !== null) body.sizes = parsedSizes;
  }
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

  // images optional — also handles multipart JSON string (Al Rouba: safeParse) and allows empty when files are uploaded
  // Now supports isMain per image for card display (is_main boolean)
  {
    if (typeof body.images === "string") {
      const trimmed = body.images.trim();
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          const parsed = JSON.parse(trimmed);
          body.images = Array.isArray(parsed) ? parsed : [parsed];
        } catch {}
      }
    }
  }
  if (body.images !== undefined && body.images !== null && body.images !== "") {
    if (!Array.isArray(body.images)) errors.push("images must be an array of { imageUrl, sortOrder, isMain }");
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
        if (img.isMain !== undefined && img.is_main !== undefined) {
          const v = img.isMain ?? img.is_main;
          if (typeof v !== "boolean" && v !== "true" && v !== "false" && v !== 0 && v !== 1) errors.push(`images[${idx}].isMain must be boolean`);
        } else if (img.isMain !== undefined) {
          const v = img.isMain;
          if (typeof v !== "boolean" && v !== "true" && v !== "false" && v !== 0 && v !== 1) errors.push(`images[${idx}].isMain must be boolean`);
        }
      });
      if (body.images.length > 20) errors.push("images must contain at most 20 items");
      const mainCount = body.images.filter((img: any) => img.isMain === true || img.isMain === "true" || img.is_main === true || img.is_main === "true" || img.isMain === 1).length;
      if (mainCount > 1) errors.push("Only one image can have isMain=true");
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

  normalized.colors = body.colors.map((c: any) => Number(c)); // array of ProductColor IDs

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
        isMain: img.isMain !== undefined ? Boolean(img.isMain === "true" ? true : img.isMain === "false" ? false : img.isMain) : img.is_main !== undefined ? Boolean(img.is_main === "true" ? true : img.is_main === "false" ? false : img.is_main) : false,
      }))
    : [];

  return normalized;
}

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  // ─── Collect uploaded files (multer) — supports legacy images/files + new indexed image[0] pattern for frontend ease ───
  const uploadedFiles: Express.Multer.File[] = (() => {
    const out: Express.Multer.File[] = [];
    if ((req as any).file) out.push((req as any).file as Express.Multer.File);
    const rf: any = (req as any).files;
    if (rf) {
      if (Array.isArray(rf)) out.push(...rf);
      else Object.values(rf).forEach((arr: any) => { if (Array.isArray(arr)) out.push(...(arr as Express.Multer.File[])); });
    }
    return out;
  })();

  // ─── Frontend-easy indexed image handling: image[0] file, image[0].isMain, image[0].url ───
  // If indexed pattern detected, pre-fill req.body.images so validation passes and merging uses indexed data directly
  const indexedForCreate = parseIndexedImages(req.body, uploadedFiles);
  if (indexedForCreate && indexedForCreate.length > 0) {
    // Inject as body.images for validateProductPayload (with isMain)
    (req.body as any).images = indexedForCreate;
    // Also ensure multipart fields like colors/sizes still parsed via tryParseJsonArray later
  }

  const uploadedImagesFromFiles = uploadedFiles
    .filter((f) => {
      // legacy fieldnames + indexed pattern
      if (["images", "files", "image", "media"].includes(f.fieldname)) return true;
      if (f.fieldname.startsWith("images") || f.fieldname.startsWith("image[")) return true;
      return false;
    })
    .filter((f) => f.mimetype.startsWith("image/"))
    .map((file, idx) => ({
      imageUrl: `/uploads/products/images/${file.filename}`,
      sortOrder: idx,
      isMain: false as boolean,
    }));

  const data = validateProductPayload(req.body);

  // Merge body images (JSON URLs) + uploaded files — supports both legacy and new indexed image[0] pattern
  // If indexed pattern was used, data.images already contains merged indexed result (files + urls + isMain), avoid double-counting legacy files
  const mergedImagesInput: { imageUrl: string; sortOrder: number; isMain: boolean }[] = (() => {
    if (indexedForCreate && indexedForCreate.length > 0) {
      // Indexed pattern: data.images is already the indexed result (with file URLs + isMain bool) — main determined solely by isMain
      const sorted = (data.images as any).sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((img: any, idx: number) => ({ ...img, sortOrder: idx }));
      const perImageMain = sorted.findIndex((img: any) => (img as any).isMain === true);
      const mainIdx = perImageMain !== -1 ? perImageMain : sorted.length > 0 ? 0 : null;
      return sorted.map((img: any, idx: number) => ({ imageUrl: img.imageUrl, sortOrder: idx, isMain: idx === mainIdx }));
    }
    const fromBody: { imageUrl: string; sortOrder: number; isMain: boolean }[] = (data.images as any) || [];
    const fromFiles: typeof fromBody = uploadedImagesFromFiles.map((fi, idx) => ({
      imageUrl: fi.imageUrl,
      sortOrder: fromBody.length + idx,
      isMain: false,
    }));
    const combined = [...fromBody, ...fromFiles];
    // Normalize to 0-based contiguous order but preserve isMain flags — main is solely per-image isMain bool
    const sorted = combined.sort((a, b) => a.sortOrder - b.sortOrder).map((img, idx) => ({ ...img, sortOrder: idx }));
    const perImageMain = sorted.findIndex((img) => (img as any).isMain === true);
    const mainIdx = perImageMain !== -1 ? perImageMain : sorted.length > 0 ? 0 : null;
    // Apply isMain: only mainIdx is true, rest false (ensures single main for card)
    return sorted.map((img, idx) => ({ imageUrl: img.imageUrl, sortOrder: idx, isMain: mainIdx !== null && idx === mainIdx }));
  })();
  // Override data.images with merged result for transaction
  (data as any).images = mergedImagesInput;
  (data as any)._uploadedFiles = uploadedFiles; // keep for error cleanup if needed

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

    // colors — resolve by IDs (no DB change): fetch palette rows and clone for new product
    const colorIds: number[] = data.colors as number[];
    const paletteColors = await colorRepo.find({ where: { id: In(colorIds) } });
    if (paletteColors.length !== colorIds.length) {
      const foundIds = new Set(paletteColors.map((pc) => pc.id));
      const missing = colorIds.filter((id) => !foundIds.has(id));
      throw AppError.badRequest(`colors contains non-existent ProductColor IDs: [${missing.join(", ")}]`);
    }
    // validate uniqueness of nameEn/nameAr/hexCode among selected palette (pre-empt DB unique violation per product)
    {
      const seenEn = new Set<string>();
      const seenAr = new Set<string>();
      const seenHex = new Set<string>();
      for (const pc of paletteColors) {
        const lowerEn = pc.nameEn.trim().toLowerCase();
        const keyAr = pc.nameAr.trim();
        const upperHex = pc.hexCode.trim().toUpperCase();
        if (seenEn.has(lowerEn)) throw AppError.badRequest(`Duplicate nameEn "${pc.nameEn}" among selected color IDs`);
        if (seenAr.has(keyAr)) throw AppError.badRequest(`Duplicate nameAr "${pc.nameAr}" among selected color IDs`);
        if (seenHex.has(upperHex)) throw AppError.badRequest(`Duplicate hexCode "${pc.hexCode}" among selected color IDs`);
        seenEn.add(lowerEn);
        seenAr.add(keyAr);
        seenHex.add(upperHex);
      }
    }
    // preserve input order
    const paletteMap = new Map<number, ProductColor>(paletteColors.map((pc) => [pc.id, pc]));
    const colorEntities = colorIds.map((id) => {
      const src = paletteMap.get(id)!;
      return colorRepo.create({
        productId: savedProduct.id,
        nameEn: src.nameEn,
        nameAr: src.nameAr,
        hexCode: src.hexCode,
      });
    });
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

    // images — with isMain for card display (outside show)
    if (data.images.length > 0) {
      const imageEntities = data.images.map((img: any) =>
        imageRepo.create({
          productId: savedProduct.id,
          imageUrl: img.imageUrl,
          sortOrder: img.sortOrder,
          isMain: !!img.isMain,
        })
      );
      await imageRepo.save(imageEntities);
      // mainImageUrl for quick card lookup: use isMain image, fallback to first (order 0) like Al Rouba
      const mainEntity = imageEntities.find((e: any) => (e as any).isMain) || imageEntities[0];
      if (mainEntity) {
        savedProduct.mainImageUrl = mainEntity.imageUrl;
        await productRepo.save(savedProduct);
      }
    } else if (data.mainImageUrl) {
      // No images rows but mainImageUrl supplied as external URL — keep it
      savedProduct.mainImageUrl = data.mainImageUrl;
      await productRepo.save(savedProduct);
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
    // Al Rouba best: on failure, delete any uploaded files that were already written to disk
    if (uploadedFiles.length > 0) {
      for (const f of uploadedFiles) {
        try { deleteFile(`/uploads/products/images/${f.filename}`); } catch {}
        // also try by path
        try { deleteFile(f.path); } catch {}
      }
    }
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

export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Product);
  const categoryRepo = AppDataSource.getRepository(Category);

  // ─── Filter by category (like Al Rouba division/category filter) — supports ?categoryId=1 or ?categorySlug=dresses or ?category=1|dresses|slug ───
  const q: any = req.query;
  let where: any = {};
  let categoryFilterActive = false;
  let categoryNotFound = false;

  const rawCategoryId = q.categoryId ?? q.category_id ?? q.category;
  const rawSlug = q.categorySlug ?? q.category_slug ?? q.slug;

  if (rawCategoryId !== undefined && rawCategoryId !== null && rawCategoryId !== "") {
    // if rawCategoryId is numeric string, treat as id; otherwise as slug
    const n = Number(rawCategoryId);
    if (Number.isInteger(n) && String(n) === String(rawCategoryId).trim()) {
      where.categoryId = n;
      categoryFilterActive = true;
    } else {
      // non-numeric -> treat value as slug (covers ?category=dresses)
      const slug = String(rawCategoryId).trim().toLowerCase();
      const cat = await categoryRepo.findOne({ where: { slug } });
      if (!cat) categoryNotFound = true;
      else {
        where.categoryId = cat.id;
        categoryFilterActive = true;
      }
    }
  } else if (rawSlug !== undefined && rawSlug !== null && rawSlug !== "") {
    const slug = String(rawSlug).trim().toLowerCase();
    const cat = await categoryRepo.findOne({ where: { slug } });
    if (!cat) categoryNotFound = true;
    else {
      where.categoryId = cat.id;
      categoryFilterActive = true;
    }
  }

  if (categoryNotFound) {
    res.status(200).json({ success: true, message: "Operation completed successfully", data: [], statusCode: 200 });
    return;
  }

  const products = await repo.find({
    where: categoryFilterActive ? where : {},
    relations: { colors: true, sizes: true, images: true, category: true },
    order: { id: "ASC" } as any,
  });
  // List view: only main image + basics for card (outside show) — details endpoint returns all images
  const listData = products.map((p) => {
    if (p.images) p.images.sort((a, b) => a.sortOrder - b.sortOrder);
    const mainImg = p.images?.find((img: any) => img.isMain) || p.images?.[0] || null;
    // Basic card payload — keep light for frontend grid
    return {
      id: p.id,
      name: p.name,
      categoryId: p.categoryId,
      category: p.category ? { id: (p.category as any).id, name: (p.category as any).name, slug: (p.category as any).slug } : null,
      price: p.price,
      oldPrice: p.oldPrice,
      tag: p.tag,
      isActive: p.isActive,
      mainImageUrl: p.mainImageUrl || (mainImg ? mainImg.imageUrl : null),
      mainImage: mainImg ? { id: mainImg.id, imageUrl: mainImg.imageUrl, sortOrder: mainImg.sortOrder, isMain: (mainImg as any).isMain } : null,
      // For list we return only main image in images array to keep payload light (details has all)
      images: mainImg ? [mainImg] : [],
      colors: p.colors,
      createdAt: (p as any).createdAt,
    };
  });
  res.status(200).json({ success: true, message: "Operation completed successfully", data: listData, statusCode: 200 });
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw AppError.badRequest("Invalid product id");
  const repo = AppDataSource.getRepository(Product);
  const product = await repo.findOne({ where: { id }, relations: { colors: true, sizes: true, images: true, category: true } });
  if (!product) throw AppError.notFound("Product not found");
  // Al Rouba best: sort images by order and expose hasImages flag, main is order 0
  if (product.images) product.images.sort((a, b) => a.sortOrder - b.sortOrder);
  res.status(200).json({ success: true, message: "Operation completed successfully", data: product, statusCode: 200 });
});

// ─── Al Rouba best scenarios: media management after creation ───
// Add images to existing product (like ProductService.addMedia)
export const addProductImages = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw AppError.badRequest("Invalid product id");

  const uploadedFiles: Express.Multer.File[] = (() => {
    const out: Express.Multer.File[] = [];
    if ((req as any).file) out.push((req as any).file as Express.Multer.File);
    const rf: any = (req as any).files;
    if (rf) {
      if (Array.isArray(rf)) out.push(...rf);
      else Object.values(rf).forEach((arr: any) => { if (Array.isArray(arr)) out.push(...(arr as Express.Multer.File[])); });
    }
    return out;
  })();

  // ─── Frontend-easy indexed pattern: image[0] + image[0].isMain + image[0].url — isMain bool is the ONLY main selector ───
  const indexedAdd = parseIndexedImages(req.body, uploadedFiles);
  let newImagesInput: { imageUrl: string; sortOrder?: number; isMain?: boolean }[] = [];
  if (indexedAdd && indexedAdd.length > 0) {
    newImagesInput = indexedAdd;
    if (((req.body as any).isMain === "true" || (req.body as any).isMain === true || (req.body as any).makeMain === "true" || (req.body as any).main === "true") && !newImagesInput.some((i) => i.isMain)) {
      newImagesInput[0].isMain = true;
    }
  } else {
    const imageFiles = uploadedFiles.filter((f) => f.mimetype.startsWith("image/"));
    // also allow body-provided URLs (external or already uploaded) via images array — supports isMain for card
    let bodyImages: { imageUrl: string; sortOrder?: number; isMain?: boolean }[] = [];
    if (req.body.images) {
      const parsed = tryParseJsonArray(req.body.images) ?? (Array.isArray(req.body.images) ? req.body.images : null);
      if (parsed) {
        bodyImages = parsed.map((img: any, idx: number) => {
          if (typeof img === "string") return { imageUrl: img, sortOrder: idx, isMain: false };
          const isMain = img.isMain !== undefined ? Boolean(img.isMain === "true" ? true : img.isMain === "false" ? false : img.isMain) : img.is_main !== undefined ? Boolean(img.is_main) : false;
          return { imageUrl: String(img.imageUrl ?? img.image_url ?? img.url).trim(), sortOrder: img.sortOrder ?? idx, isMain };
        });
      } else if (Array.isArray(req.body.images)) {
        bodyImages = req.body.images;
      }
    }
    // also support single imageUrl field
    if (req.body.imageUrl && typeof req.body.imageUrl === "string") {
      bodyImages.push({ imageUrl: req.body.imageUrl.trim(), sortOrder: bodyImages.length, isMain: req.body.isMain === "true" || req.body.isMain === true });
    }

    const fileImages = imageFiles.map((file, idx) => ({ imageUrl: `/uploads/products/images/${file.filename}`, sortOrder: 0, isMain: false }));
    newImagesInput = [...bodyImages, ...fileImages];
    if (newImagesInput.length === 0) throw AppError.badRequest("No image files or imageUrl provided");
  // also handle body-level isMain/makeMain flag for file add
  if (req.body.isMain === "true" || req.body.isMain === true || req.body.makeMain === "true" || req.body.main === "true") {
    // make first new image main if none already marked
    if (!newImagesInput.some((i) => i.isMain)) {
      newImagesInput[0].isMain = true;
    }
  }
  } // end else (non-indexed legacy path)

  const productRepo = AppDataSource.getRepository(Product);
  const imageRepo = AppDataSource.getRepository(ProductImage);

  const product = await productRepo.findOne({ where: { id }, relations: { images: true } });
  if (!product) {
    // cleanup uploaded files on failure
    for (const f of uploadedFiles.filter((x) => x.mimetype.startsWith("image/"))) {
      try { deleteFile(`/uploads/products/images/${f.filename}`); } catch {}
      try { deleteFile((f as any).path); } catch {}
    }
    throw AppError.notFound("Product not found");
  }

  // If any new image is marked as main, clear existing mains (partial unique index)
  const wantsMain = newImagesInput.some((i) => i.isMain);
  if (wantsMain) {
    await imageRepo.createQueryBuilder().update().set({ isMain: false }).where("product_id = :pid AND is_main = true", { pid: id }).execute();
    // also clear in-memory for consistency
    for (const img of product.images) (img as any).isMain = false;
  }

  const nextOrder = product.images.length > 0 ? Math.max(...product.images.map((i) => i.sortOrder)) + 1 : 0;
  const entities = newImagesInput.map((img, idx) =>
    imageRepo.create({ productId: id, imageUrl: img.imageUrl, sortOrder: nextOrder + idx, isMain: !!img.isMain })
  );
  await imageRepo.save(entities);

  // mainImageUrl for card: use isMain image if exists, else first order 0
  const mainFromNew = entities.find((e) => (e as any).isMain);
  if (mainFromNew) {
    product.mainImageUrl = mainFromNew.imageUrl;
    await productRepo.save(product);
  } else if (!product.mainImageUrl) {
    const first = [...product.images, ...entities].sort((a, b) => a.sortOrder - b.sortOrder)[0];
    if (first) {
      product.mainImageUrl = first.imageUrl;
      await productRepo.save(product);
    }
  }

  const updated = await productRepo.findOne({ where: { id }, relations: { colors: true, sizes: true, images: true, category: true } });
  if (updated?.images) updated.images.sort((a, b) => a.sortOrder - b.sortOrder);
  res.status(200).json({ success: true, message: "Images added successfully", data: updated, statusCode: 200 });
});

// Remove image by its sort_order (or id) — mirrors Al Rouba removeMedia by order
export const removeProductImage = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw AppError.badRequest("Invalid product id");
  // allow order via params or body: DELETE /:id/images/:order  or body { order, imageId }
  const rawOrder = (req.params as any).order ?? (req.params as any).imageId ?? req.body.order ?? req.body.sortOrder ?? req.body.imageId;
  if (rawOrder === undefined || rawOrder === null) throw AppError.badRequest("order or imageId is required");
  const parsedOrder = Number(rawOrder);
  if (Number.isNaN(parsedOrder)) throw AppError.badRequest("order must be a number");

  const productRepo = AppDataSource.getRepository(Product);
  const imageRepo = AppDataSource.getRepository(ProductImage);

  const product = await productRepo.findOne({ where: { id }, relations: { images: true } });
  if (!product) throw AppError.notFound("Product not found");

  // try find by sortOrder first, then by id
  let target = product.images.find((img) => img.sortOrder === parsedOrder);
  if (!target) target = product.images.find((img) => img.id === parsedOrder);
  if (!target) throw AppError.notFound(`No image found with order/id ${parsedOrder}`);

  const wasMain = (target as any).isMain === true || product.mainImageUrl === target.imageUrl;
  deleteFile(target.imageUrl);
  await imageRepo.remove(target);

  // re-normalize remaining orders to 0,1,2... like Al Rouba
  const remaining = (await imageRepo.find({ where: { productId: id }, order: { sortOrder: "ASC" } }));
  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].sortOrder !== i) {
      remaining[i].sortOrder = i;
      await imageRepo.save(remaining[i]);
    }
  }

  // ensure exactly one isMain for card display if any images remain
  if (remaining.length > 0) {
    const hasMain = remaining.some((r) => (r as any).isMain);
    if (!hasMain || wasMain) {
      // if removed was main or no main remains, promote first remaining as main
      const first = remaining.sort((a, b) => a.sortOrder - b.sortOrder)[0];
      if (first) {
        // clear others
        await imageRepo.createQueryBuilder().update().set({ isMain: false }).where("product_id = :pid", { pid: id }).execute();
        first.isMain = true as any;
        await imageRepo.save(first);
        product.mainImageUrl = first.imageUrl;
        await productRepo.save(product);
      }
    }
  } else {
    product.mainImageUrl = null;
    await productRepo.save(product);
  }
  // if removed was mainImageUrl but remaining already has new main, ensure mainImageUrl synced
  if (wasMain && remaining.length > 0 && product.mainImageUrl === target.imageUrl) {
    const newMain = remaining.find((r) => (r as any).isMain) || remaining[0];
    if (newMain) {
      product.mainImageUrl = newMain.imageUrl;
      await productRepo.save(product);
    }
  }

  const updated = await productRepo.findOne({ where: { id }, relations: { colors: true, sizes: true, images: true, category: true } });
  if (updated?.images) updated.images.sort((a, b) => a.sortOrder - b.sortOrder);
  res.status(200).json({ success: true, message: "Image removed successfully", data: updated, statusCode: 200 });
});

// Reorder images — mirrors Al Rouba reorderMedia (currentOrder -> newOrder)
export const reorderProductImages = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw AppError.badRequest("Invalid product id");
  const { currentOrder, newOrder } = req.body;
  if (currentOrder === undefined || newOrder === undefined) throw AppError.badRequest("currentOrder and newOrder are required");
  const parsedCurrent = Number(currentOrder);
  const parsedNew = Number(newOrder);
  if (Number.isNaN(parsedCurrent) || Number.isNaN(parsedNew)) throw AppError.badRequest("currentOrder and newOrder must be numbers");

  const productRepo = AppDataSource.getRepository(Product);
  const imageRepo = AppDataSource.getRepository(ProductImage);

  const product = await productRepo.findOne({ where: { id }, relations: { images: true } });
  if (!product) throw AppError.notFound("Product not found");

  const item = product.images.find((img) => img.sortOrder === parsedCurrent);
  if (!item) throw AppError.notFound(`No image found with order ${parsedCurrent}`);
  if (parsedNew === parsedCurrent) {
    if (product.images) product.images.sort((a, b) => a.sortOrder - b.sortOrder);
    res.status(200).json({ success: true, message: "Operation completed successfully", data: product, statusCode: 200 });
    return;
  }

  // shift like Al Rouba
  if (parsedNew > parsedCurrent) {
    for (const img of product.images) {
      if (img.sortOrder > parsedCurrent && img.sortOrder <= parsedNew) {
        img.sortOrder -= 1;
        await imageRepo.save(img);
      }
    }
  } else {
    for (const img of product.images) {
      if (img.sortOrder >= parsedNew && img.sortOrder < parsedCurrent) {
        img.sortOrder += 1;
        await imageRepo.save(img);
      }
    }
  }
  item.sortOrder = parsedNew;
  await imageRepo.save(item);

  // Keep mainImageUrl synced to isMain image for card (not order 0). Do not auto-change main on reorder unless isMain was moved
  // Find isMain image (if any) else fallback to order 0
  const allForMain = await imageRepo.find({ where: { productId: id }, order: { sortOrder: "ASC" } });
  const isMainImg = allForMain.find((img) => (img as any).isMain) || allForMain[0];
  if (isMainImg && product.mainImageUrl !== isMainImg.imageUrl) {
    product.mainImageUrl = isMainImg.imageUrl;
    await productRepo.save(product);
  }

  const updated = await productRepo.findOne({ where: { id }, relations: { colors: true, sizes: true, images: true, category: true } });
  if (updated?.images) updated.images.sort((a, b) => a.sortOrder - b.sortOrder);
  res.status(200).json({ success: true, message: "Images reordered successfully", data: updated, statusCode: 200 });
});

// Set main image for card display — isMain attribute (outside card show)
export const setMainProductImage = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw AppError.badRequest("Invalid product id");
  const { imageId, order, sortOrder } = req.body;
  const raw = imageId ?? order ?? sortOrder ?? req.params.order ?? (req.params as any).imageId;
  if (raw === undefined || raw === null) throw AppError.badRequest("imageId or order is required");
  const n = Number(raw);
  if (Number.isNaN(n)) throw AppError.badRequest("imageId/order must be a number");

  const productRepo = AppDataSource.getRepository(Product);
  const imageRepo = AppDataSource.getRepository(ProductImage);
  const product = await productRepo.findOne({ where: { id }, relations: { images: true } });
  if (!product) throw AppError.notFound("Product not found");

  let target = product.images.find((img) => img.id === n);
  if (!target) target = product.images.find((img) => img.sortOrder === n);
  if (!target) throw AppError.notFound(`No image found with id/order ${n}`);

  // Clear existing mains and set target as main (partial unique ensures one main)
  await imageRepo.createQueryBuilder().update().set({ isMain: false }).where("product_id = :pid", { pid: id }).execute();
  target.isMain = true as any;
  await imageRepo.save(target);

  product.mainImageUrl = target.imageUrl;
  await productRepo.save(product);

  const updated = await productRepo.findOne({ where: { id }, relations: { colors: true, sizes: true, images: true, category: true } });
  if (updated?.images) updated.images.sort((a, b) => a.sortOrder - b.sortOrder);
  res.status(200).json({ success: true, message: "Main image set successfully", data: updated, statusCode: 200 });
});
