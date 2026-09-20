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

const draftIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;


export async function GET(
  _request: Request,
  { params }: { readonly params: Promise<{ readonly draftId: string }> },
) {
  const identity = await getServerMercureIdentity();
  if (!identity) return new Response('Authentication required.', { status: 401 });
  if (identity.role !== 'admin') return new Response('Forbidden.', { status: 403 });

  const { draftId } = await params;
  if (!draftIdPattern.test(draftId)) {
    return new Response('Invalid draft ID.', { status: 400 });
  }

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
      const status =
        error.status === 400 ||
        error.status === 401 ||
        error.status === 403 ||
        error.status === 404 ||
        error.status === 409
          ? error.status
          : 503;
      const message =
        status === 400
          ? 'Invalid export request.'
          : status === 401
            ? 'Authentication required.'
            : status === 403
              ? 'Forbidden.'
              : status === 404
                ? 'Draft not found.'
                : status === 409
                  ? 'Draft is not exportable.'
                  : 'Authoring export unavailable.';

      return new Response(message, { status });
    }
    throw error;
  }
}
