import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
import { AppDataSource } from "../config/data-source";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { ProductColor } from "../models/ProductColor";
import { ProductSize } from "../models/ProductSize";
import { ProductImage } from "../models/ProductImage";
import { Admin } from "../models/Admin";
import { Color } from "../models/Color";
import { ProductTag, DefaultShape, ProductSize as SizeEnum } from "../models/enums";
import bcrypt from "bcryptjs";

async function seed() {
  await AppDataSource.initialize();
  console.log("Seeding with TypeORM...");

  const catRepo = AppDataSource.getRepository(Category);
  const prodRepo = AppDataSource.getRepository(Product);
  const adminRepo = AppDataSource.getRepository(Admin);

  const catsData = [
    { name: "Dresses", slug: "dresses" },
    { name: "Bags", slug: "bags" },
    { name: "Accessories", slug: "accessories" },
  ];
  for (const c of catsData) {
    let exists = await catRepo.findOne({ where: { slug: c.slug } });
    if (!exists) {
      exists = catRepo.create(c);
      await catRepo.save(exists);
      console.log("Category created:", c.slug);
    }
  }

  // ─── Global color palette (/colors) - used by admin product creation ───
  // Idempotent: skips entries whose nameEn or hexCode already exists.
  const paletteData = [
    { nameEn: "black", nameAr: "أسود", hexCode: "#000000" },
    { nameEn: "white", nameAr: "أبيض", hexCode: "#FFFFFF" },
    { nameEn: "beige", nameAr: "بيج", hexCode: "#E3D3B8" },
    { nameEn: "pink", nameAr: "وردي", hexCode: "#C67B90" },
    { nameEn: "red", nameAr: "أحمر", hexCode: "#B03A48" },
    { nameEn: "navy", nameAr: "كحلي", hexCode: "#232F46" },
    { nameEn: "blue", nameAr: "أزرق", hexCode: "#2E6FA3" },
    { nameEn: "green", nameAr: "أخضر", hexCode: "#2E7D5B" },
    { nameEn: "brown", nameAr: "بني", hexCode: "#7B4B33" },
    { nameEn: "gold", nameAr: "ذهبي", hexCode: "#C9A227" },
  ];
  const colorRepo = AppDataSource.getRepository(Color);
  for (const c of paletteData) {
    const exists = await colorRepo.findOne({ where: [{ nameEn: c.nameEn }, { hexCode: c.hexCode }] });
    if (!exists) {
      await colorRepo.save(colorRepo.create(c));
      console.log("Color created:", c.nameEn, c.hexCode);
    }
  }

  // ─── Demo products with images from Frontend/public/assets (served as /assets/...) ───
  // Repairs the old "/assets/demo.jpg" placeholder (file never existed) and
  // fills products that have no images, so the storefront shows pictures.
  const imgRepo = AppDataSource.getRepository(ProductImage);
  const broken = await imgRepo.find({ where: { imageUrl: "/assets/demo.jpg" } });
  for (const b of broken) {
    b.imageUrl = "/assets/product-1/img-1.jpg";
    await imgRepo.save(b);
    console.log("Repaired broken demo image:", b.id);
  }

  const demoProducts = [
    {
      slug: "dresses", name: "Puff Sleeve Dress", tag: ProductTag.NEW,
      defaultShape: DefaultShape.PUFF_SLEEVES, price: 1299, oldPrice: 1599,
      shortDescription: "Demo dress - puff sleeves default shape",
      images: ["/assets/product-1/img-1.jpg", "/assets/product-1/img-2.jpg", "/assets/product-1/img-3.jpg"],
    },
    {
      slug: "bags", name: "Classic Handbag", tag: ProductTag.BEST_SELLER,
      defaultShape: null, price: 899, oldPrice: null,
      shortDescription: "Demo bag",
      images: ["/assets/product-2/img-1.jpg", "/assets/product-2/img-2.jpg"],
    },
    {
      slug: "accessories", name: "Elegant Scarf", tag: ProductTag.NONE,
      defaultShape: null, price: 299, oldPrice: 399,
      shortDescription: "Demo accessory",
      images: ["/assets/product-3/img-1.jpg", "/assets/product-3/img-2.jpg", "/assets/product-3/img-3.jpg"],
    },
  ];
  for (const d of demoProducts) {
    const cat = await catRepo.findOne({ where: { slug: d.slug } });
    if (!cat) continue;
    let product = await prodRepo.findOne({ where: { categoryId: cat.id } });
    if (!product) {
      const created = prodRepo.create({
        categoryId: cat.id,
        name: d.name,
        tag: d.tag,
        defaultShape: d.defaultShape,
        price: d.price,
        oldPrice: d.oldPrice,
        shortDescription: d.shortDescription,
        isActive: true,
        coverImageUrl: null,
      });
      const saved = await prodRepo.save(created);
      product = saved;
      console.log("Product created:", saved.id, d.name);

      const prodColorRepo = AppDataSource.getRepository(ProductColor);
      for (const c of [
        { nameEn: "pink", nameAr: "وردي", hexCode: "#C67B90" },
        { nameEn: "black", nameAr: "أسود", hexCode: "#000000" },
      ]) {
        const col = prodColorRepo.create({ productId: saved.id, nameEn: c.nameEn, nameAr: c.nameAr, hexCode: c.hexCode });
        await prodColorRepo.save(col);
      }
      const sizeRepo = AppDataSource.getRepository(ProductSize);
      for (const s of [SizeEnum.S, SizeEnum.M, SizeEnum.L]) {
        const sz = sizeRepo.create({ productId: saved.id, size: s, isAvailable: true });
        await sizeRepo.save(sz);
      }
      console.log("Product relations seeded for:", saved.id);
    } else {
      console.log("Product already exists, skipping:", d.name);
    }
    const imgCount = await imgRepo.count({ where: { productId: product.id } });
    if (imgCount === 0) {
      for (let i = 0; i < d.images.length; i++) {
        await imgRepo.save(imgRepo.create({ productId: product.id, imageUrl: d.images[i], sortOrder: i }));
      }
      console.log("Product images seeded for:", product.id);
    }
  }

  // ─── Admin from .env (ADMIN_EMAIL / ADMIN_PASSWORD) ───
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@esia.local").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const usingDefaultPassword = !process.env.ADMIN_PASSWORD;
  if (usingDefaultPassword) {
    console.warn(
      "WARNING: ADMIN_PASSWORD is not set - using default dev password. " +
      "Set ADMIN_PASSWORD in .env for production!"
    );
  }
  let admin = await adminRepo.findOne({ where: { email: adminEmail } });
  if (!admin) {
    const hash = await bcrypt.hash(adminPassword, 10);
    admin = adminRepo.create({ email: adminEmail, passwordHash: hash });
    await adminRepo.save(admin);
    console.log(`Admin created: ${adminEmail}`);
  } else if (process.env.ADMIN_PASSWORD && !(await bcrypt.compare(adminPassword, admin.passwordHash))) {
    // .env password changed -> rotate stored hash so login matches .env
    admin.passwordHash = await bcrypt.hash(adminPassword, 10);
    await adminRepo.save(admin);
    console.log(`Admin password updated from .env for: ${adminEmail}`);
  } else {
    console.log("Admin exists");
  }

  console.log("Seed done");
  await AppDataSource.destroy();
}
seed().catch(async e=>{ console.error(e); try{ await AppDataSource.destroy(); }catch{} process.exit(1); });