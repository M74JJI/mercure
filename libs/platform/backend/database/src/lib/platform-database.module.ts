import { Module } from '@nestjs/common';

import { PlatformConfigModule } from '@mercure/platform-backend-config';

import { PrismaService } from './prisma.service';

@Module({
  imports: [PlatformConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PlatformDatabaseModule {}
