import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import type { ErrorResponse } from '@repo/types';

/**
 * Global exception filter.
 * Wraps every thrown error in an ErrorResponse envelope. User-friendly messages
 * only — no stack traces, no internal details, no SQL errors leak out.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Something went wrong. Please try again.';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errResponse = exception.getResponse();
      if (typeof errResponse === 'string') {
        message = errResponse;
      } else if (typeof errResponse === 'object' && errResponse !== null) {
        const obj = errResponse as Record<string, unknown>;
        message = (obj.message as string) ?? message;
        code = (obj.code as string) ?? `HTTP_${status}`;
        details = obj.details;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    const body: ErrorResponse = {
      success: false,
      error: { code, message, details },
    };

    this.logger.warn(`${req.method} ${req.url} → ${status} ${code}`);
    res.status(status).json(body);
  }
}
