import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { ReadinessService } from '@mercure/platform-backend-health';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports process liveness without probing dependencies', () => {
    const readinessService = {
      check: vi.fn(),
    };
    const controller = new HealthController(readinessService as unknown as ReadinessService);

    expect(controller.live()).toEqual({ status: 'up' });
    expect(readinessService.check).not.toHaveBeenCalled();
  });

  it('reports readiness with successful dependency checks', async () => {
    const readinessService = {
      check: vi.fn().mockResolvedValue({
        ready: true,
        checks: {
          database: 'up',
        },
        failedChecks: [],
      }),
    };
    const controller = new HealthController(readinessService as unknown as ReadinessService);

    await expect(controller.ready()).resolves.toEqual({
      status: 'ready',
      checks: {
        database: 'up',
      },
    });
  });

  it('fails readiness when a dependency check is unavailable', async () => {
    const readinessService = {
      check: vi.fn().mockResolvedValue({
        ready: false,
        checks: {},
        failedChecks: ['database'],
      }),
    };
    const controller = new HealthController(readinessService as unknown as ReadinessService);

    await expect(controller.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
