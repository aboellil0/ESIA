import dotenv from "dotenv";
dotenv.config();
import { pool } from "../config/db";
async function reset(){
  console.log("Dropping schema public...");
  await pool.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
  console.log("Schema dropped. Run npm run db:migrate next");
  await pool.end();
}
reset().catch(async e=>{console.error(e); await pool.end(); process.exit(1);});