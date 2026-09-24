import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Expose } from "class-transformer";
import { Product } from "./Product";

@Entity("product_images")
@Index(["productId"])
export class ProductImage {
  @PrimaryGeneratedColumn()
  @Expose()
  id!: number;

  @Column({ name: "product_id", type: "int" })
  @Expose()
  productId!: number;

  @ManyToOne(() => Product, (p) => p.images, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Column({ name: "image_url", type: "text" })
  @Expose()
  imageUrl!: string;

  @Column({ name: "sort_order", type: "int", default: 0 })
  @Expose()
  sortOrder!: number;

  @Column({ name: "is_main", type: "boolean", default: false })
  @Expose()
  isMain!: boolean;
}