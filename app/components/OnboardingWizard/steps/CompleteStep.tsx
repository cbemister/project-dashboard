'use client';

import styles from '../OnboardingWizard.module.css';

interface CompleteStepProps {
  onComplete: () => void;
  onBack: () => void;
  isSaving: boolean;
  error: string | null;
}

export default function CompleteStep({ onComplete, onBack, isSaving, error }: CompleteStepProps) {
  return (
    <div className={styles.step}>
      <div className={styles.iconLarge}>✨</div>
      <h2 className={styles.stepTitle}>You&apos;re all set!</h2>
      <p className={styles.stepDescription}>
        Your Project Dashboard is ready. Click below to start exploring your projects.
      </p>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.navigation}>
        <button onClick={onBack} className={styles.secondaryBtn} disabled={isSaving}>
          Back
        </button>
        <button
          onClick={onComplete}
          className={styles.primaryBtn}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Open Dashboard'}
        </button>
      </div>
    </div>
  );
}
