import { Test, TestingModule } from '@nestjs/testing';
import { ChatsService } from './chats.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Chat } from './chat.entity';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';

describe('ChatsService', () => {
  let service: ChatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatsService,
        { provide: getRepositoryToken(Chat), useValue: {} },
        { provide: FirebaseService, useValue: {} },
        { provide: UsersService, useValue: {} },
      ],
    }).compile();
    service = module.get<ChatsService>(ChatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
