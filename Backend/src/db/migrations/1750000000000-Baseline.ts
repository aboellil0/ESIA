import { MigrationInterface, QueryRunner } from "typeorm";

// Single squashed baseline for the whole schema (replaces migrations
// 1710000000000..1710000000010). Idempotent: safe on fresh databases and on
// existing ones (guards every object, backfills new NOT NULL columns).
export class Baseline1750000000000 implements MigrationInterface {
  name = "Baseline1750000000000";

  private async hasType(q: QueryRunner, name: string): Promise<boolean> {
    const r: any[] = await q.query(`SELECT 1 FROM pg_type WHERE typname='${name}'`);
    return r.length > 0;
  }

  private async enumValues(q: QueryRunner, name: string): Promise<string[]> {
    const r: any[] = await q.query(
      `SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname='${name}'`
    );
    return r.map((x) => x.enumlabel);
  }

  private async ensureType(q: QueryRunner, name: string, values: string[]): Promise<void> {
    if (!(await this.hasType(q, name))) {
      await q.query(`CREATE TYPE "public"."${name}" AS ENUM(${values.map((v) => `'${v}'`).join(", ")})`);
    }
  }

  private async hasConstraint(q: QueryRunner, name: string): Promise<boolean> {
    const r: any[] = await q.query(`SELECT 1 FROM pg_constraint WHERE conname='${name}'`);
    return r.length > 0;
  }

  private async addColumn(
    q: QueryRunner, table: string, column: string, ddl: string, backfill?: string, setNotNull?: boolean
  ): Promise<void> {
    if (await q.hasColumn(table, column)) return;
    await q.query(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${ddl}`);
    if (backfill) await q.query(backfill);
    if (setNotNull) await q.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" SET NOT NULL`);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── enum types ───
    await this.ensureType(queryRunner, "product_tag", ["none", "new", "best_seller"]);
    await this.ensureType(queryRunner, "default_shape", ["puff_sleeves", "layers", "bow", "long", "abaya", "circular"]);
    await this.ensureType(queryRunner, "product_size", ["S", "M", "L", "XL"]);
    await this.ensureType(queryRunner, "payment_status", ["not_submitted", "submitted", "verified", "rejected"]);
    await this.ensureType(queryRunner, "payment_method", ["vodafone_cash", "etisalat_cash", "orange_money", "bank_transfer", "instapay", "fawry", "other"]);
    await this.ensureType(queryRunner, "user_token_type", ["email_verification", "password_reset"]);
    // order_status must also carry pending_payment (used for paid orders).
    // ALTER TYPE ... ADD VALUE cannot run in a transaction, so backfill it
    // transactionally via a type swap when the value is missing.
    if (!(await this.hasType(queryRunner, "order_status"))) {
      await queryRunner.query(`CREATE TYPE "public"."order_status" AS ENUM('pending', 'pending_payment', 'accepted', 'rejected', 'shipped', 'delivered', 'cancelled')`);
    } else if (!(await this.enumValues(queryRunner, "order_status")).includes("pending_payment")) {
      await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT`);
      await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" TYPE text`);
      await queryRunner.query(`DROP TYPE "public"."order_status"`);
      await queryRunner.query(`CREATE TYPE "public"."order_status" AS ENUM('pending', 'pending_payment', 'accepted', 'rejected', 'shipped', 'delivered', 'cancelled')`);
      await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."order_status" USING "status"::"public"."order_status"`);
      await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'`);
    }

    // ─── categories ───
    if (!(await queryRunner.hasTable("categories"))) {
      await queryRunner.query(`CREATE TABLE "categories" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "slug" character varying(120) NOT NULL, CONSTRAINT "UQ_categories_name" UNIQUE ("name"), CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"), CONSTRAINT "PK_categories" PRIMARY KEY ("id"))`);
    }

    // ─── users ───
    if (!(await queryRunner.hasTable("users"))) {
      await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying(150) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" text NOT NULL, "phone" character varying(20), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "is_verified" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_users_email" UNIQUE ("email"), CONSTRAINT "PK_users" PRIMARY KEY ("id"))`);
    } else {
      await this.addColumn(queryRunner, "users", "is_verified", "boolean NOT NULL DEFAULT false");
    }

    // ─── admins ───
    if (!(await queryRunner.hasTable("admins"))) {
      await queryRunner.query(`CREATE TABLE "admins" ("id" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "password_hash" text NOT NULL, CONSTRAINT "UQ_admins_email" UNIQUE ("email"), CONSTRAINT "PK_admins" PRIMARY KEY ("id"))`);
    }

    // ─── products ───
    if (!(await queryRunner.hasTable("products"))) {
      await queryRunner.query(`CREATE TABLE "products" ("id" SERIAL NOT NULL, "category_id" integer NOT NULL, "name" character varying(200) NOT NULL, "tag" "public"."product_tag" NOT NULL DEFAULT 'none', "main_image_url" text, "default_shape" "public"."default_shape", "price" numeric(10,2) NOT NULL, "old_price" numeric(10,2), "short_description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_products" PRIMARY KEY ("id"))`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_category" ON "products" ("category_id")`);
      await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_products_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    // ─── product_images ───
    if (!(await queryRunner.hasTable("product_images"))) {
      await queryRunner.query(`CREATE TABLE "product_images" ("id" SERIAL NOT NULL, "product_id" integer NOT NULL, "image_url" text NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "is_main" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_product_images" PRIMARY KEY ("id"))`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_product_images_product" ON "product_images" ("product_id")`);
      await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_product_images_main" ON "product_images" ("product_id") WHERE "is_main" = true`);
      await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_images_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    } else {
      await this.addColumn(queryRunner, "product_images", "is_main", "boolean NOT NULL DEFAULT false");
      await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_product_images_main" ON "product_images" ("product_id") WHERE "is_main" = true`);
    }

    // ─── product_colors ───
    if (!(await queryRunner.hasTable("product_colors"))) {
      await queryRunner.query(`CREATE TABLE "product_colors" ("id" SERIAL NOT NULL, "product_id" integer NOT NULL, "name_en" character varying(50) NOT NULL, "name_ar" character varying(50) NOT NULL, "hex_code" character varying(7) NOT NULL, CONSTRAINT "PK_product_colors" PRIMARY KEY ("id"), CONSTRAINT "CHK_product_colors_hex_code" CHECK ("hex_code" ~ '^#[0-9A-Fa-f]{6}$'))`);
      await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_product_colors_name_en" ON "product_colors" ("product_id", "name_en")`);
      await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_product_colors_name_ar" ON "product_colors" ("product_id", "name_ar")`);
      await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_product_colors_hex_code" ON "product_colors" ("product_id", "hex_code")`);
      await queryRunner.query(`ALTER TABLE "product_colors" ADD CONSTRAINT "FK_colors_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    // ─── product_sizes ───
    if (!(await queryRunner.hasTable("product_sizes"))) {
      await queryRunner.query(`CREATE TABLE "product_sizes" ("id" SERIAL NOT NULL, "product_id" integer NOT NULL, "size" "public"."product_size" NOT NULL, "is_available" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_product_sizes" PRIMARY KEY ("id"))`);
      await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_product_sizes" ON "product_sizes" ("product_id", "size")`);
      await queryRunner.query(`ALTER TABLE "product_sizes" ADD CONSTRAINT "FK_sizes_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    // ─── colors (global palette) ───
    if (!(await queryRunner.hasTable("colors"))) {
      await queryRunner.query(`CREATE TABLE "colors" ("id" SERIAL NOT NULL, "name_en" character varying(50) NOT NULL, "name_ar" character varying(50) NOT NULL, "hex_code" character varying(7) NOT NULL, CONSTRAINT "PK_colors_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_colors_name_en" UNIQUE ("name_en"), CONSTRAINT "UQ_colors_name_ar" UNIQUE ("name_ar"), CONSTRAINT "UQ_colors_hex_code" UNIQUE ("hex_code"), CONSTRAINT "CHK_colors_hex_code" CHECK ("hex_code" ~ '^#[0-9A-Fa-f]{6}$'))`);
    }

    // ─── orders (full shape incl. payment/tracking) ───
    if (!(await queryRunner.hasTable("orders"))) {
      await queryRunner.query(`CREATE TABLE "orders" ("id" SERIAL NOT NULL, "order_number" character varying(30) NOT NULL, "user_id" integer, "customer_name" character varying(150) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(20) NOT NULL, "address" text NOT NULL, "city" character varying(100), "status" "public"."order_status" NOT NULL DEFAULT 'pending', "total_amount" numeric(10,2) NOT NULL, "tracking_number" character varying(50), "notes" text, "payment_status" "public"."payment_status" NOT NULL DEFAULT 'not_submitted', "payment_method" "public"."payment_method", "sender_name" character varying(150), "sender_account" character varying(100), "sender_number" character varying(30), "proof_image_url" text, "payment_amount" numeric(10,2), "payment_notes" text, "payment_submitted_at" TIMESTAMPTZ, "payment_verified_at" TIMESTAMPTZ, "payment_verified_by" integer, "rejection_reason" text, "reviewed_by" integer, "reviewed_at" TIMESTAMPTZ, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_orders_number" UNIQUE ("order_number"), CONSTRAINT "UQ_orders_tracking" UNIQUE ("tracking_number"), CONSTRAINT "PK_orders" PRIMARY KEY ("id"))`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_status" ON "orders" ("status")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_email" ON "orders" ("email")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_payment_status" ON "orders" ("payment_status")`);
      await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
      await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_admin" FOREIGN KEY ("reviewed_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    } else {
      await this.addColumn(queryRunner, "orders", "tracking_number", "character varying(50)");
      if (!(await this.hasConstraint(queryRunner, "UQ_orders_tracking"))) {
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "UQ_orders_tracking" UNIQUE ("tracking_number")`);
      }
      await this.addColumn(queryRunner, "orders", "notes", "text");
      await this.addColumn(queryRunner, "orders", "payment_status", `"public"."payment_status" NOT NULL DEFAULT 'not_submitted'`);
      await this.addColumn(queryRunner, "orders", "payment_method", `"public"."payment_method"`);
      await this.addColumn(queryRunner, "orders", "sender_name", "character varying(150)");
      await this.addColumn(queryRunner, "orders", "sender_account", "character varying(100)");
      await this.addColumn(queryRunner, "orders", "sender_number", "character varying(30)");
      await this.addColumn(queryRunner, "orders", "proof_image_url", "text");
      await this.addColumn(queryRunner, "orders", "payment_amount", "numeric(10,2)");
      await this.addColumn(queryRunner, "orders", "payment_notes", "text");
      await this.addColumn(queryRunner, "orders", "payment_submitted_at", "TIMESTAMPTZ");
      await this.addColumn(queryRunner, "orders", "payment_verified_at", "TIMESTAMPTZ");
      await this.addColumn(queryRunner, "orders", "payment_verified_by", "integer");
      await this.addColumn(queryRunner, "orders", "rejection_reason", "text");
      await this.addColumn(queryRunner, "orders", "updated_at", "TIMESTAMPTZ NOT NULL DEFAULT now()");
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_payment_status" ON "orders" ("payment_status")`);
    }

    // ─── order_items ───
    if (!(await queryRunner.hasTable("order_items"))) {
      await queryRunner.query(`CREATE TABLE "order_items" ("id" SERIAL NOT NULL, "order_id" integer NOT NULL, "product_id" integer NOT NULL, "product_name" character varying(200) NOT NULL, "unit_price" numeric(10,2) NOT NULL, "color_id" integer, "color_name_en" character varying(50), "color_name_ar" character varying(50), "color_hex" character varying(7), "size" "public"."product_size", "quantity" integer NOT NULL DEFAULT '1', "product_image" text, CONSTRAINT "PK_order_items" PRIMARY KEY ("id"))`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_order_items_order" ON "order_items" ("order_id")`);
      await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_items_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
      await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
      await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_color" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    } else {
      await this.addColumn(queryRunner, "order_items", "color_id", "integer");
      await this.addColumn(queryRunner, "order_items", "product_image", "text");
      if (!(await this.hasConstraint(queryRunner, "FK_order_items_color"))) {
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_color" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
      }
    }

    // ─── payments ───
    if (!(await queryRunner.hasTable("payments"))) {
      await queryRunner.query(`CREATE TABLE "payments" ("id" SERIAL NOT NULL, "order_id" integer NOT NULL, "payment_method" "public"."payment_method" NOT NULL, "sender_name" character varying(150) NOT NULL, "sender_account" character varying(100), "sender_number" character varying(30) NOT NULL, "proof_image_url" text NOT NULL, "amount" numeric(10,2) NOT NULL, "notes" text, "status" "public"."payment_status" NOT NULL DEFAULT 'submitted', "verified_at" TIMESTAMPTZ, "verified_by" integer, "rejection_reason" text, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_payments_order" UNIQUE ("order_id"), CONSTRAINT "PK_payments" PRIMARY KEY ("id"))`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payments_status" ON "payments" ("status")`);
      await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    } else {
      // payments table predates the entity: only order links + receipt existed
      await this.addColumn(queryRunner, "payments", "payment_method", `"public"."payment_method"`, `UPDATE "payments" SET "payment_method"='other' WHERE "payment_method" IS NULL`, true);
      await this.addColumn(queryRunner, "payments", "sender_name", "character varying(150)", `UPDATE "payments" SET "sender_name"='unknown' WHERE "sender_name" IS NULL`, true);
      await this.addColumn(queryRunner, "payments", "sender_account", "character varying(100)");
      await this.addColumn(queryRunner, "payments", "notes", "text");
      await this.addColumn(queryRunner, "payments", "status", `"public"."payment_status" NOT NULL DEFAULT 'submitted'`);
      await this.addColumn(queryRunner, "payments", "verified_at", "TIMESTAMPTZ");
      await this.addColumn(queryRunner, "payments", "verified_by", "integer");
      await this.addColumn(queryRunner, "payments", "rejection_reason", "text");
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payments_status" ON "payments" ("status")`);
    }

    // ─── refresh_tokens ───
    if (!(await queryRunner.hasTable("refresh_tokens"))) {
      await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "user_id" integer, "admin_id" integer, "device_id" character varying NOT NULL, "expires_at" TIMESTAMPTZ NOT NULL, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_refresh_tokens_token" UNIQUE ("token"), CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"))`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_expires" ON "refresh_tokens" ("expires_at")`);
      await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
      await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_admin" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    // ─── user_tokens ───
    if (!(await queryRunner.hasTable("user_tokens"))) {
      await queryRunner.query(`CREATE TABLE "user_tokens" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "type" "public"."user_token_type" NOT NULL, "token_hash" character varying(255) NOT NULL, "expires_at" TIMESTAMPTZ NOT NULL, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_user_tokens_user" UNIQUE ("user_id"), CONSTRAINT "UQ_user_tokens_hash" UNIQUE ("token_hash"), CONSTRAINT "PK_user_tokens" PRIMARY KEY ("id"))`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_tokens_hash" ON "user_tokens" ("token_hash")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_tokens_expires" ON "user_tokens" ("expires_at")`);
      await queryRunner.query(`ALTER TABLE "user_tokens" ADD CONSTRAINT "FK_user_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    // ─── carts / cart_items ───
    if (!(await queryRunner.hasTable("carts"))) {
      await queryRunner.query(`CREATE TABLE "carts" ("id" SERIAL NOT NULL, "user_id" integer, "guest_token" character varying(64), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_carts" PRIMARY KEY ("id"))`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_carts_user" ON "carts" ("user_id")`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_carts_guest" ON "carts" ("guest_token")`);
      await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "FK_carts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    if (!(await queryRunner.hasTable("cart_items"))) {
      await queryRunner.query(`CREATE TABLE "cart_items" ("id" SERIAL NOT NULL, "cart_id" integer NOT NULL, "product_id" integer NOT NULL, "product_name" character varying(200) NOT NULL, "unit_price" numeric(10,2) NOT NULL, "color_id" integer, "size" "public"."product_size", "quantity" integer NOT NULL DEFAULT '1', "product_image" text, CONSTRAINT "PK_cart_items" PRIMARY KEY ("id"))`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cart_items_cart" ON "cart_items" ("cart_id")`);
      await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_cart" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
      await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
      await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_color" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const t of ["cart_items", "carts", "user_tokens", "refresh_tokens", "payments", "order_items", "orders", "product_sizes", "product_colors", "product_images", "products", "colors", "admins", "users", "categories"]) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${t}" CASCADE`);
    }
    for (const t of ["product_tag", "default_shape", "product_size", "order_status", "payment_status", "payment_method", "user_token_type"]) {
      await queryRunner.query(`DROP TYPE IF EXISTS "public"."${t}"`);
    }
  }
}
