'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  authenticatedMercureFetch,
  getServerMercureIdentity,
} from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesFrontendApiError,
  RulesUseCaseAdministrationDataAccess,
} from '@mercure/rules-frontend-data-access';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import {
  parseCreateRulesUseCaseForm,
  parseUpdateRulesUseCaseForm,
  parseUseCaseId,
  validateDeleteConfirmation,
  type RulesUseCaseFormError,
} from './rules-use-case-administration-form';

async function requireAdminIdentity() {
  const identity = await getServerMercureIdentity();

  if (!identity) {
    redirect('/auth/sign-in');
  }

  if (identity.role !== 'admin') {
    redirect('/auth/forbidden');
  }

  return identity;
}

function errorHref(
  path: string,
  code: string,
  field?: RulesUseCaseFormError['field'],
): string {
  const params = new URLSearchParams({ error: code });
  if (field) params.set('field', field);
  return path + '?' + params.toString();
}

function redirectApiFailure(path: string, error: RulesFrontendApiError): never {
  redirectRulesAuthorizationFailure(error);

  if (error.status === 400) {
    redirect(errorHref(path, 'validation'));
  }

  if (error.status === 404) {
    redirect(errorHref(path, 'not-found'));
  }

  if (error.status === 409) {
    redirect(errorHref(path, 'conflict'));
  }

  redirect(errorHref(path, 'unavailable'));
}

function adminApi(): RulesUseCaseAdministrationDataAccess {
  return new RulesUseCaseAdministrationDataAccess({
    fetch: authenticatedMercureFetch,
  });
}

export async function createRulesUseCaseAction(formData: FormData): Promise<void> {
  await requireAdminIdentity();

  const parsed = parseCreateRulesUseCaseForm(formData);
  if (!parsed.ok) {
    redirect(errorHref('/rules/use-cases/new', 'validation', parsed.error.field));
  }

  let created;
  try {
    created = await adminApi().create(parsed.value);
  } catch (error) {
    if (error instanceof RulesFrontendApiError) {
      redirectApiFailure('/rules/use-cases/new', error);
    }
    throw error;
  }

  revalidatePath('/rules/use-cases');
  revalidatePath('/rules/use-cases/' + created.id);
  redirect('/rules/use-cases/' + created.id);
}

export async function updateRulesUseCaseAction(formData: FormData): Promise<void> {
  await requireAdminIdentity();

  const idResult = parseUseCaseId(formData);
  if (!idResult.ok) {
    redirect(errorHref('/rules/use-cases', 'validation', idResult.error.field));
  }

  const path = '/rules/use-cases/' + idResult.value + '/edit';
  const parsed = parseUpdateRulesUseCaseForm(formData);
  if (!parsed.ok) {
    redirect(errorHref(path, 'validation', parsed.error.field));
  }

  try {
    await adminApi().update(idResult.value, parsed.value);
  } catch (error) {
    if (error instanceof RulesFrontendApiError) {
      redirectApiFailure(path, error);
    }
    throw error;
  }

  revalidatePath('/rules/use-cases');
  revalidatePath('/rules/use-cases/' + idResult.value);
  revalidatePath(path);
  redirect('/rules/use-cases/' + idResult.value);
}

export async function deleteRulesUseCaseAction(formData: FormData): Promise<void> {
  await requireAdminIdentity();

  const idResult = parseUseCaseId(formData);
  if (!idResult.ok) {
    redirect(errorHref('/rules/use-cases', 'validation', idResult.error.field));
  }

  const detailPath = '/rules/use-cases/' + idResult.value;
  const confirmationError = validateDeleteConfirmation(formData, idResult.value);
  if (confirmationError) {
    redirect(errorHref(detailPath, 'confirmation', confirmationError.field));
  }

  try {
    await adminApi().delete(idResult.value);
  } catch (error) {
    if (error instanceof RulesFrontendApiError) {
      redirectApiFailure(detailPath, error);
    }
    throw error;
  }

  revalidatePath('/rules/use-cases');
  revalidatePath(detailPath);
  redirect('/rules/use-cases?deleted=' + encodeURIComponent(idResult.value));
}
