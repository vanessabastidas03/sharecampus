import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat, ChatStatus } from './chat.entity';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat)
    private chatsRepository: Repository<Chat>,
    private firebaseService: FirebaseService,
    private usersService: UsersService,
  ) {}

  async createChat(senderId: string, itemId: string, receiverId: string): Promise<Chat> {
    const activeChats = await this.chatsRepository.count({
      where: [
        { sender_id: senderId, status: ChatStatus.ACTIVO },
        { sender_id: senderId, status: ChatStatus.ACEPTADO },
      ],
    });

    if (activeChats >= 10) {
      throw new BadRequestException('Has alcanzado el límite de 10 chats activos simultáneos');
    }

    const existing = await this.chatsRepository.findOne({
      where: { sender_id: senderId, item_id: itemId, receiver_id: receiverId },
    });
    if (existing) return existing;

    const firebaseChatId = `chat_${senderId}_${receiverId}_${itemId}_${Date.now()}`;
    const db = this.firebaseService.getDatabase();
    await db.ref(`chats/${firebaseChatId}/metadata`).set({
      created_at: new Date().toISOString(),
      item_id: itemId,
      sender_id: senderId,
      receiver_id: receiverId,
      status: ChatStatus.ACTIVO,
    });

    const chat = this.chatsRepository.create({
      item_id: itemId,
      sender_id: senderId,
      receiver_id: receiverId,
      firebase_chat_id: firebaseChatId,
    });
    return this.chatsRepository.save(chat);
  }

  async sendMessage(userId: string, chatId: string, message: string): Promise<void> {
    const chat = await this.chatsRepository.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat no encontrado');
    if (chat.sender_id !== userId && chat.receiver_id !== userId) {
      throw new ForbiddenException('No tienes acceso a este chat');
    }
    if (chat.status === ChatStatus.BLOQUEADO) {
      throw new ForbiddenException('Este chat está bloqueado');
    }

    const db = this.firebaseService.getDatabase();
    await db.ref(`chats/${chat.firebase_chat_id}/messages`).push({
      sender_id: userId,
      message,
      timestamp: new Date().toISOString(),
      type: 'text',
    });

    await db.ref(`chats/${chat.firebase_chat_id}/metadata/last_message`).set({
      text: message,
      sender_id: userId,
      timestamp: new Date().toISOString(),
    });
  }

  async respondToRequest(userId: string, chatId: string, action: 'accept' | 'reject'): Promise<Chat> {
    const chat = await this.chatsRepository.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat no encontrado');
    if (chat.receiver_id !== userId) throw new ForbiddenException('Solo el receptor puede aceptar o rechazar');

    const newStatus = action === 'accept' ? ChatStatus.ACEPTADO : ChatStatus.RECHAZADO;
    await this.chatsRepository.update(chatId, { status: newStatus });

    const db = this.firebaseService.getDatabase();
    await db.ref(`chats/${chat.firebase_chat_id}/metadata/status`).set(newStatus);

    return (await this.chatsRepository.findOne({ where: { id: chatId } })) as Chat;
  }
  async generateConfirmationCode(userId: string, chatId: string): Promise<{ code: string }> {
    const chat = await this.chatsRepository.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat no encontrado');
    if (chat.receiver_id !== userId) throw new ForbiddenException('Solo el dueño del ítem genera el código');
    if (chat.status !== ChatStatus.ACEPTADO) {
      throw new BadRequestException('El intercambio debe estar aceptado antes de generar el código');
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    await this.chatsRepository.update(chatId, {
      confirmation_code: code,
      confirmation_expires: expires,
    });

    return { code };
  }

  async confirmDelivery(userId: string, chatId: string, code: string): Promise<{ message: string }> {
    const chat = await this.chatsRepository.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat no encontrado');
    if (chat.sender_id !== userId) throw new ForbiddenException('Solo quien recibe el ítem confirma la entrega');
    if (chat.confirmation_code !== code) throw new BadRequestException('Código incorrecto');
    if (new Date() > new Date(chat.confirmation_expires!)) {
      throw new BadRequestException('El código ha expirado');
    }

    await this.chatsRepository.update(chatId, {
      status: ChatStatus.COMPLETADO,
      is_confirmed: true,
    });

    await this.usersService.update(chat.receiver_id, {
      exchanges_count: ((await this.usersService.findById(chat.receiver_id))?.exchanges_count ?? 0) + 1,
    });

    return { message: 'Entrega confirmada. Por favor califica al otro usuario.' };
  }

  async blockChat(userId: string, chatId: string): Promise<void> {
    const chat = await this.chatsRepository.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat no encontrado');
    if (chat.sender_id !== userId && chat.receiver_id !== userId) {
      throw new ForbiddenException('No tienes acceso a este chat');
    }

    await this.chatsRepository.update(chatId, { status: ChatStatus.BLOQUEADO });
    const db = this.firebaseService.getDatabase();
    await db.ref(`chats/${chat.firebase_chat_id}/metadata/status`).set(ChatStatus.BLOQUEADO);
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    return this.chatsRepository.find({
      where: [{ sender_id: userId }, { receiver_id: userId }],
      relations: ['item', 'sender', 'receiver'],
      order: { updated_at: 'DESC' },
    });
  }

  async getMessages(userId: string, chatId: string): Promise<any> {
    const chat = await this.chatsRepository.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat no encontrado');
    if (chat.sender_id !== userId && chat.receiver_id !== userId) {
      throw new ForbiddenException('No tienes acceso a este chat');
    }

    const db = this.firebaseService.getDatabase();
    const snapshot = await db.ref(`chats/${chat.firebase_chat_id}/messages`).once('value');
    const messages = snapshot.val() || {};
    return Object.values(messages).sort((a: any, b: any) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }
}