import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';

import { READINESS_SERVICE, type ReadinessService } from '@mercure/platform-backend-health';

interface LivenessResponse {
  status: 'up';
}

interface ReadinessResponse {
  status: 'ready';
  checks: Readonly<Record<string, 'up'>>;
}

class LivenessResponseDocument {
  @ApiProperty({ enum: ['up'] })
  readonly status = 'up' as const;
}

class ReadinessResponseDocument {
  @ApiProperty({ enum: ['ready'] })
  readonly status = 'ready' as const;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
      enum: ['up'],
    },
  })
  readonly checks: Record<string, 'up'> = {};
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(READINESS_SERVICE) private readonly readinessService: ReadinessService) {}

  @Get('live')
  @ApiOperation({ summary: 'Process liveness probe' })
  @ApiOkResponse({ type: LivenessResponseDocument })
  live(): LivenessResponse {
    return { status: 'up' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Service readiness probe' })
  @ApiOkResponse({ type: ReadinessResponseDocument })
  @ApiServiceUnavailableResponse({
    description: 'One or more readiness dependencies are unavailable.',
  })
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
