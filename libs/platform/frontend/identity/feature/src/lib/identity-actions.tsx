'use client';

import { signIn, signOut } from 'next-auth/react';

import styles from './identity-feature.module.css';

export function IdentitySignInButton({
  callbackPath,
}: {
  readonly callbackPath: string;
}) {
  return (
    <button
      className={styles.primaryButton}
      type="button"
      onClick={() => void signIn('keycloak', { redirectTo: callbackPath })}
    >
      Continue with Keycloak
    </button>
  );
}

export function IdentitySignOutButton() {
  return (
    <button
      className={styles.secondaryButton}
      type="button"
      onClick={() => void signOut({ redirectTo: '/auth/sign-in' })}
    >
      Sign out
    </button>
  );
}
