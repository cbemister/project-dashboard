'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './settings.module.css';

type Editor = 'vscode' | 'cursor';
type DefaultAction = 'editor' | 'explorer' | 'terminal';

interface Settings {
  rootPath: string;
  ignoredFolders: string[];
  editor: Editor;
  defaultAction: DefaultAction;
  detectedCategories?: string[];
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    rootPath: '',
    ignoredFolders: [],
    editor: 'vscode',
    defaultAction: 'editor',
    detectedCategories: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newIgnored, setNewIgnored] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        throw new Error('Save failed');
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  }

  function excludeCategory(category: string) {
    if (settings.ignoredFolders.includes(category)) return;
    setSettings({
      ...settings,
      ignoredFolders: [...settings.ignoredFolders, category],
    });
  }

  function includeCategory(category: string) {
    setSettings({
      ...settings,
      ignoredFolders: settings.ignoredFolders.filter((f) => f !== category),
    });
  }

  // Get excluded categories (in ignoredFolders AND in detectedCategories)
  const excludedCategories = (settings.detectedCategories || []).filter((cat) =>
    settings.ignoredFolders.includes(cat)
  );

  // Get active categories (detected but not ignored)
  const activeCategories = (settings.detectedCategories || []).filter(
    (cat) => !settings.ignoredFolders.includes(cat)
  );

  function addIgnored() {
    if (!newIgnored.trim()) return;
    if (settings.ignoredFolders.includes(newIgnored.trim())) return;

    setSettings({
      ...settings,
      ignoredFolders: [...settings.ignoredFolders, newIgnored.trim()],
    });
    setNewIgnored('');
  }

  function removeIgnored(folder: string) {
    setSettings({
      ...settings,
      ignoredFolders: settings.ignoredFolders.filter((f) => f !== folder),
    });
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Settings</h1>
        <Link href="/" className={styles.backLink}>
          Back to Dashboard
        </Link>
      </header>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <section className={styles.section}>
        <h2>Projects Root Directory</h2>
        <p className={styles.description}>
          Set the root folder where your projects are organized. This folder should contain
          your category subfolders (e.g., Finance, DevTools, etc.).
        </p>
        <input
          type="text"
          value={settings.rootPath}
          onChange={(e) => setSettings({ ...settings, rootPath: e.target.value })}
          placeholder="e.g., C:/Users/YourName/Projects"
          className={styles.input}
        />
        <p className={styles.hint}>
          Use forward slashes (/) or double backslashes (\\) for Windows paths.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Editor</h2>
        <p className={styles.description}>
          Choose your code editor for the &quot;Code&quot; button.
        </p>
        <select
          value={settings.editor}
          onChange={(e) => setSettings({ ...settings, editor: e.target.value as Editor })}
          className={styles.select}
        >
          <option value="vscode">VS Code</option>
          <option value="cursor">Cursor</option>
        </select>
      </section>

      <section className={styles.section}>
        <h2>Default Action</h2>
        <p className={styles.description}>
          Choose what happens when you click on a focus project card.
        </p>
        <select
          value={settings.defaultAction}
          onChange={(e) => setSettings({ ...settings, defaultAction: e.target.value as DefaultAction })}
          className={styles.select}
        >
          <option value="editor">Open in Editor</option>
          <option value="explorer">Open in File Explorer</option>
          <option value="terminal">Open in Terminal</option>
        </select>
      </section>

      <section className={styles.section}>
        <h2>Categories</h2>
        <p className={styles.description}>
          Folders detected in your root directory. Toggle categories to show or hide them.
        </p>

        {activeCategories.length > 0 && (
          <>
            <h3 className={styles.subheading}>Active</h3>
            <div className={styles.categoryList}>
              {activeCategories.map((category) => (
                <div key={category} className={styles.categoryItem}>
                  <span>{category}</span>
                  <button
                    onClick={() => excludeCategory(category)}
                    className={styles.removeBtn}
                    title="Hide this category"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {excludedCategories.length > 0 && (
          <>
            <h3 className={styles.subheading}>Hidden</h3>
            <div className={styles.categoryList}>
              {excludedCategories.map((category) => (
                <div key={category} className={`${styles.categoryItem} ${styles.excluded}`}>
                  <span>{category}</span>
                  <button
                    onClick={() => includeCategory(category)}
                    className={styles.restoreBtn}
                    title="Show this category"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {!settings.rootPath && (
          <p className={styles.hint}>Set a root directory to detect categories.</p>
        )}
        {settings.rootPath && activeCategories.length === 0 && excludedCategories.length === 0 && (
          <p className={styles.hint}>No folders found in root directory.</p>
        )}
      </section>

      <section className={styles.section}>
        <h2>Ignored Folders</h2>
        <p className={styles.description}>
          Folder names to skip when scanning for projects. These are typically build artifacts
          or dependencies that shouldn't appear in the dashboard.
        </p>

        <div className={styles.categoryList}>
          {settings.ignoredFolders
            .filter((folder) => !(settings.detectedCategories || []).includes(folder))
            .map((folder) => (
              <div key={folder} className={styles.categoryItem}>
                <span>{folder}</span>
                <button
                  onClick={() => removeIgnored(folder)}
                  className={styles.removeBtn}
                  title="Remove from ignored"
                >
                  x
                </button>
              </div>
            ))}
        </div>

        <div className={styles.addCategory}>
          <input
            type="text"
            value={newIgnored}
            onChange={(e) => setNewIgnored(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addIgnored()}
            placeholder="Folder name to ignore"
            className={styles.input}
          />
          <button onClick={addIgnored} className={styles.addBtn}>
            Add
          </button>
        </div>
      </section>

      <div className={styles.actions}>
        <button
          onClick={saveSettings}
          disabled={saving}
          className={styles.saveBtn}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
