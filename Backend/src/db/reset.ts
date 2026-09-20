import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();
import { AppDataSource } from "../config/data-source";

async function reset() {
  await AppDataSource.initialize();
  console.log("Dropping all tables (synchronize drop)...");
  await AppDataSource.dropDatabase();
  console.log("Database dropped. Run npm run db:migrate to re-apply migrations.");
  await AppDataSource.destroy();
}
reset().catch(async e=>{ console.error(e); try{ await AppDataSource.destroy(); }catch{} process.exit(1); });