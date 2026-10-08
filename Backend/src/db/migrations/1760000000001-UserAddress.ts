import { MigrationInterface, QueryRunner } from "typeorm";

// Saved checkout info on the user: address + city (name/phone/email already exist).
// Lets signed-in users skip retyping their info at checkout; editable from profile.
export class UserAddress1760000000001 implements MigrationInterface {
  name = "UserAddress1760000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn("users", "address"))) {
      await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "address" text`);
    }
    if (!(await queryRunner.hasColumn("users", "city"))) {
      await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "city" character varying(100)`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn("users", "city")) {
      await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "city"`);
    }
    if (await queryRunner.hasColumn("users", "address")) {
      await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "address"`);
    }
  }
}
