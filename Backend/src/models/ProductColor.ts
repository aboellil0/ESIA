import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Check } from "typeorm";
import { Expose } from "class-transformer";
import { Product } from "./Product";

@Entity("product_colors")
@Unique(["productId", "nameEn"])
@Unique(["productId", "nameAr"])
@Unique(["productId", "hexCode"])
@Check(`"hex_code" ~ '^#[0-9A-Fa-f]{6}$'`)
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

  @Column({ name: "name_en", type: "varchar", length: 50 })
  @Expose()
  nameEn!: string;

  @Column({ name: "name_ar", type: "varchar", length: 50 })
  @Expose()
  nameAr!: string;

  @Column({ name: "hex_code", type: "varchar", length: 7 })
  @Expose()
  hexCode!: string;

  // Backward compat: legacy `color` field maps to nameEn (English name)
  @Expose()
  get color(): string {
    return (this as any).nameEn ?? null;
  }
  set color(v: string) {
    (this as any).nameEn = v;
  }
}