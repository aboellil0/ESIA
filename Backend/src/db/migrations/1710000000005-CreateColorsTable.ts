import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateColorsTable1710000000005 implements MigrationInterface {
  name = "CreateColorsTable1710000000005";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "colors" (
        "id" SERIAL NOT NULL,
        "name_en" VARCHAR(50) NOT NULL,
        "name_ar" VARCHAR(50) NOT NULL,
        "hex_code" VARCHAR(7) NOT NULL,
        CONSTRAINT "PK_colors_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_colors_name_en" UNIQUE ("name_en"),
        CONSTRAINT "UQ_colors_name_ar" UNIQUE ("name_ar"),
        CONSTRAINT "UQ_colors_hex_code" UNIQUE ("hex_code"),
        CONSTRAINT "CHK_colors_hex_code" CHECK ("hex_code" ~ '^#[0-9A-Fa-f]{6}$')
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "colors"`);
  }
}