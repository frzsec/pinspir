import { randomBytes } from 'node:crypto';

// Unambiguous alphabet excluding 0, O, 1, I, L
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const ALPHABET_LENGTH = ALPHABET.length;

export function generateRandomPlayerCode(): string {
  const bytes = randomBytes(7);
  let codePart1 = '';
  for (let i = 0; i < 4; i++) {
    codePart1 += ALPHABET[bytes[i] % ALPHABET_LENGTH];
  }
  let codePart2 = '';
  for (let i = 4; i < 7; i++) {
    codePart2 += ALPHABET[bytes[i] % ALPHABET_LENGTH];
  }
  return `FOX-${codePart1}-${codePart2}`;
}

export function normalizePlayerCode(rawInput: string): string {
  if (!rawInput) return '';
  const cleaned = rawInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (cleaned.startsWith('FOX')) {
    const rest = cleaned.slice(3);
    if (rest.length === 7) {
      return `FOX-${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
  }

  // If user only typed the 7 alphanumeric characters without FOX prefix
  if (cleaned.length === 7) {
    return `FOX-${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }

  return rawInput.trim().toUpperCase();
}

const PLAYER_CODE_REGEX = /^FOX-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{3}$/;

export function isValidPlayerCode(code: string): boolean {
  return PLAYER_CODE_REGEX.test(code);
}

export function playerCodeToTechnicalEmail(playerCode: string): string {
  const normalized = normalizePlayerCode(playerCode);
  return `${normalized.toLowerCase()}@finspire.invalid`;
}
