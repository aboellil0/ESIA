import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { Expose } from "class-transformer";
import { User } from "./User";
import { CartItem } from "./CartItem";

@Entity("carts")
export class Cart {
  @PrimaryGeneratedColumn()
  @Expose()
  id!: number;

  @Column({ name: "user_id", type: "int", nullable: true })
  @Index()
  @Expose()
  userId!: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  @Column({ name: "guest_token", type: "varchar", length: 64, nullable: true })
  @Index()
  @Expose()
  guestToken!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  @Expose()
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  @Expose()
  updatedAt!: Date;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items!: CartItem[];
}