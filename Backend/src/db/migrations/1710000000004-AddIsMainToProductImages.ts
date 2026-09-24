import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsMainToProductImages1710000000004 implements MigrationInterface {
  name = "AddIsMainToProductImages1710000000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_images" ADD COLUMN "is_main" boolean NOT NULL DEFAULT false`);

    // Backfill: for each product, set the smallest sort_order image as main (if any)
    await queryRunner.query(`
      UPDATE "product_images" p
      SET "is_main" = true
      FROM (
        SELECT DISTINCT ON ("product_id") "product_id", "id"
        FROM "product_images"
        ORDER BY "product_id", "sort_order" ASC, "id" ASC
      ) firsts
      WHERE p."id" = firsts."id"
    `);

    // Ensure only one main per product (partial unique index)
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_product_images_main" ON "product_images" ("product_id") WHERE "is_main" = true`);

    // Sync products.main_image_url to the main image's url for card display (outside show)
    await queryRunner.query(`
      UPDATE "products" pr
      SET "main_image_url" = pi."image_url"
      FROM "product_images" pi
      WHERE pi."product_id" = pr."id" AND pi."is_main" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_product_images_main"`);
    await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "is_main"`);
  }
}
