// Electron detection and IPC utilities

interface ElectronAPI {
  selectDirectory: () => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export function isElectron(): boolean {
  return typeof window !== 'undefined' &&
         typeof window.electronAPI !== 'undefined';
}

export async function selectDirectory(): Promise<string | null> {
  if (!isElectron()) return null;

  return window.electronAPI!.selectDirectory();
}
