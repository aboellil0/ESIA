import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, Index } from "typeorm";
import { Expose } from "class-transformer";
import { Order } from "./Order";
import { PaymentMethod, PaymentStatus } from "./enums";

@Entity("payments")
@Index(["orderId"], { unique: true })
export class Payment {
  @PrimaryGeneratedColumn()
  @Expose()
  id!: number;

  @Column({ name: "order_id", type: "int", unique: true })
  @Expose()
  orderId!: number;

  @OneToOne(() => Order, (o) => o.payment, { onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: Order;

  @Column({ name: "payment_method", type: "enum", enum: PaymentMethod })
  @Expose()
  paymentMethod!: PaymentMethod;

  @Column({ name: "sender_name", type: "varchar", length: 150 })
  @Expose()
  senderName!: string;

  @Column({ name: "sender_account", type: "varchar", length: 100, nullable: true })
  @Expose()
  senderAccount!: string | null;

  @Column({ name: "sender_number", type: "varchar", length: 30 })
  @Expose()
  senderNumber!: string;

  @Column({ name: "proof_image_url", type: "text" })
  @Expose()
  proofImageUrl!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, transformer: { from: (v: string) => parseFloat(v), to: (v: number) => v } })
  @Expose()
  amount!: number;

  @Column({ name: "notes", type: "text", nullable: true })
  @Expose()
  notes!: string | null;

  @Column({ name: "status", type: "enum", enum: PaymentStatus, default: PaymentStatus.SUBMITTED })
  @Index()
  @Expose()
  status!: PaymentStatus;

  @Column({ name: "verified_at", type: "timestamptz", nullable: true })
  @Expose()
  verifiedAt!: Date | null;

  @Column({ name: "verified_by", type: "int", nullable: true })
  @Expose()
  verifiedBy!: number | null;

  @Column({ name: "rejection_reason", type: "text", nullable: true })
  @Expose()
  rejectionReason!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  @Expose()
  createdAt!: Date;
}