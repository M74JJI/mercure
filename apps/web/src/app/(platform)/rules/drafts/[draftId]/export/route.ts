import { exportRulesAuthoringDraftResponse } from '@mercure/rules-frontend-feature';

export async function GET(
  _request: Request,
  { params }: { readonly params: Promise<{ readonly draftId: string }> },
) {
  const { draftId } = await params;
  return exportRulesAuthoringDraftResponse(draftId);
}
