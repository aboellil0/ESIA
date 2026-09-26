import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Expose } from "class-transformer";
import { Order } from "./Order";
import { Product } from "./Product";
import { Color } from "./Color";
import { ProductSize } from "./enums";

@Entity("order_items")
export class OrderItem {
  @PrimaryGeneratedColumn()
  @Expose()
  id!: number;

  @Column({ name: "order_id", type: "int" })
  @Expose()
  orderId!: number;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: Order;

  @Column({ name: "product_id", type: "int" })
  @Expose()
  productId!: number;

  @ManyToOne(() => Product, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Column({ name: "product_name", type: "varchar", length: 200 })
  @Expose()
  productName!: string;

  @Column({ name: "unit_price", type: "decimal", precision: 10, scale: 2, transformer: { from: (v: string) => parseFloat(v), to: (v: number) => v } })
  @Expose()
  unitPrice!: number;

  @Column({ name: "color_id", type: "int", nullable: true })
  @Expose()
  colorId!: number | null;

  @ManyToOne(() => Color, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "color_id" })
  color!: Color | null;

  @Column({ type: "enum", enum: ProductSize, nullable: true })
  @Expose()
  size!: ProductSize | null;

  @Column({ type: "int", default: 1 })
  @Expose()
  quantity!: number;
}