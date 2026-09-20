import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

interface ProblemDetailIssue {
  path: string;
  code: string;
  message: string;
}

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string;
  instance: string;
  requestId: string;
  details?: ProblemDetailIssue[];
}

function statusTitle(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'Bad Request';
    case HttpStatus.UNAUTHORIZED:
      return 'Unauthorized';
    case HttpStatus.FORBIDDEN:
      return 'Forbidden';
    case HttpStatus.NOT_FOUND:
      return 'Not Found';
    case HttpStatus.CONFLICT:
      return 'Conflict';
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'Unprocessable Entity';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'Too Many Requests';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'Service Unavailable';
    default:
      return status >= 500 ? 'Internal Server Error' : 'Request Failed';
  }
}

function statusCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'BAD_REQUEST';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'UNPROCESSABLE_ENTITY';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'TOO_MANY_REQUESTS';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'SERVICE_UNAVAILABLE';
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED';
  }
}

export function safeErrorTrace(error: Error): string | undefined {
  const frames = error.stack
    ?.split('\n')
    .filter((line) => /^\s*at\s/.test(line))
    .join('\n');

  return frames?.trim() ? frames : undefined;
}

function detailFromResponse(response: unknown, fallback: string): string {
  if (typeof response === 'string') {
    return response;
  }

  if (typeof response === 'object' && response !== null && 'message' in response) {
    const message = Reflect.get(response, 'message');
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message) && message.every((value) => typeof value === 'string')) {
      return message.join('; ');
    }
  }

  return fallback;
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const reply = context.getResponse<FastifyReply>();
    const requestId = String(request.id ?? request.headers['x-request-id'] ?? 'unknown');
    const instance = request.url.split('?')[0] || request.url;

    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError();
      const details =
        zodError instanceof ZodError
          ? zodError.issues.map((issue) => ({
              path: issue.path.map(String).join('.'),
              code: issue.code,
              message: issue.message,
            }))
          : [];
      const problem: ProblemDetails = {
        type: 'urn:mercure:error:validation-error',
        title: 'Validation Error',
        status: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        detail: 'The request did not satisfy the API contract.',
        instance,
        requestId,
        details,
      };
      reply.type('application/problem+json').status(problem.status).send(problem);
      return;
    }

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const code = statusCode(status);
    const fallbackDetail = status >= 500 ? 'An unexpected error occurred.' : statusTitle(status);
    const detail =
      exception instanceof HttpException
        ? detailFromResponse(exception.getResponse(), fallbackDetail)
        : fallbackDetail;

    if (status >= 500) {
      this.logger.error(
        'Unhandled request exception',
        exception instanceof Error ? safeErrorTrace(exception) : undefined,
      );
    }

    const problem: ProblemDetails = {
      type: `urn:mercure:error:${code.toLowerCase().replaceAll('_', '-')}`,
      title: statusTitle(status),
      status,
      code,
      detail,
      instance,
      requestId,
    };

    reply.type('application/problem+json').status(status).send(problem);
  }
}
