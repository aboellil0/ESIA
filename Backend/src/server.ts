import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { AppDataSource } from "./config/data-source";

const PORT = Number(process.env.PORT) || 5000;

(async () => {
  try {
    await AppDataSource.initialize();
    console.log("DataSource initialized (PostgreSQL + TypeORM)");
    // Run pending migrations automatically on startup (like Al Rouba seed pattern)
    const pending = await AppDataSource.runMigrations();
    if (pending.length) console.log(`Ran ${pending.length} migrations:`, pending.map(m=>m.name).join(", "));
    else console.log("No pending migrations");
  } catch (e) {
    console.error("DataSource init failed:", (e as Error).message);
    // fallback to allow server to start even if DB not ready - health will fail
  }
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
})();