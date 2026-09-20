import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Expose } from "class-transformer";
import { Order } from "./Order";

@Entity("payments")
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

  @Column({ name: "sender_number", type: "varchar", length: 30 })
  @Expose()
  senderNumber!: string;

  @Column({ name: "proof_image_url", type: "text" })
  @Expose()
  proofImageUrl!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, transformer: { from: (v: string) => parseFloat(v), to: (v: number) => v } })
  @Expose()
  amount!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  @Expose()
  createdAt!: Date;
}