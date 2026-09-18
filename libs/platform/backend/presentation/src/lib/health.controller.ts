import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { READINESS_SERVICE, type ReadinessService } from '@mercure/platform-backend-health';

interface LivenessResponse {
  status: 'up';
}

interface ReadinessResponse {
  status: 'ready';
  checks: Readonly<Record<string, 'up'>>;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(READINESS_SERVICE) private readonly readinessService: ReadinessService) {}

  @Get('live')
  @ApiOperation({ summary: 'Process liveness probe' })
  live(): LivenessResponse {
    return { status: 'up' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Service readiness probe' })
  async ready(): Promise<ReadinessResponse> {
    const readiness = await this.readinessService.check();

    if (!readiness.ready) {
      throw new ServiceUnavailableException('Service readiness checks failed.');
    }

    return {
      status: 'ready',
      checks: readiness.checks,
    };
  }
}
