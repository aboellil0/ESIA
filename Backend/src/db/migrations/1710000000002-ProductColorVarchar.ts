import { MigrationInterface, QueryRunner } from "typeorm";

export class ProductColorVarchar1710000000002 implements MigrationInterface {
  name = "ProductColorVarchar1710000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // product_colors: hex_code varchar(7) -> color varchar(30) with English names, unique per product
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_product_colors"`);
    await queryRunner.query(`
      ALTER TABLE "product_colors"
      ALTER COLUMN "hex_code" TYPE character varying(30)
      USING (
        CASE lower("hex_code")
          WHEN '#000000' THEN 'black'
          WHEN '#22201e' THEN 'black'
          WHEN '#ffffff' THEN 'white'
          WHEN '#f0e6da' THEN 'beige'
          WHEN '#c67b90' THEN 'pink'
          WHEN '#e63946' THEN 'red'
          WHEN '#7b2d3a' THEN 'brown'
          WHEN '#8d5524' THEN 'brown'
          WHEN '#7c7856' THEN 'beige'
          WHEN '#1d3557' THEN 'blue'
          WHEN '#6c757d' THEN 'grey'
          WHEN '#2a9d8f' THEN 'green'
          ELSE lower("hex_code")
        END
      )
    `);
    await queryRunner.query(`ALTER TABLE "product_colors" RENAME COLUMN "hex_code" TO "color"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_product_colors" ON "product_colors" ("product_id", "color")`);

    // order_items: color_hex varchar(7) -> color varchar(30)
    await queryRunner.query(`
      ALTER TABLE "order_items"
      ALTER COLUMN "color_hex" TYPE character varying(30)
      USING (
        CASE
          WHEN "color_hex" IS NULL THEN NULL
          WHEN lower("color_hex") = '#000000' THEN 'black'
          WHEN lower("color_hex") = '#22201e' THEN 'black'
          WHEN lower("color_hex") = '#ffffff' THEN 'white'
          WHEN lower("color_hex") = '#f0e6da' THEN 'beige'
          WHEN lower("color_hex") = '#c67b90' THEN 'pink'
          WHEN lower("color_hex") = '#e63946' THEN 'red'
          WHEN lower("color_hex") = '#7b2d3a' THEN 'brown'
          WHEN lower("color_hex") = '#8d5524' THEN 'brown'
          WHEN lower("color_hex") = '#7c7856' THEN 'beige'
          WHEN lower("color_hex") = '#1d3557' THEN 'blue'
          WHEN lower("color_hex") = '#6c757d' THEN 'grey'
          WHEN lower("color_hex") = '#2a9d8f' THEN 'green'
          ELSE lower("color_hex")
        END
      )
    `);
    await queryRunner.query(`ALTER TABLE "order_items" RENAME COLUMN "color_hex" TO "color"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_items" RENAME COLUMN "color" TO "color_hex"`);
    await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "color_hex" TYPE character varying(7) USING substring("color_hex" from 1 for 7)`);

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_product_colors"`);
    await queryRunner.query(`ALTER TABLE "product_colors" RENAME COLUMN "color" TO "hex_code"`);
    await queryRunner.query(`ALTER TABLE "product_colors" ALTER COLUMN "hex_code" TYPE character varying(7) USING substring("hex_code" from 1 for 7)`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_product_colors" ON "product_colors" ("product_id", "hex_code")`);
  }
}
