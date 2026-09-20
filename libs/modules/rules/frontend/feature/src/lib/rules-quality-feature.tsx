import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesFrontendApiError,
  RulesIntelligenceDataAccess,
} from '@mercure/rules-frontend-data-access';
import { RulesQualityPage, RulesUnavailableState } from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import {
  boundedIntegerSearchParam,
  enumSearchParam,
  rulesHref,
  trimmedSearchParam,
  type RulesSearchParams,
} from './rules-search-params';

const kindValues = ['rules', 'use_cases'] as const;
const gradeValues = ['excellent', 'good', 'needs_review', 'risky', 'broken'] as const;
const PAGE_SIZE = 50;

export interface RulesQualityFeatureProps {
  readonly snapshotId: string;
  readonly searchParams: RulesSearchParams;
}

export async function RulesQualityFeature({ searchParams, snapshotId }: RulesQualityFeatureProps) {
  const api = new RulesIntelligenceDataAccess({
    fetch: authenticatedMercureFetch,
  });

  const offset = boundedIntegerSearchParam(searchParams, 'offset', 0, 0, 1_000_000);
  const selectedKind = enumSearchParam(searchParams, 'kind', kindValues) ?? 'rules';
  const selectedQuery = trimmedSearchParam(searchParams, 'q', 256);
  const selectedTenant = trimmedSearchParam(searchParams, 'tenant', 255);
  const selectedGrade = enumSearchParam(searchParams, 'grade', gradeValues);
  const selectedUseCaseId = trimmedSearchParam(searchParams, 'useCaseId', 255);

  const query = {
    kind: selectedKind,
    offset,
    limit: PAGE_SIZE,
    ...(selectedQuery === undefined ? {} : { query: selectedQuery }),
    ...(selectedTenant === undefined ? {} : { tenant: selectedTenant }),
    ...(selectedGrade === undefined ? {} : { grade: selectedGrade }),
    ...(selectedUseCaseId === undefined ? {} : { useCaseId: selectedUseCaseId }),
  };

  try {
    const quality = await api.quality(snapshotId, query);
    const activePage = selectedKind === 'rules' ? quality.rules : quality.useCases;
    const path = '/rules/' + snapshotId + '/quality';
    const shared = {
      kind: selectedKind,
      ...(selectedQuery === undefined ? {} : { q: selectedQuery }),
      ...(selectedTenant === undefined ? {} : { tenant: selectedTenant }),
      ...(selectedGrade === undefined ? {} : { grade: selectedGrade }),
      ...(selectedUseCaseId === undefined ? {} : { useCaseId: selectedUseCaseId }),
    };

    const previousHref =
      offset > 0
        ? rulesHref(path, {
            ...shared,
            offset: Math.max(0, offset - PAGE_SIZE),
          })
        : undefined;
    const nextHref =
      activePage && offset + activePage.items.length < activePage.total
        ? rulesHref(path, {
            ...shared,
            offset: offset + PAGE_SIZE,
          })
        : undefined;

    return (
      <RulesQualityPage
        snapshotId={snapshotId}
        quality={quality}
        selectedKind={selectedKind}
        {...(selectedQuery === undefined ? {} : { selectedQuery })}
        {...(selectedTenant === undefined ? {} : { selectedTenant })}
        {...(selectedGrade === undefined ? {} : { selectedGrade })}
        {...(selectedUseCaseId === undefined ? {} : { selectedUseCaseId })}
        {...(previousHref === undefined ? {} : { previousHref })}
        {...(nextHref === undefined ? {} : { nextHref })}
      />
    );
  } catch (error) {
    if (error instanceof RulesFrontendApiError) {
      redirectRulesAuthorizationFailure(error);
      return <RulesUnavailableState />;
    }

    throw error;
  }
}
