import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, Index
} from "typeorm";
import { Expose } from "class-transformer";
import { Category } from "./Category";
import { ProductImage } from "./ProductImage";
import { ProductColor } from "./ProductColor";
import { ProductSize } from "./ProductSize";
import { ProductTag, DefaultShape } from "./enums";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn()
  @Expose()
  id!: number;

  @Column({ name: "category_id", type: "int" })
  @Expose()
  categoryId!: number;

  @ManyToOne(() => Category, (c) => c.products, { onDelete: "CASCADE" })
  @JoinColumn({ name: "category_id" })
  category!: Category;

  @Column({ type: "varchar", length: 200 })
  @Expose()
  name!: string;

  @Column({ type: "enum", enum: ProductTag, default: ProductTag.NONE })
  @Expose()
  tag!: ProductTag;

  @Column({ name: "main_image_url", type: "text", nullable: true })
  @Expose()
  mainImageUrl!: string | null;

  @Column({ name: "default_shape", type: "enum", enum: DefaultShape, nullable: true })
  @Expose()
  defaultShape!: DefaultShape | null;

  @Column({ type: "decimal", precision: 10, scale: 2, transformer: { from: (v: string) => parseFloat(v), to: (v: number) => v } })
  @Expose()
  price!: number;

  @Column({ name: "old_price", type: "decimal", precision: 10, scale: 2, nullable: true, transformer: { from: (v: string | null) => v ? parseFloat(v) : null, to: (v: number | null) => v } })
  @Expose()
  oldPrice!: number | null;

  @Column({ name: "short_description", type: "text", nullable: true })
  @Expose()
  shortDescription!: string | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  @Expose()
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  @Expose()
  createdAt!: Date;

  @OneToMany(() => ProductImage, (i) => i.product, { cascade: true })
  images!: ProductImage[];

  @OneToMany(() => ProductColor, (c) => c.product, { cascade: true })
  colors!: ProductColor[];

  @OneToMany(() => ProductSize, (s) => s.product, { cascade: true })
  sizes!: ProductSize[];
}