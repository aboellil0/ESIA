import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { testConnection } from "./config/db";

const PORT = Number(process.env.PORT) || 5000;

(async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
})();
