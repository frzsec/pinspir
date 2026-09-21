import { defaultClock } from '../clock';
import { defaultUuidGenerator } from '../ids';

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'RATE_LIMITED'
  | 'PAYLOAD_TOO_LARGE'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE';

export interface ErrorEnvelope {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    requestId: string;
    serverTime: string;
  };
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, statusCode = 500, code: ErrorCode = 'INTERNAL_SERVER_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Kredensial tidak valid atau sesi telah berakhir.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Anda tidak memiliki hak akses ke sumber daya ini.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Sumber daya yang diminta tidak ditemukan.') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Layanan database sedang tidak tersedia.') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

export function formatErrorEnvelope(
  error: unknown,
  requestId?: string,
  serverTime?: string
): { statusCode: number; status: number; envelope: ErrorEnvelope; body: ErrorEnvelope } {
  const reqId = requestId || defaultUuidGenerator.generate();
  const time = serverTime || defaultClock.nowIso();

  if (error instanceof AppError) {
    const envelope: ErrorEnvelope = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: reqId,
        serverTime: time,
      },
    };
    return {
      statusCode: error.statusCode,
      status: error.statusCode,
      envelope,
      body: envelope,
    };
  }

  // Generic/Internal error - do not leak stack or internal details in production
  console.error('[formatErrorEnvelope] Uncaught error:', error);

  const envelope: ErrorEnvelope = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Terjadi kesalahan internal pada server.',
      requestId: reqId,
      serverTime: time,
    },
  };
  return {
    statusCode: 500,
    status: 500,
    envelope,
    body: envelope,
  };
}

