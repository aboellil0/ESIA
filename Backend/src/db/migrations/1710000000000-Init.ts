import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1710000000000 implements MigrationInterface {
  name = "Init1710000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."product_tag" AS ENUM('none', 'new', 'best_seller')`);
    await queryRunner.query(`CREATE TYPE "public"."default_shape" AS ENUM('puff_sleeves', 'layers', 'bow', 'long', 'abaya', 'circular')`);
    await queryRunner.query(`CREATE TYPE "public"."product_size" AS ENUM('S', 'M', 'L', 'XL')`);
    await queryRunner.query(`CREATE TYPE "public"."order_status" AS ENUM('pending', 'accepted', 'rejected', 'shipped', 'delivered', 'cancelled')`);

    await queryRunner.query(`CREATE TABLE "categories" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "slug" character varying(120) NOT NULL, CONSTRAINT "UQ_categories_name" UNIQUE ("name"), CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"), CONSTRAINT "PK_categories" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying(150) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" text NOT NULL, "phone" character varying(20), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_users_email" UNIQUE ("email"), CONSTRAINT "PK_users" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "admins" ("id" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "password_hash" text NOT NULL, CONSTRAINT "UQ_admins_email" UNIQUE ("email"), CONSTRAINT "PK_admins" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "products" ("id" SERIAL NOT NULL, "category_id" integer NOT NULL, "name" character varying(200) NOT NULL, "tag" "public"."product_tag" NOT NULL DEFAULT 'none', "main_image_url" text, "default_shape" "public"."default_shape", "price" numeric(10,2) NOT NULL, "old_price" numeric(10,2), "short_description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_products" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_products_category" ON "products" ("category_id")`);
    await queryRunner.query(`CREATE TABLE "product_images" ("id" SERIAL NOT NULL, "product_id" integer NOT NULL, "image_url" text NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_product_images" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_product_images_product" ON "product_images" ("product_id")`);
    await queryRunner.query(`CREATE TABLE "product_colors" ("id" SERIAL NOT NULL, "product_id" integer NOT NULL, "hex_code" character varying(7) NOT NULL, CONSTRAINT "PK_product_colors" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_product_colors" ON "product_colors" ("product_id", "hex_code")`);
    await queryRunner.query(`CREATE TABLE "product_sizes" ("id" SERIAL NOT NULL, "product_id" integer NOT NULL, "size" "public"."product_size" NOT NULL, "is_available" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_product_sizes" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_product_sizes" ON "product_sizes" ("product_id", "size")`);
    await queryRunner.query(`CREATE TABLE "orders" ("id" SERIAL NOT NULL, "order_number" character varying(30) NOT NULL, "user_id" integer, "customer_name" character varying(150) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(20) NOT NULL, "address" text NOT NULL, "city" character varying(100), "status" "public"."order_status" NOT NULL DEFAULT 'pending', "total_amount" numeric(10,2) NOT NULL, "reviewed_by" integer, "reviewed_at" TIMESTAMPTZ, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_orders_number" UNIQUE ("order_number"), CONSTRAINT "PK_orders" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_status" ON "orders" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_email" ON "orders" ("email")`);
    await queryRunner.query(`CREATE TABLE "order_items" ("id" SERIAL NOT NULL, "order_id" integer NOT NULL, "product_id" integer NOT NULL, "product_name" character varying(200) NOT NULL, "unit_price" numeric(10,2) NOT NULL, "color_hex" character varying(7), "size" "public"."product_size", "quantity" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_order_items" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_order_items_order" ON "order_items" ("order_id")`);
    await queryRunner.query(`CREATE TABLE "payments" ("id" SERIAL NOT NULL, "order_id" integer NOT NULL, "sender_number" character varying(30) NOT NULL, "proof_image_url" text NOT NULL, "amount" numeric(10,2) NOT NULL, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_payments_order" UNIQUE ("order_id"), CONSTRAINT "PK_payments" PRIMARY KEY ("id"))`);

    await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_products_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_images_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "product_colors" ADD CONSTRAINT "FK_colors_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "product_sizes" ADD CONSTRAINT "FK_sizes_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_admin" FOREIGN KEY ("reviewed_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_items_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_order"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_items_product"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_items_order"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_admin"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_user"`);
    await queryRunner.query(`ALTER TABLE "product_sizes" DROP CONSTRAINT "FK_sizes_product"`);
    await queryRunner.query(`ALTER TABLE "product_colors" DROP CONSTRAINT "FK_colors_product"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT "FK_images_product"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_category"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_status"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_product_sizes"`);
    await queryRunner.query(`DROP TABLE "product_sizes"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_product_colors"`);
    await queryRunner.query(`DROP TABLE "product_colors"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_product_images_product"`);
    await queryRunner.query(`DROP TABLE "product_images"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_category"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "admins"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TYPE "public"."order_status"`);
    await queryRunner.query(`DROP TYPE "public"."product_size"`);
    await queryRunner.query(`DROP TYPE "public"."default_shape"`);
    await queryRunner.query(`DROP TYPE "public"."product_tag"`);
  }
}