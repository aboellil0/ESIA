import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne, JoinColumn, CreateDateColumn, Index, UpdateDateColumn
} from "typeorm";
import { Expose } from "class-transformer";
import { User } from "./User";
import { Admin } from "./Admin";
import { OrderItem } from "./OrderItem";
import { Payment } from "./Payment";
import { OrderStatus, PaymentStatus, PaymentMethod } from "./enums";

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

  @Column({ name: "tracking_number", type: "varchar", length: 50, nullable: true, unique: true })
  @Expose()
  trackingNumber!: string | null;

  @Column({ name: "notes", type: "text", nullable: true })
  @Expose()
  notes!: string | null;

  @Column({ name: "payment_status", type: "enum", enum: PaymentStatus, default: PaymentStatus.NOT_SUBMITTED })
  @Index()
  @Expose()
  paymentStatus!: PaymentStatus;

  @Column({ name: "payment_method", type: "enum", enum: PaymentMethod, nullable: true })
  @Expose()
  paymentMethod!: PaymentMethod | null;

  @Column({ name: "sender_name", type: "varchar", length: 150, nullable: true })
  @Expose()
  senderName!: string | null;

  @Column({ name: "sender_account", type: "varchar", length: 100, nullable: true })
  @Expose()
  senderAccount!: string | null;

  @Column({ name: "sender_number", type: "varchar", length: 30, nullable: true })
  @Expose()
  senderNumber!: string | null;

  @Column({ name: "proof_image_url", type: "text", nullable: true })
  @Expose()
  proofImageUrl!: string | null;

  @Column({ name: "payment_amount", type: "decimal", precision: 10, scale: 2, transformer: { from: (v: string) => parseFloat(v), to: (v: number) => v }, nullable: true })
  @Expose()
  paymentAmount!: number | null;

  @Column({ name: "payment_notes", type: "text", nullable: true })
  @Expose()
  paymentNotes!: string | null;

  @Column({ name: "payment_submitted_at", type: "timestamptz", nullable: true })
  @Expose()
  paymentSubmittedAt!: Date | null;

  @Column({ name: "payment_verified_at", type: "timestamptz", nullable: true })
  @Expose()
  paymentVerifiedAt!: Date | null;

  @Column({ name: "payment_verified_by", type: "int", nullable: true })
  @Expose()
  paymentVerifiedBy!: number | null;

  @Column({ name: "rejection_reason", type: "text", nullable: true })
  @Expose()
  rejectionReason!: string | null;

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

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  @Expose()
  updatedAt!: Date;

  @OneToMany(() => OrderItem, (i) => i.order, { cascade: true })
  items!: OrderItem[];

  @OneToOne(() => Payment, (p) => p.order)
  payment!: Payment | null;
}