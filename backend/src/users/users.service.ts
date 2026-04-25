import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { verification_token: token } });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { reset_password_token: token } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    await this.usersRepository.update(id, data);
  }

  async getProfile(id: string) {
    const user = await this.findById(id);
    if (!user) return null;
    const { password_hash, verification_token, reset_password_token, reset_password_expires, ...profile } = user;
    return {
      ...profile,
      is_profile_complete: !!(user.full_name && user.faculty && user.semester),
      is_verified_badge: user.is_verified,
    };
  }
}