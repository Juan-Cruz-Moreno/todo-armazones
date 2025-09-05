import { UserRole, UserStatus } from '@enums/user.enum';

declare module 'express-session' {
  interface SessionData {
    // Store id as string to be safe across serialization (redis, JSON)
    user: {
      _id: string;
      email: string;
      displayName: string;
      firstName?: string;
      lastName?: string;
      dni?: string;
      cuit?: string;
      phone?: string;
      role: UserRole;
      status: UserStatus;
    };
  }
}
