import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";
import { Admin } from "./Admin";

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", unique: true })
  token!: string; // SHA-256 hash

  @Column({ name: "user_id", type: "int", nullable: true })
  userId!: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  @Column({ name: "admin_id", type: "int", nullable: true })
  adminId!: number | null;

  @ManyToOne(() => Admin, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "admin_id" })
  admin!: Admin | null;

  @Column({ name: "device_id", type: "varchar" })
  deviceId!: string;

  @Column({ name: "expires_at", type: "timestamptz" })
  @Index()
  expiresAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}