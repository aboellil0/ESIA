import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCartsTable1710000000009 implements MigrationInterface {
  name = "CreateCartsTable1710000000009";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Reuses the "public"."product_size" enum created by Init1710000000000
    await queryRunner.query(`CREATE TABLE "carts" ("id" SERIAL NOT NULL, "user_id" integer, "guest_token" character varying(64), "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_carts" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_carts_user" ON "carts" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_carts_guest" ON "carts" ("guest_token")`);
    await queryRunner.query(`CREATE TABLE "cart_items" ("id" SERIAL NOT NULL, "cart_id" integer NOT NULL, "product_id" integer NOT NULL, "product_name" character varying(200) NOT NULL, "unit_price" numeric(10,2) NOT NULL, "color_id" integer, "size" "public"."product_size", "quantity" integer NOT NULL DEFAULT '1', "product_image" text, CONSTRAINT "PK_cart_items" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_cart_items_cart" ON "cart_items" ("cart_id")`);
    await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "FK_carts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_cart" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_color" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_color"`);
    await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_product"`);
    await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_cart"`);
    await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_carts_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cart_items_cart"`);
    await queryRunner.query(`DROP TABLE "cart_items"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_carts_guest"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_carts_user"`);
    await queryRunner.query(`DROP TABLE "carts"`);
  }
}
