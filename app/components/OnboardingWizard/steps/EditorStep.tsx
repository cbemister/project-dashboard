'use client';

import styles from '../OnboardingWizard.module.css';

interface EditorStepProps {
  value: 'vscode' | 'cursor';
  onChange: (value: 'vscode' | 'cursor') => void;
  onNext: () => void;
  onBack: () => void;
}

export default function EditorStep({ value, onChange, onNext, onBack }: EditorStepProps) {
  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>Choose your editor</h2>
      <p className={styles.stepDescription}>
        Which code editor do you prefer? You can change this later in settings.
      </p>

      <div className={styles.editorOptions}>
        <button
          className={`${styles.editorCard} ${value === 'vscode' ? styles.selected : ''}`}
          onClick={() => onChange('vscode')}
        >
          <div className={styles.editorIcon}>💙</div>
          <div className={styles.editorName}>VS Code</div>
          <div className={styles.editorDesc}>Visual Studio Code</div>
        </button>

        <button
          className={`${styles.editorCard} ${value === 'cursor' ? styles.selected : ''}`}
          onClick={() => onChange('cursor')}
        >
          <div className={styles.editorIcon}>🟣</div>
          <div className={styles.editorName}>Cursor</div>
          <div className={styles.editorDesc}>AI-powered editor</div>
        </button>
      </div>

      <div className={styles.navigation}>
        <button onClick={onBack} className={styles.secondaryBtn}>
          Back
        </button>
        <button onClick={onNext} className={styles.primaryBtn}>
          Continue
        </button>
      </div>
    </div>
  );
}
