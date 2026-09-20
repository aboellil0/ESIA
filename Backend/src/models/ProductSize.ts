import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Expose } from "class-transformer";
import { Product } from "./Product";
import { ProductSize as ProductSizeEnum } from "./enums";

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

  @Column({ type: "enum", enum: ProductSizeEnum })
  @Expose()
  size!: ProductSizeEnum;

  @Column({ name: "is_available", type: "boolean", default: true })
  @Expose()
  isAvailable!: boolean;
}