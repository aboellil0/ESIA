import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
import { AppDataSource } from "../config/data-source";
import { Category } from "../models/Category";
import { Admin } from "../models/Admin";
import { Color } from "../models/Color";
import bcrypt from "bcryptjs";

async function seed() {
  await AppDataSource.initialize();
  console.log("Seeding with TypeORM...");

  const catRepo = AppDataSource.getRepository(Category);
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

  // NOTE: no demo products are seeded - products (and their /uploads/ images)
  // are created manually via the admin panel only.

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