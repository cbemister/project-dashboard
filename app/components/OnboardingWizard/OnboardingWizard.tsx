'use client';

import { useState, useCallback } from 'react';
import styles from './OnboardingWizard.module.css';
import WelcomeStep from './steps/WelcomeStep';
import RootDirectoryStep from './steps/RootDirectoryStep';
import EditorStep from './steps/EditorStep';
import CompleteStep from './steps/CompleteStep';

interface OnboardingWizardProps {
  onComplete: () => void;
}

type Step = 0 | 1 | 2 | 3;

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<Step>(0);
  const [rootPath, setRootPath] = useState('');
  const [editor, setEditor] = useState<'vscode' | 'cursor'>('vscode');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, 3) as Step);
  }, []);

  const handleBack = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 0) as Step);
  }, []);

  const handleComplete = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootPath,
          editor,
          hasCompletedOnboarding: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      onComplete();
    } catch {
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [rootPath, editor, onComplete]);

  const stepLabels = ['Welcome', 'Directory', 'Editor', 'Complete'];

  return (
    <div className={styles.overlay}>
      <div className={styles.wizard}>
        <div className={styles.progress}>
          {stepLabels.map((label, index) => (
            <div
              key={label}
              className={`${styles.progressStep} ${index <= step ? styles.active : ''} ${index < step ? styles.completed : ''}`}
            >
              <div className={styles.progressDot}>
                {index < step ? '\u2713' : index + 1}
              </div>
              <span className={styles.progressLabel}>{label}</span>
            </div>
          ))}
        </div>

        <div className={styles.content}>
          {step === 0 && <WelcomeStep onNext={handleNext} />}
          {step === 1 && (
            <RootDirectoryStep
              value={rootPath}
              onChange={setRootPath}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {step === 2 && (
            <EditorStep
              value={editor}
              onChange={setEditor}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {step === 3 && (
            <CompleteStep
              onComplete={handleComplete}
              onBack={handleBack}
              isSaving={isSaving}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}
