import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Exclude, Expose } from "class-transformer";
import { Order } from "./Order";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  @Expose()
  id!: number;

  @Column({ type: "varchar", length: 150 })
  @Expose()
  name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  @Expose()
  email!: string;

  @Column({ name: "password_hash", type: "text" })
  @Exclude()
  passwordHash!: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  @Expose()
  phone!: string | null;

  @Column({ name: "is_verified", type: "boolean", default: false })
  @Expose()
  isVerified!: boolean;

  @Column({ name: "verification_token_hash", type: "varchar", length: 255, nullable: true })
  @Exclude()
  verificationTokenHash!: string | null;

  @Column({ name: "verification_expires_at", type: "timestamptz", nullable: true })
  @Exclude()
  verificationExpiresAt!: Date | null;

  @Column({ name: "reset_token_hash", type: "varchar", length: 255, nullable: true })
  @Exclude()
  resetTokenHash!: string | null;

  @Column({ name: "reset_expires_at", type: "timestamptz", nullable: true })
  @Exclude()
  resetExpiresAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  @Expose()
  createdAt!: Date;

  @OneToMany(() => Order, (o) => o.user)
  orders!: Order[];
}