import { describe, expect, it, vi } from 'vitest';

import {
  createPlatformLoggingParams,
  PLATFORM_LOG_REDACTION_PATHS,
} from './platform-logging.module';

describe('platform log redaction policy', () => {
  it('redacts credentials and sensitive Rules authoring bodies', () => {
    expect(PLATFORM_LOG_REDACTION_PATHS).toEqual(
      expect.arrayContaining([
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers.x-request-id',
        'res.headers.set-cookie',
        'req.body.password',
        'req.body.token',
        'req.body.accessToken',
        'req.body.refreshToken',
        'req.body.secret',
        'req.body.apiKey',
        'req.body.content',
        'req.body.xml',
        'req.body.rawXml',
      ]),
    );
  });

  it('constructs bounded structured logging options from platform configuration', () => {
    const params = createPlatformLoggingParams({
      logLevel: 'debug',
      nodeEnvironment: 'test',
      serviceName: 'mercure-test-api',
    });

    expect(params).toMatchObject({
      pinoHttp: {
        level: 'debug',
        base: {
          service: 'mercure-test-api',
          environment: 'test',
        },
        autoLogging: true,
        quietReqLogger: false,
        redact: {
          paths: PLATFORM_LOG_REDACTION_PATHS,
          remove: true,
        },
      },
    });
  });

  it('generates a request ID and exposes the same value in the response header', () => {
    const params = createPlatformLoggingParams({
      logLevel: 'info',
      nodeEnvironment: 'test',
      serviceName: 'mercure-test-api',
    });

    if (!params.pinoHttp || typeof params.pinoHttp !== 'object') {
      throw new Error('Expected object-based pino HTTP configuration.');
    }

    const genReqId = Reflect.get(params.pinoHttp, 'genReqId');
    if (typeof genReqId !== 'function') {
      throw new Error('Expected pino HTTP request-ID generator.');
    }

    const response = {
      setHeader: vi.fn(),
    };
    const requestId = Reflect.apply(genReqId, params.pinoHttp, [{}, response]);

    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(response.setHeader).toHaveBeenCalledWith('x-request-id', requestId);
  });
});
