import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();
import { AppDataSource } from "../config/data-source";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { ProductColor } from "../models/ProductColor";
import { ProductSize } from "../models/ProductSize";
import { ProductImage } from "../models/ProductImage";
import { Admin } from "../models/Admin";
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

  const dressCat = await catRepo.findOne({ where: { slug: "dresses" } });
  if (dressCat) {
    const existing = await prodRepo.findOne({ where: { categoryId: dressCat.id } });
    if (!existing) {
      const product = prodRepo.create({
        categoryId: dressCat.id,
        name: "Puff Sleeve Dress",
        tag: ProductTag.NEW,
        defaultShape: DefaultShape.PUFF_SLEEVES,
        price: 1299,
        oldPrice: 1599,
        shortDescription: "Demo dress - puff sleeves default shape",
        isActive: true,
        mainImageUrl: null,
      });
      const saved = await prodRepo.save(product);
      console.log("Product created:", saved.id);

      const colorRepo = AppDataSource.getRepository(ProductColor);
      for (const c of [
        { nameEn: "pink", nameAr: "وردي", hexCode: "#C67B90" },
        { nameEn: "black", nameAr: "أسود", hexCode: "#000000" },
      ]) {
        const col = colorRepo.create({ productId: saved.id, nameEn: c.nameEn, nameAr: c.nameAr, hexCode: c.hexCode });
        await colorRepo.save(col);
      }
      const sizeRepo = AppDataSource.getRepository(ProductSize);
      for (const s of [SizeEnum.S, SizeEnum.M, SizeEnum.L]) {
        const sz = sizeRepo.create({ productId: saved.id, size: s, isAvailable: true });
        await sizeRepo.save(sz);
      }
      const imgRepo = AppDataSource.getRepository(ProductImage);
      const img = imgRepo.create({ productId: saved.id, imageUrl: "/assets/demo.jpg", sortOrder: 0 });
      await imgRepo.save(img);
      console.log("Product relations seeded");
    } else {
      console.log("Product already exists, skipping");
    }
  }

  let admin = await adminRepo.findOne({ where: { email: "admin@esia.local" } });
  if (!admin) {
    const hash = await bcrypt.hash("Admin123!", 10);
    admin = adminRepo.create({ email: "admin@esia.local", passwordHash: hash });
    await adminRepo.save(admin);
    console.log("Admin created: admin@esia.local / Admin123!");
  } else {
    console.log("Admin exists");
  }

  console.log("Seed done");
  await AppDataSource.destroy();
}
seed().catch(async e=>{ console.error(e); try{ await AppDataSource.destroy(); }catch{} process.exit(1); });