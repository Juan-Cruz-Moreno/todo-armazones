export function isArgon2Hash(hash: string): boolean {
  return hash.startsWith('$argon2id$');
}
