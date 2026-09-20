import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, Unique } from "typeorm";
import { Expose } from "class-transformer";
import { Product } from "./Product";

@Entity("product_colors")
@Unique(["productId", "hexCode"])
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

  @Column({ name: "hex_code", type: "varchar", length: 7 })
  @Expose()
  hexCode!: string;
}