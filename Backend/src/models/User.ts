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

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  @Expose()
  createdAt!: Date;

  @OneToMany(() => Order, (o) => o.user)
  orders!: Order[];
}