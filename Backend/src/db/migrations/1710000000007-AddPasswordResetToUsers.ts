import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetToUsers1710000000007 implements MigrationInterface {
  name = "AddPasswordResetToUsers1710000000007";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "reset_token_hash" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "reset_expires_at" TIMESTAMPTZ`);
    await queryRunner.query(`CREATE INDEX "IDX_users_reset_token" ON "users" ("reset_token_hash")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_users_reset_token"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "reset_expires_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "reset_token_hash"`);
  }
}
