import { AuthService } from '../services/auth.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';

const mockAuthService = {
  login: jest.fn(),
  register: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return a token', async () => {
      const result = { access_token: 'token' };
      jest.spyOn(service, 'login').mockResolvedValue(result);

      expect(await controller.login({ username: 'user', password: 'pass' })).toBe(result);
    });
  });

  describe('register', () => {
    it('should return a user', async () => {
      const result = { id: 1, username: 'user' };
      jest.spyOn(service, 'register').mockResolvedValue(result);

      expect(await controller.register({ username: 'user', password: 'pass' })).toBe(result);
    });
  });
});