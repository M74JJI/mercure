import {
  authenticatedMercureFetch,
  getServerMercureIdentity,
} from '@mercure/platform-frontend-identity-data-access/server';
import {
  RulesAuthoringDataAccess,
  RulesFrontendApiError,
} from '@mercure/rules-frontend-data-access';

function safeFileName(value: string): string {
  const leaf = value.split(/[\\/]/).at(-1) || 'rules.xml';
  const safe = leaf.replace(/[^a-zA-Z0-9._-]/g, '_');
  return safe.toLowerCase().endsWith('.xml') ? safe : safe + '.xml';
}

export async function GET(
  _request: Request,
  { params }: { readonly params: Promise<{ readonly draftId: string }> },
) {
  const identity = await getServerMercureIdentity();
  if (!identity) return new Response('Authentication required.', { status: 401 });
  if (identity.role !== 'admin') return new Response('Forbidden.', { status: 403 });

  const { draftId } = await params;
  try {
    const artifact = await new RulesAuthoringDataAccess({
      fetch: authenticatedMercureFetch,
    }).export(draftId);

    return new Response(artifact.content, {
      status: 200,
      headers: {
        'cache-control': 'no-store',
        'content-disposition': 'attachment; filename="' + safeFileName(artifact.fileName) + '"',
        'content-type': 'application/xml; charset=utf-8',
        'x-content-type-options': 'nosniff',
        'x-mercure-draft-revision': String(artifact.revision),
        'x-mercure-sha256': artifact.sha256,
      },
    });
  } catch (error) {
    if (error instanceof RulesFrontendApiError) {
      return new Response(
        error.status === 404 ? 'Draft not found.' : error.status === 409 ? 'Draft is not exportable.' : 'Authoring export unavailable.',
        { status: error.status === 404 || error.status === 409 ? error.status : 503 },
      );
    }
    throw error;
  }
}
