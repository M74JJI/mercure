'use client';

import { useState } from 'react';

import styles from './rules.module.css';

export interface RulesSnapshotImportFormProps {
  readonly action: (formData: FormData) => Promise<void>;
}

export function RulesSnapshotImportForm({ action }: RulesSnapshotImportFormProps) {
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await action(formData);
        } finally {
          setPending(false);
        }
      }}
    >
      <button
        className={styles.actionButton}
        type="submit"
        disabled={pending}
        aria-disabled={pending}
      >
        {pending ? 'Importing…' : 'Import configured snapshot'}
      </button>
    </form>
  );
}
