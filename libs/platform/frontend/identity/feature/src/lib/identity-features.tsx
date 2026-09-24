import { redirect } from 'next/navigation';
import Image from 'next/image';
import type { ReactNode } from 'react';

import {
  getServerMercureIdentity,
  webIdentityEnvironment,
  type ServerMercureIdentity,
} from '@mercure/platform-frontend-identity-data-access/server';
import { sanitizeCallbackPath } from '@mercure/platform-frontend-identity-data-access/policy';

import { IdentitySignInButton, IdentitySignOutButton } from './identity-actions';
import styles from './identity-feature.module.css';

export async function requireMercureIdentity(): Promise<ServerMercureIdentity> {
  const identity = await getServerMercureIdentity();

  if (!identity) {
    redirect('/auth/sign-in');
  }

  if (!identity.role) {
    redirect('/auth/forbidden');
  }

  return identity;
}

function IdentityFrame({
  eyebrow,
  title,
  detail,
  children,
}: Readonly<{
  eyebrow: string;
  title: string;
  detail: string;
  children: ReactNode;
}>) {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="identity-title">
        <div className={styles.brandMark}>
          <Image
            src="/mercure-logo.png"
            alt="Mercure"
            width={64}
            height={64}
            priority
            unoptimized
          />
        </div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 id="identity-title" className={styles.title}>
          {title}
        </h1>
        <p className={styles.detail}>{detail}</p>
        <div className={styles.actions}>{children}</div>
      </section>
    </main>
  );
}

export async function IdentitySignInFeature({
  callbackUrl,
}: {
  readonly callbackUrl?: string | readonly string[];
}) {
  const identity = await getServerMercureIdentity();

  if (identity) {
    if (identity.role) {
      redirect('/');
    }

    redirect('/auth/forbidden');
  }

  const environment = webIdentityEnvironment();
  const candidate = typeof callbackUrl === 'string' ? callbackUrl : callbackUrl?.[0];
  const callbackPath = sanitizeCallbackPath(candidate, environment.authOrigin);

  return (
    <IdentityFrame
      eyebrow="Mercure identity"
      title="Sign in to the security workspace"
      detail="Authentication is delegated to the configured Keycloak identity provider. Mercure does not store your password."
    >
      <IdentitySignInButton callbackPath={callbackPath} />
    </IdentityFrame>
  );
}

export async function IdentityForbiddenFeature() {
  const identity = await getServerMercureIdentity();

  if (!identity) {
    redirect('/auth/sign-in');
  }

  const hasMappedRole = Boolean(identity.role);

  return (
    <IdentityFrame
      eyebrow="Access denied"
      title={
        hasMappedRole
          ? 'Your Mercure role does not permit this action'
          : 'No Mercure role is mapped to this identity'
      }
      detail={
        hasMappedRole
          ? 'Your Keycloak session is valid, but your current Mercure role does not grant access to this area.'
          : 'Your Keycloak session is valid, but it does not map to an authorized Mercure application role.'
      }
    >
      <IdentitySignOutButton />
    </IdentityFrame>
  );
}

export function IdentityAuthErrorFeature() {
  return (
    <IdentityFrame
      eyebrow="Authentication unavailable"
      title="Sign-in could not be completed"
      detail="The identity provider did not complete a valid Mercure session. Start a new sign-in attempt."
    >
      <IdentitySignInButton callbackPath="/" />
    </IdentityFrame>
  );
}
