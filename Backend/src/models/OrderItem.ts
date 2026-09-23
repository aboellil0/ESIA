import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Expose } from "class-transformer";
import { Order } from "./Order";
import { Product } from "./Product";
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

  @Column({ name: "color_name_en", type: "varchar", length: 50, nullable: true })
  @Expose()
  colorNameEn!: string | null;

  @Column({ name: "color_name_ar", type: "varchar", length: 50, nullable: true })
  @Expose()
  colorNameAr!: string | null;

  @Column({ name: "color_hex", type: "varchar", length: 7, nullable: true })
  @Expose()
  colorHex!: string | null;

  // Deprecated single-field color kept as getter for backward compat — not mapped to DB
  // Use colorNameEn / colorNameAr / colorHex instead.
  @Expose()
  get color(): string | null {
    return this.colorNameEn ?? this.colorHex ?? null;
  }
  set color(value: string | null) {
    this.colorNameEn = value;
  }

  @Column({ type: "enum", enum: ProductSize, nullable: true })
  @Expose()
  size!: ProductSize | null;

  @Column({ type: "int", default: 1 })
  @Expose()
  quantity!: number;
}