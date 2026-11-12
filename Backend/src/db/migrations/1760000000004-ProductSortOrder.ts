import { MigrationInterface, QueryRunner } from "typeorm";

export class ProductSortOrder1760000000004 implements MigrationInterface {
  name = "ProductSortOrder1760000000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn("products", "sort_order"))) {
      await queryRunner.query(
        `ALTER TABLE "products" ADD COLUMN "sort_order" integer NOT NULL DEFAULT 0`,
      );
    }

    await queryRunner.query(`
      WITH ranked_products AS (
        SELECT id,
          ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY id ASC) - 1 AS position
        FROM products
      )
      UPDATE products AS product
      SET sort_order = ranked_products.position
      FROM ranked_products
      WHERE product.id = ranked_products.id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn("products", "sort_order")) {
      await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "sort_order"`);
    }
  }
}
