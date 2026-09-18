import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { PlatformConfig } from '@mercure/platform-backend-config';
import type { ReadinessProbe } from '@mercure/platform-backend-health';

import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy, ReadinessProbe {
  readonly name = 'database';
  private readonly healthTimeoutMs: number;

  constructor(@Inject(PlatformConfig) config: PlatformConfig) {
    const adapter = new PrismaPg({
      connectionString: config.databaseUrl,
      max: config.databasePoolMax,
      connectionTimeoutMillis: config.databaseConnectionTimeoutMs,
      idleTimeoutMillis: config.databaseIdleTimeoutMs,
    });

    super({ adapter });
    this.healthTimeoutMs = config.databaseHealthTimeoutMs;
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async check(): Promise<void> {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      await Promise.race([
        this.$queryRaw`SELECT 1`,
        new Promise<never>((_resolve, reject) => {
          timeout = setTimeout(
            () => reject(new Error('Database readiness probe timed out.')),
            this.healthTimeoutMs,
          );
        }),
      ]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}
