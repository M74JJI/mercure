import { describe, expect, it } from 'vitest';

import { PLATFORM_LOG_REDACTION_PATHS } from './platform-logging.module';

describe('platform log redaction policy', () => {
  it('redacts credentials and sensitive Rules authoring bodies', () => {
    expect(PLATFORM_LOG_REDACTION_PATHS).toEqual(
      expect.arrayContaining([
        'req.headers.authorization',
        'req.headers.cookie',
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
});
