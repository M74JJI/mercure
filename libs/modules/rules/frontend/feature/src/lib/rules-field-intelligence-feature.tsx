import { authenticatedMercureFetch } from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesFrontendApiError,
  RulesIntelligenceDataAccess,
} from '@mercure/rules-frontend-data-access';
import { RulesFieldIntelligencePage, RulesUnavailableState } from '@mercure/rules-frontend-ui';

import { redirectRulesAuthorizationFailure } from './rules-auth-boundary';
import {
  boundedIntegerSearchParam,
  enumSearchParam,
  rulesHref,
  trimmedSearchParam,
  type RulesSearchParams,
} from './rules-search-params';

const healthValues = [
  'healthy',
  'underused',
  'unknown_source',
  'alias_candidate',
  'orphaned',
] as const;
const criticalityValues = ['critical', 'high', 'medium', 'low'] as const;
const PAGE_SIZE = 50;

export interface RulesFieldIntelligenceFeatureProps {
  readonly snapshotId: string;
  readonly searchParams: RulesSearchParams;
}

export async function RulesFieldIntelligenceFeature({
  searchParams,
  snapshotId,
}: RulesFieldIntelligenceFeatureProps) {
  const api = new RulesIntelligenceDataAccess({
    fetch: authenticatedMercureFetch,
  });

  const offset = boundedIntegerSearchParam(searchParams, 'offset', 0, 0, 1_000_000);
  const selectedQuery = trimmedSearchParam(searchParams, 'q', 256);
  const selectedTenant = trimmedSearchParam(searchParams, 'tenant', 255);
  const selectedFamily = trimmedSearchParam(searchParams, 'family', 128);
  const selectedHealth = enumSearchParam(searchParams, 'health', healthValues);
  const selectedCriticality = enumSearchParam(searchParams, 'criticality', criticalityValues);

  const query = {
    offset,
    limit: PAGE_SIZE,
    ...(selectedQuery === undefined ? {} : { query: selectedQuery }),
    ...(selectedTenant === undefined ? {} : { tenant: selectedTenant }),
    ...(selectedFamily === undefined ? {} : { family: selectedFamily }),
    ...(selectedHealth === undefined ? {} : { health: selectedHealth }),
    ...(selectedCriticality === undefined ? {} : { criticality: selectedCriticality }),
  };

  try {
    const intelligence = await api.fieldIntelligence(snapshotId, query);
    const path = '/rules/' + snapshotId + '/fields';
    const shared = {
      ...(selectedQuery === undefined ? {} : { q: selectedQuery }),
      ...(selectedTenant === undefined ? {} : { tenant: selectedTenant }),
      ...(selectedFamily === undefined ? {} : { family: selectedFamily }),
      ...(selectedHealth === undefined ? {} : { health: selectedHealth }),
      ...(selectedCriticality === undefined ? {} : { criticality: selectedCriticality }),
    };

    const previousHref =
      offset > 0
        ? rulesHref(path, {
            ...shared,
            offset: Math.max(0, offset - PAGE_SIZE),
          })
        : undefined;
    const nextHref =
      offset + intelligence.page.items.length < intelligence.page.total
        ? rulesHref(path, {
            ...shared,
            offset: offset + PAGE_SIZE,
          })
        : undefined;

    return (
      <RulesFieldIntelligencePage
        snapshotId={snapshotId}
        intelligence={intelligence}
        {...(selectedQuery === undefined ? {} : { selectedQuery })}
        {...(selectedTenant === undefined ? {} : { selectedTenant })}
        {...(selectedFamily === undefined ? {} : { selectedFamily })}
        {...(selectedHealth === undefined ? {} : { selectedHealth })}
        {...(selectedCriticality === undefined ? {} : { selectedCriticality })}
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
