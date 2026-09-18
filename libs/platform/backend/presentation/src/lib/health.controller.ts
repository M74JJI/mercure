import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

interface HealthResponse {
  status: 'up' | 'ready';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get('live')
  @ApiOperation({ summary: 'Process liveness probe' })
  live(): HealthResponse {
    return { status: 'up' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Service readiness probe' })
  ready(): HealthResponse {
    return { status: 'ready' };
  }
}
