import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import { pool } from "../config/db";

async function migrate() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  console.log("Running schema.sql...");
  await pool.query(sql);
  console.log("Schema applied successfully");

  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log("Tables:", tables.rows.map((r:any)=>r.table_name).join(", "));

  const enums = await pool.query("SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname");
  console.log("Enums:", enums.rows.map((r:any)=>r.typname).join(", "));

  await pool.end();
}

migrate().catch(async (e)=>{
  console.error("Migrate failed:", e.message);
  await pool.end();
  process.exit(1);
});