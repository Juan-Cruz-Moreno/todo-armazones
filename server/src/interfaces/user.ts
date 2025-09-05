import { UserRole, UserStatus } from '@enums/user.enum';

export interface IUser {
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  dni?: string;
  cuit?: string;
  phone?: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date;
  passwordResetAt?: Date;
  passwordResetToken?: string | undefined;
  passwordResetTokenUsed?: boolean;
}
