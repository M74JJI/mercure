import 'server-only';

import {
  parseWebIdentityEnvironment,
  type WebIdentityEnvironment,
} from './environment';

let cachedEnvironment: WebIdentityEnvironment | undefined;

export function webIdentityEnvironment(): WebIdentityEnvironment {
  cachedEnvironment ??= parseWebIdentityEnvironment(process.env);
  return cachedEnvironment;
}
