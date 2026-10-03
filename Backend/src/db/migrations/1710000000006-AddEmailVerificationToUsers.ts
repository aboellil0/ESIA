import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerificationToUsers1710000000006 implements MigrationInterface {
  name = "AddEmailVerificationToUsers1710000000006";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "is_verified" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "verification_token_hash" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "verification_expires_at" TIMESTAMPTZ`);
    await queryRunner.query(`CREATE INDEX "IDX_users_verification_token" ON "users" ("verification_token_hash")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_users_verification_token"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verification_expires_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verification_token_hash"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_verified"`);
  }
}
