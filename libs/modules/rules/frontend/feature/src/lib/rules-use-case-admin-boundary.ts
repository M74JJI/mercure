import { redirect } from 'next/navigation';

import { getServerMercureIdentity } from '@mercure/platform-frontend-identity-data-access/server';

export async function requireRulesAdminIdentity() {
  const identity = await getServerMercureIdentity();

  if (!identity) {
    redirect('/auth/sign-in');
  }

  if (identity.role !== 'admin') {
    redirect('/auth/forbidden');
  }

  return identity;
}
