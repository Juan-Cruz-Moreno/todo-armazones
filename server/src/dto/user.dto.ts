export interface UpdateUserRequestDto {
  displayName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  dni?: string;
  cuit?: string;
  phone?: string;
}
import { UserRole, UserStatus } from '@enums/user.enum';

export interface getUserResponseDto {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetUsersPaginatedResponse {
  users: getUserResponseDto[];
  nextCursor: string | null;
}
