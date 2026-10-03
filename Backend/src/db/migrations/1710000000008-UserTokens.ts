import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Generalizes email tokens into a dedicated `user_tokens` table:
 * one-to-one with users (one row per user — a new token replaces the old),
 * with a type enum (email_verification | password_reset).
 * Moves any pending hashes off the users table, then drops those columns.
 */
export class UserTokens1710000000008 implements MigrationInterface {
  name = "UserTokens1710000000008";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."user_token_type" AS ENUM('email_verification', 'password_reset')`);
    await queryRunner.query(
      `CREATE TABLE "user_tokens" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "type" "public"."user_token_type" NOT NULL, "token_hash" character varying(255) NOT NULL, "expires_at" TIMESTAMPTZ NOT NULL, "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_user_tokens_user" UNIQUE ("user_id"), CONSTRAINT "UQ_user_tokens_hash" UNIQUE ("token_hash"), CONSTRAINT "PK_user_tokens" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_user_tokens_hash" ON "user_tokens" ("token_hash")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_tokens_expires" ON "user_tokens" ("expires_at")`);
    await queryRunner.query(
      `ALTER TABLE "user_tokens" ADD CONSTRAINT "FK_user_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    // Move pending tokens off users (verification wins if a user somehow has both).
    await queryRunner.query(
      `INSERT INTO "user_tokens" ("user_id", "type", "token_hash", "expires_at") SELECT "id", 'email_verification', "verification_token_hash", "verification_expires_at" FROM "users" WHERE "verification_token_hash" IS NOT NULL ON CONFLICT ("user_id") DO NOTHING`
    );
    await queryRunner.query(
      `INSERT INTO "user_tokens" ("user_id", "type", "token_hash", "expires_at") SELECT "id", 'password_reset', "reset_token_hash", "reset_expires_at" FROM "users" WHERE "reset_token_hash" IS NOT NULL ON CONFLICT ("user_id") DO NOTHING`
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_users_verification_token"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_reset_token"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verification_token_hash"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verification_expires_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "reset_token_hash"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "reset_expires_at"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "verification_token_hash" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "verification_expires_at" TIMESTAMPTZ`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "reset_token_hash" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "reset_expires_at" TIMESTAMPTZ`);
    await queryRunner.query(
      `UPDATE "users" u SET "verification_token_hash" = t."token_hash", "verification_expires_at" = t."expires_at" FROM "user_tokens" t WHERE t."user_id" = u."id" AND t."type" = 'email_verification'`
    );
    await queryRunner.query(
      `UPDATE "users" u SET "reset_token_hash" = t."token_hash", "reset_expires_at" = t."expires_at" FROM "user_tokens" t WHERE t."user_id" = u."id" AND t."type" = 'password_reset'`
    );
    await queryRunner.query(`CREATE INDEX "IDX_users_verification_token" ON "users" ("verification_token_hash")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_reset_token" ON "users" ("reset_token_hash")`);

    await queryRunner.query(`ALTER TABLE "user_tokens" DROP CONSTRAINT "FK_user_tokens_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_tokens_expires"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_tokens_hash"`);
    await queryRunner.query(`DROP TABLE "user_tokens"`);
    await queryRunner.query(`DROP TYPE "public"."user_token_type"`);
  }
}
