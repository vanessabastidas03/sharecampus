import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { Item } from './items/item.entity';
import { Chat } from './chats/chat.entity'; 
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    // Carga las variables del .env globalmente
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Conexión a PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        host: configService.get<string>('POSTGRES_HOST'),
        port: configService.get<number>('POSTGRES_PORT'),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        entities: [User, Item, Chat],
        synchronize: false,   // NUNCA true en producción
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        migrationsRun: true, // Las migraciones se corren manualmente
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' 
          ? { rejectUnauthorized: false } 
          : false,
      }),
      inject: [ConfigService],
    }),
    CloudinaryModule,
  ],
})
export class AppModule {}