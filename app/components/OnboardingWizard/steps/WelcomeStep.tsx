'use client';

import styles from '../OnboardingWizard.module.css';

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className={styles.step}>
      <div className={styles.iconLarge}>🚀</div>
      <h2 className={styles.stepTitle}>Welcome to Project Dashboard</h2>
      <p className={styles.stepDescription}>
        Your personal command center for managing development projects.
        Let&apos;s get you set up in just a few steps.
      </p>
      <div className={styles.features}>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>📁</span>
          <span>Organize projects by category</span>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>🔍</span>
          <span>Quick search and filtering</span>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>⚡</span>
          <span>One-click access to your editor</span>
        </div>
      </div>
      <button onClick={onNext} className={styles.primaryBtn}>
        Get Started
      </button>
    </div>
  );
}
