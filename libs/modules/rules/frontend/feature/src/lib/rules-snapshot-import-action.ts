'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  authenticatedMercureFetch,
  getServerMercureIdentity,
} from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesDataAccess,
  RulesFrontendApiError,
  type RulesSnapshot,
} from '@mercure/rules-frontend-data-access';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';

export async function importRulesSnapshotAction(_formData: FormData): Promise<void> {
  const identity = await getServerMercureIdentity();

  if (!identity) {
    redirect('/auth/sign-in');
  }

  const api = new RulesDataAccess({
    fetch: authenticatedMercureFetch,
  });

  let snapshot: RulesSnapshot;
  try {
    snapshot = await api.importSnapshot();
  } catch (error) {
    if (error instanceof RulesFrontendApiError) {
      redirectRulesAuthorizationFailure(error);

      if (error.status === 503) {
        redirect('/rules?import=unavailable');
      }

      redirect('/rules?import=failed');
    }

    throw error;
  }

  revalidatePath('/rules');
  revalidatePath('/rules/' + snapshot.id);
  redirect('/rules/' + snapshot.id);
}
