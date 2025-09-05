import jwt from 'jsonwebtoken';
import env from '@config/env';

const RESET_PASSWORD_SECRET = env.RESET_PASSWORD_SECRET || env.SESSION_SECRET;
const RESET_PASSWORD_EXPIRATION = '30m'; // 30 minutos

export interface ResetPasswordTokenPayload {
  userId: string;
  email: string;
  purpose: 'reset-password';
}

export function generateResetPasswordToken(payload: { userId: string; email: string }) {
  const tokenPayload: ResetPasswordTokenPayload = {
    ...payload,
    purpose: 'reset-password',
  };
  return jwt.sign(tokenPayload, RESET_PASSWORD_SECRET, {
    expiresIn: RESET_PASSWORD_EXPIRATION,
  });
}

export function verifyResetPasswordToken(token: string): ResetPasswordTokenPayload {
  const decoded = jwt.verify(token, RESET_PASSWORD_SECRET) as ResetPasswordTokenPayload;
  if (decoded.purpose !== 'reset-password') {
    throw new Error('Token de propósito inválido');
  }
  return decoded;
}

export function getResetTokenIat(token: string): number | null {
  const decoded = jwt.decode(token) as { iat?: number } | null;
  return decoded && decoded.iat ? decoded.iat : null;
}
