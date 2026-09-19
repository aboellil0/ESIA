import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.PGHOST || "localhost",
        port: Number(process.env.PGPORT) || 5432,
        database: process.env.PGDATABASE || "esia_db",
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "postgres",
      }
);

pool.on("connect", () => {
  console.log("Connected to PostgreSQL");
});

pool.on("error", (err: Error) => {
  console.error("PostgreSQL pool error:", err.message);
});

export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("DB Test - Current time:", result.rows[0].now);
    client.release();
    return true;
  } catch (err) {
    console.error("DB connection failed:", (err as Error).message);
    return false;
  }
};

export { pool };
export default pool;
