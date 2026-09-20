export type MercureRole = 'admin' | 'user';

export type MercureCapability = 'platform:read' | 'rules:read' | 'rules:import' | 'rules:admin';

export interface AuthorityRoleMapping {
  readonly admin: readonly string[];
  readonly user: readonly string[];
}

export interface ExternalIdentity {
  readonly subject: string;
  readonly realmRoles: readonly string[];
  readonly clientRoles: readonly string[];
  readonly groups: readonly string[];
  readonly username?: string;
}

export interface MercurePrincipal {
  readonly subject: string;
  readonly username?: string;
  readonly roles: readonly MercureRole[];
  readonly capabilities: readonly MercureCapability[];
  readonly authorities: readonly string[];
}

const USER_CAPABILITIES: readonly MercureCapability[] = ['platform:read', 'rules:read'];
const ADMIN_CAPABILITIES: readonly MercureCapability[] = [
  ...USER_CAPABILITIES,
  'rules:import',
  'rules:admin',
];

function normalizeAuthority(value: string): string {
  return value.trim().toLowerCase();
}

function normalizedSet(values: readonly string[]): ReadonlySet<string> {
  return new Set(values.map(normalizeAuthority).filter(Boolean));
}

function intersects(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  for (const value of left) {
    if (right.has(value)) {
      return true;
    }
  }

  return false;
}

export function resolveMercurePrincipal(
  identity: ExternalIdentity,
  mapping: AuthorityRoleMapping,
): MercurePrincipal {
  const subject = identity.subject.trim();
  if (!subject) {
    throw new Error('External identity subject must not be empty.');
  }

  const authorities = normalizedSet([
    ...identity.realmRoles,
    ...identity.clientRoles,
    ...identity.groups,
  ]);
  const adminAuthorities = normalizedSet(mapping.admin);
  const userAuthorities = normalizedSet(mapping.user);

  const isAdmin = intersects(authorities, adminAuthorities);
  const isUser = isAdmin || intersects(authorities, userAuthorities);

  const roles: MercureRole[] = [];
  if (isAdmin) roles.push('admin');
  if (isUser) roles.push('user');

  const capabilities = isAdmin ? ADMIN_CAPABILITIES : isUser ? USER_CAPABILITIES : [];

  return {
    subject,
    ...(identity.username?.trim() ? { username: identity.username.trim() } : {}),
    roles,
    capabilities,
    authorities: [...authorities].sort(),
  };
}

export function hasCapability(principal: MercurePrincipal, capability: MercureCapability): boolean {
  return principal.capabilities.includes(capability);
}
