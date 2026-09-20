import type { Metadata } from 'next';

import { IdentitySignInFeature } from '@mercure/platform-frontend-identity-feature';

export const metadata: Metadata = {
  title: 'Sign in',
};

interface SignInPageProps {
  readonly searchParams: Promise<{
    readonly callbackUrl?: string | readonly string[];
  }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl } = await searchParams;
  return <IdentitySignInFeature callbackUrl={callbackUrl} />;
}
