import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Expose } from "class-transformer";
import { Product } from "./Product";

@Entity("product_sizes")
@Unique(["productId", "size"])
export class ProductSize {
  @PrimaryGeneratedColumn()
  @Expose()
  id!: number;

  @Column({ name: "product_id", type: "int" })
  @Expose()
  productId!: number;

  @ManyToOne(() => Product, (p) => p.sizes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  // Free-text size name (up to 50 chars). Previously a S/M/L/XL enum —
  // converted to varchar by migration, existing values preserved as-is.
  @Column({ type: "varchar", length: 50 })
  @Expose()
  size!: string;

  @Column({ name: "is_available", type: "boolean", default: true })
  @Expose()
  isAvailable!: boolean;
}