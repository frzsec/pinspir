import { randomUUID } from 'node:crypto';

export interface IUuidGenerator {
  generate(): string;
}

export class SystemUuidGenerator implements IUuidGenerator {
  generate(): string {
    return randomUUID();
  }
}

export class DeterministicUuidGenerator implements IUuidGenerator {
  private counter = 0;

  constructor(private readonly prefix: string = '00000000-0000-4000-8000') {}

  generate(): string {
    this.counter += 1;
    const suffix = this.counter.toString(16).padStart(12, '0');
    return `${this.prefix}-${suffix}`;
  }

  reset(): void {
    this.counter = 0;
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

export const defaultUuidGenerator: IUuidGenerator = new SystemUuidGenerator();
