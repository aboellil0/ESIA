import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Expose } from "class-transformer";
import { Product } from "./Product";

@Entity("product_colors")
@Unique(["productId", "color"])
export class ProductColor {
  @PrimaryGeneratedColumn()
  @Expose()
  id!: number;

  @Column({ name: "product_id", type: "int" })
  @Expose()
  productId!: number;

  @ManyToOne(() => Product, (p) => p.colors, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Column({ name: "color", type: "varchar", length: 30 })
  @Expose()
  color!: string;
}