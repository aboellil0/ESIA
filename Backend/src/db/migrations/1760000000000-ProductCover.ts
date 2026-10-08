import { MigrationInterface, QueryRunner } from "typeorm";

// Product cover image + files-only gallery:
// - adds products.cover_image_url (single file upload, the outside/card image)
// - backfills it from the old main image (is_main image, else first image, else main_image_url)
// - drops products.main_image_url
// - drops product_images.is_main + the partial unique index (gallery is files-only, ordered by sort_order)
export class ProductCover1760000000000 implements MigrationInterface {
  name = "ProductCover1760000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. add cover column
    if (!(await queryRunner.hasColumn("products", "cover_image_url"))) {
      await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "cover_image_url" text`);
    }

    // 2. backfill cover from old main image
    await queryRunner.query(`
      UPDATE "products" p SET "cover_image_url" = sub."image_url"
      FROM (
        SELECT DISTINCT ON ("product_id") "product_id", "image_url"
        FROM "product_images"
        ORDER BY "product_id", "is_main" DESC, "sort_order" ASC
      ) sub
      WHERE p.id = sub."product_id" AND p."cover_image_url" IS NULL
    `);
    await queryRunner.query(`
      UPDATE "products" SET "cover_image_url" = "main_image_url"
      WHERE "cover_image_url" IS NULL AND "main_image_url" IS NOT NULL
    `);

    // 3. drop old main column
    if (await queryRunner.hasColumn("products", "main_image_url")) {
      await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "main_image_url"`);
    }

    // 4. drop is_main partial unique index + column
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_product_images_main"`);
    if (await queryRunner.hasColumn("product_images", "is_main")) {
      await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "is_main"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn("products", "main_image_url"))) {
      await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "main_image_url" text`);
    }
    await queryRunner.query(`
      UPDATE "products" SET "main_image_url" = "cover_image_url"
      WHERE "main_image_url" IS NULL AND "cover_image_url" IS NOT NULL
    `);
    if (await queryRunner.hasColumn("products", "cover_image_url")) {
      await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "cover_image_url"`);
    }
    if (!(await queryRunner.hasColumn("product_images", "is_main"))) {
      await queryRunner.query(`ALTER TABLE "product_images" ADD COLUMN "is_main" boolean NOT NULL DEFAULT false`);
    }
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_product_images_main" ON "product_images" ("product_id") WHERE "is_main" = true`
    );
  }
}
