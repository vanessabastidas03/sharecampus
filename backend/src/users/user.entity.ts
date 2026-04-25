import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ type: 'text', nullable: true })
  verification_token: string | null;

  @Column({ type: 'text', nullable: true })
  reset_password_token: string | null;

  @Column({ type: 'text', nullable: true })
  reset_password_expires: string | null;

  @Column({ type: 'text', nullable: true })
  full_name: string | null;

  @Column({ type: 'text', nullable: true })
  photo_url: string | null;

  @Column({ type: 'text', nullable: true })
  faculty: string | null;

  @Column({ nullable: true })
  semester: number;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ default: 0 })
  rating_count: number;

  @Column({ default: 0 })
  exchanges_count: number;

  @Column({ default: false })
  is_profile_complete: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}