import { UserRole, UserStatus } from '@enums/user.enum';

export interface RegisterRequestDto {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponseDto {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
