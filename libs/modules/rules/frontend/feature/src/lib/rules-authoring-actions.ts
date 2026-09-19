'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesAuthoringDataAccess,
  RulesFrontendApiError,
} from '@mercure/rules-frontend-data-access';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import { requireRulesAdminIdentity } from './rules-use-case-admin-boundary';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function value(formData: FormData, name: string): string | null {
  const item = formData.get(name);
  return typeof item === 'string' ? item : null;
}

function id(formData: FormData, name: string): string | null {
  const item = value(formData, name)?.trim();
  return item && uuid.test(item) ? item : null;
}

function integer(formData: FormData, name: string, minimum: number): number | null {
  const item = value(formData, name);
  if (!item || !/^\d+$/.test(item)) return null;
  const parsed = Number(item);
  return Number.isSafeInteger(parsed) && parsed >= minimum ? parsed : null;
}

function api(): RulesAuthoringDataAccess {
  return new RulesAuthoringDataAccess({ fetch: authenticatedMercureFetch });
}

function failure(path: string, error: RulesFrontendApiError): never {
  redirectRulesAuthorizationFailure(error);
  const code =
    error.status === 400
      ? 'validation'
      : error.status === 404
        ? 'not-found'
        : error.status === 409
          ? 'conflict'
          : 'unavailable';
  redirect(path + '?error=' + code);
}

export async function createRulesAuthoringDraftAction(formData: FormData): Promise<void> {
  await requireRulesAdminIdentity();
  const sourceSnapshotId = id(formData, 'sourceSnapshotId');
  const sourceFilePosition = integer(formData, 'sourceFilePosition', 0);
  if (!sourceSnapshotId || sourceFilePosition === null) {
    redirect('/rules/drafts?error=validation');
  }

  try {
    const draft = await api().create({ sourceSnapshotId, sourceFilePosition });
    revalidatePath('/rules/drafts');
    redirect('/rules/drafts/' + draft.id);
  } catch (error) {
    if (error instanceof RulesFrontendApiError) failure('/rules/drafts', error);
    throw error;
  }
}

export async function updateRulesAuthoringDraftAction(formData: FormData): Promise<void> {
  await requireRulesAdminIdentity();
  const draftId = id(formData, 'draftId');
  const expectedRevision = integer(formData, 'expectedRevision', 1);
  const content = value(formData, 'content');
  if (!draftId || expectedRevision === null || !content) {
    redirect('/rules/drafts?error=validation');
  }

  const path = '/rules/drafts/' + draftId;
  try {
    await api().update(draftId, { expectedRevision, content });
    revalidatePath('/rules/drafts');
    revalidatePath(path);
    redirect(path);
  } catch (error) {
    if (error instanceof RulesFrontendApiError) failure(path, error);
    throw error;
  }
}

async function transition(
  formData: FormData,
  operation: 'validate' | 'approve',
): Promise<never> {
  await requireRulesAdminIdentity();
  const draftId = id(formData, 'draftId');
  const expectedRevision = integer(formData, 'expectedRevision', 1);
  if (!draftId || expectedRevision === null) {
    redirect('/rules/drafts?error=validation');
  }

  const path = '/rules/drafts/' + draftId;
  try {
    if (operation === 'validate') await api().validate(draftId, expectedRevision);
    else await api().approve(draftId, expectedRevision);
    revalidatePath('/rules/drafts');
    revalidatePath(path);
    redirect(path);
  } catch (error) {
    if (error instanceof RulesFrontendApiError) failure(path, error);
    throw error;
  }
}

export async function validateRulesAuthoringDraftAction(formData: FormData): Promise<void> {
  return transition(formData, 'validate');
}

export async function approveRulesAuthoringDraftAction(formData: FormData): Promise<void> {
  return transition(formData, 'approve');
}
