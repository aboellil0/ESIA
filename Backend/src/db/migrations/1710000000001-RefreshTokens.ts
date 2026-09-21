import { MigrationInterface, QueryRunner } from "typeorm";

export class RefreshTokens1710000000001 implements MigrationInterface {
  name = "RefreshTokens1710000000001"
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "user_id" integer, "admin_id" integer, "device_id" character varying NOT NULL, "expires_at" TIMESTAMPTZ NOT NULL, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_refresh_tokens_token" UNIQUE ("token"), CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_expires" ON "refresh_tokens" ("expires_at")`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_admin" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_admin"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_refresh_tokens_expires"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}