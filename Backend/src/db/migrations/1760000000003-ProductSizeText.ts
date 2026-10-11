import { MigrationInterface, QueryRunner } from "typeorm";

// Free-text sizes: convert the three size columns from the product_size enum
// to varchar(50). USING ...::text preserves every existing value as-is
// (S/M/L/XL and all historic cart/order snapshots). No reset, no drop.
// The product_size enum TYPE is intentionally left in place (harmless).
// NOTE: run on dev/staging first and verify; do NOT run blindly on production.
export class ProductSizeText1760000000003 implements MigrationInterface {
  name = "ProductSizeText1760000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_sizes" ALTER COLUMN "size" TYPE varchar(50) USING "size"::text`
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ALTER COLUMN "size" TYPE varchar(50) USING "size"::text`
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ALTER COLUMN "size" TYPE varchar(50) USING "size"::text`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reversal only works when all stored values are valid enum members;
    // custom sizes would fail loudly here instead of being silently dropped.
    await queryRunner.query(
      `ALTER TABLE "order_items" ALTER COLUMN "size" TYPE "public"."product_size" USING "size"::"public"."product_size"`
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ALTER COLUMN "size" TYPE "public"."product_size" USING "size"::"public"."product_size"`
    );
    await queryRunner.query(
      `ALTER TABLE "product_sizes" ALTER COLUMN "size" TYPE "public"."product_size" USING "size"::"public"."product_size"`
    );
  }
}
