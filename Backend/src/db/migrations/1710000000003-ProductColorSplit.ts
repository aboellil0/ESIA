import { MigrationInterface, QueryRunner } from "typeorm";

export class ProductColorSplit1710000000003 implements MigrationInterface {
  name = "ProductColorSplit1710000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---------- product_colors ----------
    // Drop old composite unique index (product_id, color)
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_product_colors"`);

    // Determine current column name: after 0002 it is "color", before it was "hex_code"
    const hasColorCol: any[] = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='product_colors' AND column_name='color'
    `);
    const hasHexCol: any[] = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='product_colors' AND column_name='hex_code'
    `);
    const hasNameEnCol: any[] = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='product_colors' AND column_name='name_en'
    `);

    // If already migrated (has name_en), skip product_colors part
    if (hasNameEnCol.length === 0) {
      if (hasColorCol.length > 0) {
        // Add new columns as nullable first
        await queryRunner.query(`ALTER TABLE "product_colors" ADD COLUMN "name_en" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "product_colors" ADD COLUMN "name_ar" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "product_colors" ADD COLUMN "hex_code" character varying(7)`);

        // Populate from existing single "color" column (English name or hex fallback)
        await queryRunner.query(`
          UPDATE "product_colors"
          SET
            "name_en" = "color",
            "name_ar" = CASE lower("color")
              WHEN 'black' THEN 'أسود'
              WHEN 'white' THEN 'أبيض'
              WHEN 'beige' THEN 'بيج'
              WHEN 'pink' THEN 'وردي'
              WHEN 'red' THEN 'أحمر'
              WHEN 'brown' THEN 'بني'
              WHEN 'blue' THEN 'أزرق'
              WHEN 'grey' THEN 'رمادي'
              WHEN 'gray' THEN 'رمادي'
              WHEN 'green' THEN 'أخضر'
              ELSE "color"
            END,
            "hex_code" = CASE lower("color")
              WHEN 'black' THEN '#000000'
              WHEN 'white' THEN '#FFFFFF'
              WHEN 'beige' THEN '#F0E6DA'
              WHEN 'pink' THEN '#C67B90'
              WHEN 'red' THEN '#E63946'
              WHEN 'brown' THEN '#8D5524'
              WHEN 'blue' THEN '#1D3557'
              WHEN 'grey' THEN '#6C757D'
              WHEN 'gray' THEN '#6C757D'
              WHEN 'green' THEN '#2A9D8F'
              ELSE
                CASE WHEN "color" ~ '^#[0-9A-Fa-f]{6}$' THEN upper("color")
                     WHEN "color" ~ '^#[0-9A-Fa-f]{3}$' THEN upper("color")
                     ELSE '#000000'
                END
            END
        `);

        // If any row still has hex like '#abc123' as name_en, fix hex_code to keep original
        await queryRunner.query(`
          UPDATE "product_colors"
          SET "hex_code" = upper("color")
          WHERE "color" ~ '^#[0-9A-Fa-f]{6}$' OR "color" ~ '^#[0-9A-Fa-f]{3}$'
        `);

        // Make NOT NULL
        await queryRunner.query(`ALTER TABLE "product_colors" ALTER COLUMN "name_en" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_colors" ALTER COLUMN "name_ar" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_colors" ALTER COLUMN "hex_code" SET NOT NULL`);

        // Drop old column
        await queryRunner.query(`ALTER TABLE "product_colors" DROP COLUMN "color"`);
      } else if (hasHexCol.length > 0 && hasNameEnCol.length === 0) {
        // Edge case: DB is still at Init state (hex_code only, no color rename yet)
        // Add name_en / name_ar and migrate hex_code
        await queryRunner.query(`ALTER TABLE "product_colors" ADD COLUMN "name_en" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "product_colors" ADD COLUMN "name_ar" character varying(50)`);

        await queryRunner.query(`
          UPDATE "product_colors"
          SET
            "name_en" = CASE lower("hex_code")
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
            END,
            "name_ar" = CASE lower("hex_code")
              WHEN '#000000' THEN 'أسود'
              WHEN '#22201e' THEN 'أسود'
              WHEN '#ffffff' THEN 'أبيض'
              WHEN '#f0e6da' THEN 'بيج'
              WHEN '#c67b90' THEN 'وردي'
              WHEN '#e63946' THEN 'أحمر'
              WHEN '#7b2d3a' THEN 'بني'
              WHEN '#8d5524' THEN 'بني'
              WHEN '#7c7856' THEN 'بيج'
              WHEN '#1d3557' THEN 'أزرق'
              WHEN '#6c757d' THEN 'رمادي'
              WHEN '#2a9d8f' THEN 'أخضر'
              ELSE lower("hex_code")
            END
        `);
        // normalize hex_code to uppercase 7-char
        await queryRunner.query(`UPDATE "product_colors" SET "hex_code" = upper("hex_code") WHERE "hex_code" ~ '^#[0-9A-Fa-f]{6}$'`);
        await queryRunner.query(`ALTER TABLE "product_colors" ALTER COLUMN "name_en" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_colors" ALTER COLUMN "name_ar" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_colors" ALTER COLUMN "hex_code" SET NOT NULL`);
      }
    }

    // Ensure hex_code check constraint (drop if exists then add)
    await queryRunner.query(`ALTER TABLE "product_colors" DROP CONSTRAINT IF EXISTS "CHK_product_colors_hex_code"`);
    await queryRunner.query(`ALTER TABLE "product_colors" ADD CONSTRAINT "CHK_product_colors_hex_code" CHECK ("hex_code" ~ '^#[0-9A-Fa-f]{6}$')`);

    // Create 3 separate unique indexes per product (each field unique per product)
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_product_colors_name_en"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_product_colors_name_ar"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_product_colors_hex_code"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_product_colors_name_en" ON "product_colors" ("product_id", "name_en")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_product_colors_name_ar" ON "product_colors" ("product_id", "name_ar")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_product_colors_hex_code" ON "product_colors" ("product_id", "hex_code")`);

    // ---------- order_items ----------
    // Migrate single "color" column to three snapshot columns
    const orderHasColor: any[] = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name='order_items' AND column_name='color'
    `);
    const orderHasNameEn: any[] = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name='order_items' AND column_name='color_name_en'
    `);
    const orderHasHexOld: any[] = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name='order_items' AND column_name='color_hex'
    `);

    if (orderHasNameEn.length === 0) {
      if (orderHasColor.length > 0) {
        // varchar(30) -> varchar(50) + add extra columns
        await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN "color_name_en" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN "color_name_ar" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN "color_hex" character varying(7)`);

        await queryRunner.query(`
          UPDATE "order_items"
          SET
            "color_name_en" = "color",
            "color_name_ar" = CASE lower("color")
              WHEN 'black' THEN 'أسود'
              WHEN 'white' THEN 'أبيض'
              WHEN 'beige' THEN 'بيج'
              WHEN 'pink' THEN 'وردي'
              WHEN 'red' THEN 'أحمر'
              WHEN 'brown' THEN 'بني'
              WHEN 'blue' THEN 'أزرق'
              WHEN 'grey' THEN 'رمادي'
              WHEN 'gray' THEN 'رمادي'
              WHEN 'green' THEN 'أخضر'
              ELSE "color"
            END,
            "color_hex" = CASE lower("color")
              WHEN 'black' THEN '#000000'
              WHEN 'white' THEN '#FFFFFF'
              WHEN 'beige' THEN '#F0E6DA'
              WHEN 'pink' THEN '#C67B90'
              WHEN 'red' THEN '#E63946'
              WHEN 'brown' THEN '#8D5524'
              WHEN 'blue' THEN '#1D3557'
              WHEN 'grey' THEN '#6C757D'
              WHEN 'gray' THEN '#6C757D'
              WHEN 'green' THEN '#2A9D8F'
              ELSE CASE WHEN "color" ~ '^#[0-9A-Fa-f]{6}$' THEN upper("color") ELSE NULL END
            END
        `);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "color"`);
      } else if (orderHasHexOld.length > 0) {
        // Very old schema still has color_hex varchar(7)
        await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN "color_name_en" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN "color_name_ar" character varying(50)`);
        // color_hex already exists, ensure length 7
        await queryRunner.query(`
          UPDATE "order_items"
          SET
            "color_name_en" = CASE lower("color_hex")
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
              ELSE lower("color_hex")
            END,
            "color_name_ar" = CASE lower("color_hex")
              WHEN '#000000' THEN 'أسود'
              WHEN '#22201e' THEN 'أسود'
              WHEN '#ffffff' THEN 'أبيض'
              WHEN '#f0e6da' THEN 'بيج'
              WHEN '#c67b90' THEN 'وردي'
              WHEN '#e63946' THEN 'أحمر'
              WHEN '#7b2d3a' THEN 'بني'
              WHEN '#8d5524' THEN 'بني'
              WHEN '#7c7856' THEN 'بيج'
              WHEN '#1d3557' THEN 'أزرق'
              WHEN '#6c757d' THEN 'رمادي'
              WHEN '#2a9d8f' THEN 'أخضر'
              ELSE lower("color_hex")
            END
        `);
        await queryRunner.query(`UPDATE "order_items" SET "color_hex" = upper("color_hex") WHERE "color_hex" ~ '^#[0-9A-Fa-f]{6}$'`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // order_items revert
    const hasNameEn: any[] = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name='order_items' AND column_name='color_name_en'
    `);
    if (hasNameEn.length > 0) {
      await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN "color" character varying(30)`);
      await queryRunner.query(`UPDATE "order_items" SET "color" = coalesce("color_name_en", "color_hex", NULL)`);
      await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "color_name_en"`);
      await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "color_name_ar"`);
      await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "color_hex"`);
    }

    // product_colors revert
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_product_colors_name_en"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_product_colors_name_ar"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_product_colors_hex_code"`);
    await queryRunner.query(`ALTER TABLE "product_colors" DROP CONSTRAINT IF EXISTS "CHK_product_colors_hex_code"`);

    const hasNameEnProd: any[] = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name='product_colors' AND column_name='name_en'
    `);
    if (hasNameEnProd.length > 0) {
      await queryRunner.query(`ALTER TABLE "product_colors" ADD COLUMN "color" character varying(30)`);
      await queryRunner.query(`UPDATE "product_colors" SET "color" = "name_en"`);
      await queryRunner.query(`ALTER TABLE "product_colors" ALTER COLUMN "color" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "product_colors" DROP COLUMN "name_en"`);
      await queryRunner.query(`ALTER TABLE "product_colors" DROP COLUMN "name_ar"`);
      await queryRunner.query(`ALTER TABLE "product_colors" DROP COLUMN "hex_code"`);
      await queryRunner.query(`CREATE UNIQUE INDEX "UQ_product_colors" ON "product_colors" ("product_id", "color")`);
    }
  }
}
