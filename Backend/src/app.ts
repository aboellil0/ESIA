import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import path from "path";
import { mongoSanitize } from "./middlewares/sanitize.middleware";
import { globalErrorHandler, notFoundHandler } from "./middlewares/error.middleware";
import router from "./routes";
import authRoutes from "./routes/auth.routes";

const app = express();

const allowedOrigins: string[] =
  process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim() !== ""
    ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
    : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin "${origin}" is not listed in FRONTEND_URL`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use(mongoSanitize);
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(hpp());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many authentication attempts from this IP, please try again after 1 minute" },
});

app.get("/", (_req, res) => {
  res.json({ message: "ESIA API is running", status: "ok" });
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});
app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/v1/auth", authLimiter, authRoutes);

app.use("/api", router);
app.use("/api/v1", router);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;