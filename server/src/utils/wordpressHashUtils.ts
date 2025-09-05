// src/utils/wordpressHashUtils.ts
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export function isModernWpHash(hash: string): boolean {
  return typeof hash === 'string' && hash.startsWith('$wp$');
}

export async function verifyModernWpPassword(plainPassword: string, wpHash: string): Promise<boolean> {
  if (!isModernWpHash(wpHash)) {
    throw new Error('Hash inválido: no es un hash moderno de WordPress ($wp$)');
  }

  // quita el prefijo "$wp" → queda "$2y$..."
  let bcryptHash = wpHash.slice(3);

  // WordPress >= 6.8: prehash con HMAC-SHA384 (key "wp-sha384"), luego base64
  const base64Password = crypto.createHmac('sha384', 'wp-sha384').update(plainPassword.trim(), 'utf8').digest('base64');

  // normalizar prefijo $2y$ → $2b$ para compatibilidad
  if (bcryptHash.startsWith('$2y$')) {
    bcryptHash = '$2b$' + bcryptHash.slice(4);
  }

  return bcrypt.compare(base64Password, bcryptHash);
}
