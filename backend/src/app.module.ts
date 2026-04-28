import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { ItemsModule } from './items/items.module';
import { ChatsModule } from './chats/chats.module';
import { FirebaseModule } from './firebase/firebase.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { ReportsModule } from './reports/reports.module';
import { User } from './users/user.entity';
import { Item } from './items/item.entity';
import { Chat } from './chats/chat.entity';
import { DeviceToken } from './notifications/device-token.entity';
import { Wishlist } from './wishlist/wishlist.entity';
import { Report } from './reports/report.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Item, Chat, DeviceToken, Wishlist, Report],
      synchronize: true,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    }),
    FirebaseModule,
    UsersModule,
    AuthModule,
    ProfileModule,
    ItemsModule,
    ChatsModule,
    NotificationsModule,
    WishlistModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
