import 'reflect-metadata';

import { bootstrapApi } from '@mercure/platform-backend-feature';

import { AppModule } from './app/app.module';

void bootstrapApi(AppModule);
