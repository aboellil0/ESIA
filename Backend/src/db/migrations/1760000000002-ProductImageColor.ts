import { MigrationInterface, QueryRunner } from "typeorm";

// Gallery images can optionally link to one of the product's own colors
// (product_colors row). Unlinked images (NULL) are shown for every color.
export class ProductImageColor1760000000002 implements MigrationInterface {
  name = "ProductImageColor1760000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn("product_images", "color_id"))) {
      await queryRunner.query(`ALTER TABLE "product_images" ADD COLUMN "color_id" integer NULL`);
    }
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_product_images_color" ON "product_images" ("color_id")`);
    const hasFk: any[] = await queryRunner.query(
      `SELECT 1 FROM pg_constraint WHERE conname='FK_images_color'`
    );
    if (hasFk.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "product_images" ADD CONSTRAINT "FK_images_color" FOREIGN KEY ("color_id") REFERENCES "product_colors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT IF EXISTS "FK_images_color"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_images_color"`);
    if (await queryRunner.hasColumn("product_images", "color_id")) {
      await queryRunner.query(`ALTER TABLE "product_images" DROP COLUMN "color_id"`);
    }
  }
}
