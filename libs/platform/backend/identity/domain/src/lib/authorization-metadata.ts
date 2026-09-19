import type { MercureCapability } from './principal';

export const PUBLIC_ROUTE_METADATA = 'mercure:identity:public-route';
export const REQUIRED_CAPABILITIES_METADATA = 'mercure:identity:required-capabilities';

export interface CapabilityRequirement {
  readonly capabilities: readonly MercureCapability[];
}
