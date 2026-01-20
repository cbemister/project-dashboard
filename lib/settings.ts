import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export type Editor = 'vscode' | 'cursor';
export type DefaultAction = 'editor' | 'explorer' | 'terminal';

export interface Settings {
  rootPath: string;
  ignoredFolders: string[];
  editor: Editor;
  defaultAction: DefaultAction;
}

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json');

const DEFAULT_SETTINGS: Settings = {
  rootPath: '',
  ignoredFolders: [
    'node_modules',
    '.git',
    '.next',
    'dist',
  ],
  editor: 'vscode',
  defaultAction: 'editor',
};

export async function loadSettings(): Promise<Settings> {
  if (!existsSync(SETTINGS_PATH)) {
    return DEFAULT_SETTINGS;
  }

  try {
    const content = await readFile(SETTINGS_PATH, 'utf-8');
    const saved = JSON.parse(content);
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<Settings>): Promise<Settings> {
  const current = await loadSettings();
  const updated = { ...current, ...settings };
  await writeFile(SETTINGS_PATH, JSON.stringify(updated, null, 2));
  return updated;
}
