import dotenv from "dotenv";
dotenv.config();
import { pool } from "../config/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding minimal data...");
  const cats = [
    { name: "Dresses", slug: "dresses" },
    { name: "Bags", slug: "bags" },
    { name: "Accessories", slug: "accessories" },
  ];
  for (const c of cats) {
    await pool.query(`INSERT INTO categories (name, slug) VALUES ($1,$2) ON CONFLICT (slug) DO NOTHING`, [c.name, c.slug]);
  }
  const { rows: [dressCat] } = await pool.query(`SELECT id FROM categories WHERE slug='dresses'`);
  if (dressCat) {
    const { rows: existing } = await pool.query(`SELECT id FROM products WHERE category_id=$1 LIMIT 1`, [dressCat.id]);
    if (existing.length===0) {
      const { rows: [prod] } = await pool.query(`
        INSERT INTO products (category_id, name, tag, default_shape, price, old_price, short_description, is_active)
        VALUES ($1,'Puff Sleeve Dress','new','puff_sleeves',1299,1599,'Demo dress',true) RETURNING id
      `, [dressCat.id]);
      await pool.query(`INSERT INTO product_colors (product_id, hex_code) VALUES ($1,'#C67B90'),($1,'#000000') ON CONFLICT DO NOTHING`, [prod.id]);
      await pool.query(`INSERT INTO product_sizes (product_id, size) VALUES ($1,'S'),($1,'M'),($1,'L') ON CONFLICT DO NOTHING`, [prod.id]);
      await pool.query(`INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1,'/assets/demo.jpg',0)`, [prod.id]);
      console.log("Sample product created", prod.id);
    }
  }
  const adminEmail = "admin@esia.local";
  const { rows: adminExists } = await pool.query(`SELECT id FROM admins WHERE email=$1`, [adminEmail]);
  if (adminExists.length===0) {
    const hash = await bcrypt.hash("Admin123!", 10);
    await pool.query(`INSERT INTO admins (email, password_hash) VALUES ($1,$2)`, [adminEmail, hash]);
    console.log("Admin created:", adminEmail, "/ Admin123!");
  }
  console.log("Seed done");
  await pool.end();
}
seed().catch(async e=>{ console.error(e); await pool.end(); process.exit(1); });