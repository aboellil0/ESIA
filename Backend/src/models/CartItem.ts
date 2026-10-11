import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Expose } from "class-transformer";
import { Cart } from "./Cart";
import { Product } from "./Product";
import { Color } from "./Color";

@Entity("cart_items")
export class CartItem {
  @PrimaryGeneratedColumn()
  @Expose()
  id!: number;

  @Column({ name: "cart_id", type: "int" })
  @Index()
  @Expose()
  cartId!: number;

  @ManyToOne(() => Cart, (c) => c.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "cart_id" })
  cart!: Cart;

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

  // Free-text size snapshot (was S/M/L/XL enum — see migration, data preserved).
  @Column({ type: "varchar", length: 50, nullable: true })
  @Expose()
  size!: string | null;

  @Column({ type: "int", default: 1 })
  @Expose()
  quantity!: number;

  @Column({ name: "product_image", type: "text", nullable: true })
  @Expose()
  productImage!: string | null;
}