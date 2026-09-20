import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();
import { AppDataSource } from "../config/data-source";

async function run() {
  console.log("Initializing DataSource...");
  await AppDataSource.initialize();
  console.log("Running migrations...");
  const migrations = await AppDataSource.runMigrations();
  console.log(`Executed ${migrations.length} migrations:`, migrations.map(m=>m.name).join(", ") || "none (already up to date)");
  const hasTables = await AppDataSource.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
  console.log("Tables:", hasTables.map((r:any)=>r.table_name).join(", "));
  await AppDataSource.destroy();
  console.log("Done");
}
run().catch(async e=>{ console.error("Migrate failed:", e); try{ await AppDataSource.destroy(); }catch{} process.exit(1); });