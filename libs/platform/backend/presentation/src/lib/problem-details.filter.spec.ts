import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ProblemDetailsFilter, safeErrorTrace } from './problem-details.filter';

function httpHost(request: { readonly id?: string; readonly url: string }) {
  const send = vi.fn();
  const status = vi.fn(() => ({ send }));
  const type = vi.fn(() => ({ status }));
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ type }),
    }),
  };

  return {
    host,
    send,
    status,
    type,
  };
}

describe('ProblemDetailsFilter error logging', () => {
  it('keeps stack frames without logging exception-message content', () => {
    const secretXml = '<rule id="999999"><description>sensitive customer XML</description></rule>';
    const error = new Error(secretXml);
    error.stack = [
      'Error: ' + secretXml,
      '    at ValidateRulesAuthoringDraft.execute (/app/rules-authoring.ts:250:12)',
      '    at async RulesAuthoringController.validate (/app/rules-authoring.controller.ts:220:5)',
    ].join('\n');

    const trace = safeErrorTrace(error);

    expect(trace).toContain('ValidateRulesAuthoringDraft.execute');
    expect(trace).toContain('RulesAuthoringController.validate');
    expect(trace).not.toContain('sensitive customer XML');
    expect(trace).not.toContain('<rule');
  });

  it('returns undefined when no call frames are available', () => {
    const error = new Error('sensitive detail');
    error.stack = 'Error: sensitive detail';

    expect(safeErrorTrace(error)).toBeUndefined();
  });

  it('never exposes explicit 5xx exception details to the client', () => {
    const { host, send } = httpHost({
      id: 'server-request-id',
      url: '/api/v1/rules/snapshots/import',
    });

    new ProblemDetailsFilter().catch(
      new HttpException(
        'postgresql://secret-user:secret-password@database.internal/mercure',
        HttpStatus.SERVICE_UNAVAILABLE,
      ),
      host as never,
    );

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Service Unavailable',
        status: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'SERVICE_UNAVAILABLE',
        detail: 'An unexpected error occurred.',
        requestId: 'server-request-id',
      }),
    );
    expect(JSON.stringify(send.mock.calls)).not.toContain('secret-password');
  });

  it('preserves bounded 4xx exception details', () => {
    const { host, send } = httpHost({
      id: 'server-request-id',
      url: '/api/v1/rules/drafts/not-found',
    });

    new ProblemDetailsFilter().catch(
      new HttpException('Draft not found.', HttpStatus.NOT_FOUND),
      host as never,
    );

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HttpStatus.NOT_FOUND,
        detail: 'Draft not found.',
      }),
    );
  });

  it('joins bounded string-array exception details', () => {
    const { host, send } = httpHost({
      id: 'array-request-id',
      url: '/api/v1/rules/drafts',
    });

    new ProblemDetailsFilter().catch(
      new HttpException(
        {
          message: ['File name is required.', 'Tenant is invalid.'],
        },
        HttpStatus.BAD_REQUEST,
      ),
      host as never,
    );

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HttpStatus.BAD_REQUEST,
        detail: 'File name is required.; Tenant is invalid.',
      }),
    );
  });

  it('uses the bounded status fallback for unrecognized exception response shapes', () => {
    const { host, send } = httpHost({
      id: 'fallback-request-id',
      url: '/api/v1/rules/drafts',
    });

    new ProblemDetailsFilter().catch(
      new HttpException({ error: 'bad-request' }, HttpStatus.BAD_REQUEST),
      host as never,
    );

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Bad Request',
        code: 'BAD_REQUEST',
        detail: 'Bad Request',
      }),
    );
  });

  it.each([
    [HttpStatus.UNAUTHORIZED, 'Unauthorized', 'UNAUTHORIZED'],
    [HttpStatus.FORBIDDEN, 'Forbidden', 'FORBIDDEN'],
    [HttpStatus.NOT_FOUND, 'Not Found', 'NOT_FOUND'],
    [HttpStatus.CONFLICT, 'Conflict', 'CONFLICT'],
    [HttpStatus.UNPROCESSABLE_ENTITY, 'Unprocessable Entity', 'UNPROCESSABLE_ENTITY'],
    [HttpStatus.TOO_MANY_REQUESTS, 'Too Many Requests', 'TOO_MANY_REQUESTS'],
  ])('maps HTTP status %i to a stable problem contract', (statusCode, title, code) => {
    const { host, send } = httpHost({
      id: 'mapped-request-id',
      url: '/api/v1/rules/resource?include=sensitive-query',
    });

    new ProblemDetailsFilter().catch(new HttpException(title, statusCode), host as never);

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: `urn:mercure:error:${code.toLowerCase().replaceAll('_', '-')}`,
        title,
        status: statusCode,
        code,
        instance: '/api/v1/rules/resource',
        requestId: 'mapped-request-id',
      }),
    );
  });

  it('uses generic client problem metadata for an unmapped non-5xx status', () => {
    const { host, send } = httpHost({
      id: 'teapot-request-id',
      url: '/api/v1/rules/resource',
    });

    new ProblemDetailsFilter().catch(
      new HttpException('Bounded client detail.', HttpStatus.I_AM_A_TEAPOT),
      host as never,
    );

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Request Failed',
        status: HttpStatus.I_AM_A_TEAPOT,
        code: 'REQUEST_FAILED',
        detail: 'Bounded client detail.',
      }),
    );
  });

  it('redacts unknown server errors and normalizes missing request metadata', () => {
    const { host, send } = httpHost({
      url: '/api/v1/rules/resource?token=must-not-be-reflected',
    });
    const exception = new Error('database password must not leak');

    new ProblemDetailsFilter().catch(exception, host as never);

    expect(send).toHaveBeenCalledWith({
      type: 'urn:mercure:error:internal-error',
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      detail: 'An unexpected error occurred.',
      instance: '/api/v1/rules/resource',
      requestId: 'unknown',
    });
    expect(JSON.stringify(send.mock.calls)).not.toContain('database password must not leak');
    expect(JSON.stringify(send.mock.calls)).not.toContain('must-not-be-reflected');
  });
});
