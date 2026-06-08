import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicUser, UserEntity, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(
    email: string,
    password: string,
    role: UserRole,
  ): Promise<UserEntity> {
    const normalizedEmail = this.normalizeEmail(email);
    const existingUser = await this.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const user = this.usersRepository.create({
      email: normalizedEmail,
      password,
      role,
    });

    return this.usersRepository.save(user);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    const normalizedEmail = this.normalizeEmail(email);

    return this.usersRepository.findOne({ where: { email: normalizedEmail } });
  }

  findById(id: number): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  toPublicUser(user: UserEntity): PublicUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
