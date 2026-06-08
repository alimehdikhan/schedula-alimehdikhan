import { ConflictException, Injectable } from '@nestjs/common';
import { PublicUser, UserEntity, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  // Keeps Day 2 self-contained until the project adds a real database repository.
  private readonly users: UserEntity[] = [];
  private nextId = 1;

  create(email: string, passwordHash: string, role: UserRole): UserEntity {
    const normalizedEmail = this.normalizeEmail(email);
    const existingUser = this.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const user: UserEntity = {
      id: this.nextId,
      email: normalizedEmail,
      passwordHash,
      role,
      createdAt: new Date(),
    };

    this.nextId += 1;
    this.users.push(user);

    return user;
  }

  findByEmail(email: string): UserEntity | undefined {
    const normalizedEmail = this.normalizeEmail(email);

    return this.users.find((user) => user.email === normalizedEmail);
  }

  findById(id: number): UserEntity | undefined {
    return this.users.find((user) => user.id === id);
  }

  toPublicUser(user: UserEntity): PublicUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
