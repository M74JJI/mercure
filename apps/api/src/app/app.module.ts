import { Module } from '@nestjs/common';

import { PlatformBackendModule } from '@mercure/platform-backend-feature';
import { RulesBackendModule } from '@mercure/rules-backend-feature';
// module-generator:imports

@Module({
  imports: [
    PlatformBackendModule,
    RulesBackendModule,
    // module-generator:modules
  ],
})
export class AppModule {}
