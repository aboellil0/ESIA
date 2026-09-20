import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Exclude, Expose } from "class-transformer";
import { Product } from "./Product";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn()
  @Expose()
  id!: number;

  @Column({ type: "varchar", length: 100, unique: true })
  @Expose()
  name!: string;

  @Column({ type: "varchar", length: 120, unique: true })
  @Expose()
  slug!: string;

  @OneToMany(() => Product, (p) => p.category)
  products!: Product[];

  toJSON() {
    const { products, ...rest } = this as any;
    return rest;
  }
}