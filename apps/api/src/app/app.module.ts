import { Module } from '@nestjs/common';

import { PlatformBackendModule } from '@mercure/platform-backend-feature';
import { RulesBackendModule } from '@mercure/rules-backend-feature';

@Module({
  imports: [PlatformBackendModule, RulesBackendModule],
})
export class AppModule {}
