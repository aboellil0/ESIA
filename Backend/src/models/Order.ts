import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne, JoinColumn, CreateDateColumn, Index
} from "typeorm";
import { Expose } from "class-transformer";
import { User } from "./User";
import { Admin } from "./Admin";
import { OrderItem } from "./OrderItem";
import { Payment } from "./Payment";
import { OrderStatus } from "./enums";

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn()
  @Expose()
  id!: number;

  @Column({ name: "order_number", type: "varchar", length: 30, unique: true })
  @Expose()
  orderNumber!: string;

  @Column({ name: "user_id", type: "int", nullable: true })
  @Expose()
  userId!: number | null;

  @ManyToOne(() => User, (u) => u.orders, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  @Column({ name: "customer_name", type: "varchar", length: 150 })
  @Expose()
  customerName!: string;

  @Column({ type: "varchar", length: 255 })
  @Expose()
  email!: string;

  @Column({ type: "varchar", length: 20 })
  @Expose()
  phone!: string;

  @Column({ type: "text" })
  @Expose()
  address!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  @Expose()
  city!: string | null;

  @Column({ type: "enum", enum: OrderStatus, default: OrderStatus.PENDING })
  @Index()
  @Expose()
  status!: OrderStatus;

  @Column({ name: "total_amount", type: "decimal", precision: 10, scale: 2, transformer: { from: (v: string) => parseFloat(v), to: (v: number) => v } })
  @Expose()
  totalAmount!: number;

  @Column({ name: "reviewed_by", type: "int", nullable: true })
  @Expose()
  reviewedBy!: number | null;

  @ManyToOne(() => Admin, (a) => a.reviewedOrders, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "reviewed_by" })
  reviewedByAdmin!: Admin | null;

  @Column({ name: "reviewed_at", type: "timestamptz", nullable: true })
  @Expose()
  reviewedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  @Expose()
  createdAt!: Date;

  @OneToMany(() => OrderItem, (i) => i.order, { cascade: true })
  items!: OrderItem[];

  @OneToOne(() => Payment, (p) => p.order)
  payment!: Payment | null;
}