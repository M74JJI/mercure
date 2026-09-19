import { redirect } from 'next/navigation';

import { RulesFrontendApiError } from '@mercure/rules-frontend-data-access';

export function redirectRulesAuthorizationFailure(error: RulesFrontendApiError): void {
  if (error.status === 401) {
    redirect('/auth/sign-in');
  }

  if (error.status === 403) {
    redirect('/auth/forbidden');
  }
}
