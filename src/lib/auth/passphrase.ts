import { hashPassword, verifyPassword } from 'better-auth/crypto';

export function validatePassphrasePolicy(passphrase: unknown): { valid: boolean; reason?: string } {
  if (!passphrase || typeof passphrase !== 'string') {
    return { valid: false, reason: 'Passphrase harus berupa string.' };
  }
  if (passphrase.length < 8) {
    return { valid: false, reason: 'Passphrase minimal 8 karakter.' };
  }
  return { valid: true };
}

export async function hashPassphrase(passphrase: string): Promise<string> {
  return hashPassword(passphrase);
}

export async function verifyPassphrase(passphrase: string, hash: string): Promise<boolean> {
  return verifyPassword({ password: passphrase, hash });
}
