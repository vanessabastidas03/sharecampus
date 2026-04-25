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

  @Column({ nullable: true })
  photo_url: string;

  @Column({ nullable: true })
  faculty: string;

  @Column({ nullable: true })
  semester: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}