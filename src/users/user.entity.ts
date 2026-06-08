export enum UserRole {
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
}

export interface UserEntity {
  id: number;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

export type PublicUser = Omit<UserEntity, 'passwordHash'>;
