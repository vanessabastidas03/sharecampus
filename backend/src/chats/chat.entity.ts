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
import { Item } from '../items/item.entity';

export enum ChatStatus {
  ACTIVO = 'activo',
  ACEPTADO = 'aceptado',
  RECHAZADO = 'rechazado',
  COMPLETADO = 'completado',
  BLOQUEADO = 'bloqueado',
}

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  item_id: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column()
  sender_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column()
  receiver_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @Column({ type: 'enum', enum: ChatStatus, default: ChatStatus.ACTIVO })
  status: ChatStatus;

  @Column({ type: 'text', nullable: true })
  confirmation_code: string | null;

  @Column({ type: 'text', nullable: true })
  confirmation_expires: string | null;

  @Column({ default: false })
  is_confirmed: boolean;

  @Column({ default: false })
  sender_blocked: boolean;

  @Column({ default: false })
  receiver_blocked: boolean;

  @Column({ type: 'text', nullable: true })
  firebase_chat_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
