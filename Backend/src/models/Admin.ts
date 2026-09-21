import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Exclude, Expose } from "class-transformer";
import { Order } from "./Order";

@Entity("admins")
export class Admin {
  @PrimaryGeneratedColumn()
  @Expose()
  id!: number;

  @Column({ type: "varchar", length: 255, unique: true })
  @Expose()
  email!: string;

  @Column({ name: "password_hash", type: "text" })
  @Exclude()
  passwordHash!: string;

  @OneToMany(() => Order, (o) => o.reviewedByAdmin)
  reviewedOrders!: Order[];
}