import { Types } from 'mongoose';
import session from 'express-session';

import { UserRole, UserStatus } from '@enums/user.enum';
import { AppError } from '@utils/AppError';

interface SessionUserData {
  _id: string; // store as string for serialization safety
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  dni?: string;
  cuit?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
}

export function setSessionUser(session: session.Session & Partial<session.SessionData>, user: SessionUserData) {
  session.user = {
    _id: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    ...(user.firstName && { firstName: user.firstName }),
    ...(user.lastName && { lastName: user.lastName }),
    ...(user.dni && { dni: user.dni }),
    ...(user.cuit && { cuit: user.cuit }),
    ...(user.phone && { phone: user.phone }),
    role: user.role,
    status: user.status,
  };
}

export function getSessionUserId(session: session.Session & Partial<session.SessionData>): Types.ObjectId {
  if (!session.user || !session.user._id) {
    throw new AppError('User ID is required', 400, 'fail', true);
  }
  try {
    return new Types.ObjectId(session.user._id);
  } catch (_err) {
    throw new AppError('Invalid session user id', 400, 'fail', true);
  }
}

export function getSessionUser(session: session.Session & Partial<session.SessionData>): SessionUserData {
  if (!session.user) {
    throw new AppError('User session data is required', 400, 'fail', true);
  }
  return session.user as unknown as SessionUserData;
}
