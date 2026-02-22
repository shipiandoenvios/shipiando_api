import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ExceptionResponse {
  message?: string | string[];
  error?: string;
  errors?: string | string[];
  messages?: string | string[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | undefined = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const excRes = exception.getResponse();

      if (typeof excRes === 'string') {
        message = excRes;
      } else if (excRes && typeof excRes === 'object') {
        const typedRes = excRes as ExceptionResponse;
        const maybeMessage =
          typedRes.message ??
          typedRes.error ??
          typedRes.errors ??
          typedRes.messages;
        if (Array.isArray(maybeMessage)) message = maybeMessage.join(', ');
        else if (typeof maybeMessage === 'string') message = maybeMessage;
        error = typedRes.error ?? error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
