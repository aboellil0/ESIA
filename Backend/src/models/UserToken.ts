import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Exclude, Expose } from "class-transformer";
import { User } from "./User";
import { UserTokenType } from "./enums";

/**
 * Single-use email tokens (verification + password reset).
 * One-to-one with User: issuing a new token replaces any previous one,
 * regardless of type.
 */
@Entity("user_tokens")
export class UserToken {
  @PrimaryGeneratedColumn()
  @Expose()
  id!: number;

  @Column({ name: "user_id", type: "int", unique: true })
  userId!: number;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "enum", enum: UserTokenType })
  @Expose()
  type!: UserTokenType;

  @Column({ name: "token_hash", type: "varchar", length: 255, unique: true })
  @Exclude()
  @Index()
  tokenHash!: string;

  @Column({ name: "expires_at", type: "timestamptz" })
  @Exclude()
  @Index()
  expiresAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
