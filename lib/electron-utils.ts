// Utility functions for Electron integration

/**
 * Check if the app is running in Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
}

/**
 * Open a URL in the external default browser
 */
export async function openExternal(url: string): Promise<void> {
  if (isElectron() && window.electronAPI) {
    await window.electronAPI.openExternal(url);
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Open a file or folder with the default application
 */
export async function openPath(filePath: string): Promise<string | void> {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.openPath(filePath);
  }
}

/**
 * Show a file in its containing folder
 */
export async function showItemInFolder(filePath: string): Promise<void> {
  if (isElectron() && window.electronAPI) {
    await window.electronAPI.showItemInFolder(filePath);
  }
}

/**
 * Get the app data path
 */
export async function getAppPath(): Promise<string | null> {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.getAppPath();
  }
  return null;
}

/**
 * Get the current platform
 */
export async function getPlatform(): Promise<NodeJS.Platform | null> {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.getPlatform();
  }
  return null;
}
