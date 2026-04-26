import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum ReportCategory {
  FRAUDULENTO = 'fraudulento',
  INAPROPIADO = 'inapropiado',
  SPAM = 'spam',
  OTRO = 'otro',
}

export enum ReportTargetType {
  ITEM = 'item',
  PERFIL = 'perfil',
  CHAT = 'chat',
}

export enum ReportStatus {
  PENDIENTE = 'pendiente',
  REVISADO = 'revisado',
  RESUELTO = 'resuelto',
  DESCARTADO = 'descartado',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reporter_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ type: 'enum', enum: ReportTargetType })
  target_type: ReportTargetType;

  @Column({ type: 'text' })
  target_id: string;

  @Column({ type: 'enum', enum: ReportCategory })
  category: ReportCategory;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDIENTE })
  status: ReportStatus;

  @Column({ default: false })
  action_taken: boolean;

  @CreateDateColumn()
  created_at: Date;
}