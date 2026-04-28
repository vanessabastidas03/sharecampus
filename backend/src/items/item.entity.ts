import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ItemCategory {
  LIBROS = 'Libros',
  CALCULADORAS = 'Calculadoras',
  APUNTES = 'Apuntes',
  LAB = 'Lab',
  TECNOLOGIA = 'Tecnología',
  OTROS = 'Otros',
}

export enum ItemStatus {
  DISPONIBLE = 'Disponible',
  RESERVADO = 'Reservado',
  ENTREGADO = 'Entregado',
}

export enum ItemOfferType {
  PRESTAMO = 'Préstamo',
  INTERCAMBIO = 'Intercambio',
  DONACION = 'Donación',
  ALQUILER = 'Alquiler',
}

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ItemCategory })
  category: ItemCategory;

  @Column({ type: 'enum', enum: ItemStatus, default: ItemStatus.DISPONIBLE })
  status: ItemStatus;

  @Column({ type: 'enum', enum: ItemOfferType })
  offer_type: ItemOfferType;

  @Column({ type: 'simple-array', nullable: true })
  photos: string[];

  @Column({ type: 'text', nullable: true })
  campus: string | null;

  // Precio de alquiler (solo aplica cuando offer_type = Alquiler)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  rental_price!: number | null;

  @Column({ type: 'varchar', nullable: true })
  rental_time_unit!: string | null;

  @Column({ default: false })
  is_reported: boolean;

  @Column({ default: 0 })
  report_count: number;

  @Column({ default: false })
  is_reviewed: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
