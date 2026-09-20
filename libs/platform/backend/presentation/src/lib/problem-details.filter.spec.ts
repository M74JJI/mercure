import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ProblemDetailsFilter, safeErrorTrace } from './problem-details.filter';

describe('ProblemDetailsFilter error logging', () => {
  it('keeps stack frames without logging exception-message content', () => {
    const secretXml =
      '<rule id="999999"><description>sensitive customer XML</description></rule>';
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
    const send = vi.fn();
    const status = vi.fn(() => ({ send }));
    const type = vi.fn(() => ({ status }));
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({
          id: 'server-request-id',
          url: '/api/v1/rules/snapshots/import',
        }),
        getResponse: () => ({ type }),
      }),
    };

    new ProblemDetailsFilter().catch(
      new HttpException(
        'postgresql://secret-user:secret-password@database.internal/mercure',
        HttpStatus.SERVICE_UNAVAILABLE,
      ),
      host as never,
    );

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: HttpStatus.SERVICE_UNAVAILABLE,
        detail: 'An unexpected error occurred.',
        requestId: 'server-request-id',
      }),
    );
    expect(JSON.stringify(send.mock.calls)).not.toContain('secret-password');
  });

  it('preserves bounded 4xx exception details', () => {
    const send = vi.fn();
    const status = vi.fn(() => ({ send }));
    const type = vi.fn(() => ({ status }));
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({
          id: 'server-request-id',
          url: '/api/v1/rules/drafts/not-found',
        }),
        getResponse: () => ({ type }),
      }),
    };

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
});
