import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export async function hashPassphrase(passphrase: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(passphrase, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassphrase(passphrase: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 3 || parts[0] !== 'scrypt') {
      return false;
    }
    const salt = parts[1];
    const key = Buffer.from(parts[2], 'hex');
    const derivedKey = (await scryptAsync(passphrase, salt, KEY_LENGTH)) as Buffer;
    return timingSafeEqual(key, derivedKey);
  } catch {
    return false;
  }
}

export function validatePassphrasePolicy(passphrase: string): { valid: boolean; reason?: string } {
  if (!passphrase || typeof passphrase !== 'string') {
    return { valid: false, reason: 'Kata sandi wajib diisi.' };
  }
  if (passphrase.length < 6) {
    return { valid: false, reason: 'Kata sandi minimal 6 karakter.' };
  }
  if (passphrase.length > 128) {
    return { valid: false, reason: 'Kata sandi maksimal 128 karakter.' };
  }
  return { valid: true };
}
