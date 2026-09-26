import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, Unique, Check } from "typeorm";
import { Expose } from "class-transformer";

@Entity("colors")
@Unique(["nameEn"])
@Unique(["nameAr"])
@Unique(["hexCode"])
@Check(`"hex_code" ~ '^#[0-9A-Fa-f]{6}$'`)
export class Color {
  @PrimaryGeneratedColumn()
  @Expose()
  id!: number;

  @Column({ name: "name_en", type: "varchar", length: 50 })
  @Expose()
  nameEn!: string;

  @Column({ name: "name_ar", type: "varchar", length: 50 })
  @Expose()
  nameAr!: string;

  @Column({ name: "hex_code", type: "varchar", length: 7 })
  @Expose()
  hexCode!: string;
}