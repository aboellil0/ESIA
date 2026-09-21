import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();
import { DataSource } from "typeorm";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { ProductImage } from "../models/ProductImage";
import { ProductColor } from "../models/ProductColor";
import { ProductSize } from "../models/ProductSize";
import { User } from "../models/User";
import { Admin } from "../models/Admin";
import { Order } from "../models/Order";
import { OrderItem } from "../models/OrderItem";
import { Payment } from "../models/Payment";
import { RefreshToken } from "../models/RefreshToken";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL || undefined,
  host: process.env.DATABASE_URL ? undefined : (process.env.PGHOST || "localhost"),
  port: process.env.DATABASE_URL ? undefined : Number(process.env.PGPORT || 5432),
  username: process.env.DATABASE_URL ? undefined : (process.env.PGUSER || "postgres"),
  password: process.env.DATABASE_URL ? undefined : (process.env.PGPASSWORD || "postgres"),
  database: process.env.DATABASE_URL ? undefined : (process.env.PGDATABASE || "esia_db"),
  synchronize: false,
  logging: process.env.NODE_ENV === "development" ? false : false,
  entities: [Category, Product, ProductImage, ProductColor, ProductSize, User, Admin, Order, OrderItem, Payment, RefreshToken],
  migrations: [__dirname + "/../db/migrations/*.{ts,js}"],
  subscribers: [],
  // Disable SSL for internal Docker postgres (does not support SSL); enable only when explicitly requested via DB_SSL=true
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});