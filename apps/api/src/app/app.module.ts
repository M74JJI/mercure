import { Module } from '@nestjs/common';

import { PlatformBackendModule } from '@mercure/platform-backend-feature';

@Module({
  imports: [PlatformBackendModule],
})
export class AppModule {}
