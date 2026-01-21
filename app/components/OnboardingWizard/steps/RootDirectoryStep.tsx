'use client';

import { useState } from 'react';
import { isElectron, selectDirectory } from '@/lib/electron';
import styles from '../OnboardingWizard.module.css';

interface RootDirectoryStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function RootDirectoryStep({
  value,
  onChange,
  onNext,
  onBack,
}: RootDirectoryStepProps) {
  const [error, setError] = useState<string | null>(null);
  const inElectron = isElectron();

  const handleBrowse = async () => {
    const selected = await selectDirectory();
    if (selected) {
      onChange(selected);
      setError(null);
    }
  };

  const handleNext = () => {
    if (!value.trim()) {
      setError('Please enter a directory path');
      return;
    }
    onNext();
  };

  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>Where are your projects?</h2>
      <p className={styles.stepDescription}>
        Select the root folder containing your project categories.
        This should be the parent folder that contains subfolders like
        &quot;Finance&quot;, &quot;DevTools&quot;, etc.
      </p>

      <div className={styles.inputGroup}>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setError(null);
          }}
          placeholder="C:/Users/YourName/Projects"
          className={styles.input}
        />
        {inElectron && (
          <button onClick={handleBrowse} className={styles.browseBtn}>
            Browse
          </button>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <p className={styles.hint}>
        Expected structure: Root → Categories → Projects
      </p>

      <div className={styles.navigation}>
        <button onClick={onBack} className={styles.secondaryBtn}>
          Back
        </button>
        <button onClick={handleNext} className={styles.primaryBtn}>
          Continue
        </button>
      </div>
    </div>
  );
}
