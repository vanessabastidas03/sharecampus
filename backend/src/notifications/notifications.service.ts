import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceToken } from './device-token.entity';
import { FirebaseService } from '../firebase/firebase.service';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
    private firebaseService: FirebaseService,
  ) {}

  async registerToken(
    userId: string,
    token: string,
    platform: string,
  ): Promise<void> {
    const existing = await this.deviceTokenRepository.findOne({
      where: { user_id: userId, token },
    });
    if (!existing) {
      await this.deviceTokenRepository.save({
        user_id: userId,
        token,
        platform,
      });
    }
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    const tokens = await this.deviceTokenRepository.find({
      where: { user_id: userId, is_active: true },
    });

    if (tokens.length === 0) {
      await this.sendEmailFallback(userId, title, body);
      return;
    }

    const messages = tokens.map((t) => ({
      token: t.token,
      notification: { title, body },
      data: data ? { payload: JSON.stringify(data) } : undefined,
    }));

    for (const message of messages) {
      try {
        await admin.messaging().send(message);
      } catch (error) {
        await this.deviceTokenRepository.update(
          { token: message.token },
          { is_active: false },
        );
        await this.sendEmailFallback(userId, title, body);
      }
    }
  }

  async notifyNewMessage(
    receiverId: string,
    senderName: string,
    itemTitle: string,
  ): Promise<void> {
    await this.sendPushNotification(
      receiverId,
      '💬 Nuevo mensaje',
      `${senderName} te escribió sobre "${itemTitle}"`,
      { type: 'new_message' },
    );
  }

  async notifyItemInterest(ownerId: string, itemTitle: string): Promise<void> {
    await this.sendPushNotification(
      ownerId,
      '👀 Alguien está interesado',
      `Alguien marcó interés en tu ítem "${itemTitle}"`,
      { type: 'item_interest' },
    );
  }

  async notifyWishlistMatch(
    userId: string,
    itemTitle: string,
    category: string,
  ): Promise<void> {
    await this.sendPushNotification(
      userId,
      '🎯 ¡Encontramos algo para ti!',
      `Apareció "${itemTitle}" en ${category} que coincide con tu lista de deseos`,
      { type: 'wishlist_match' },
    );
  }

  private async sendEmailFallback(
    userId: string,
    title: string,
    body: string,
  ): Promise<void> {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      await transporter.sendMail({
        from: '"ShareCampus" <noreply@sharecampus.app>',
        to: process.env.SMTP_USER,
        subject: `ShareCampus: ${title}`,
        html: `<p>${body}</p>`,
      });
    } catch (e) {
      console.error('Email fallback failed:', e);
    }
  }
}
