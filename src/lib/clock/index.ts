export interface IClockProvider {
  now(): Date;
  nowIso(): string;
  todayWib(): string; // Format: YYYY-MM-DD
}

export class SystemClockProvider implements IClockProvider {
  now(): Date {
    return new Date();
  }

  nowIso(): string {
    return this.now().toISOString();
  }

  todayWib(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(this.now());
  }
}

export class MockClockProvider implements IClockProvider {
  private currentTime: Date;

  constructor(initialIsoString: string = '2026-03-21T10:00:00.000Z') {
    this.currentTime = new Date(initialIsoString);
  }

  setTime(isoString: string): void {
    this.currentTime = new Date(isoString);
  }

  advanceHours(hours: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + hours * 3600 * 1000);
  }

  advanceDays(days: number): void {
    this.advanceHours(days * 24);
  }

  now(): Date {
    return new Date(this.currentTime.getTime());
  }

  nowIso(): string {
    return this.currentTime.toISOString();
  }

  todayWib(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(this.currentTime);
  }
}

export const defaultClock: IClockProvider = new SystemClockProvider();

export function getSystemClock(): IClockProvider {
  return defaultClock;
}

