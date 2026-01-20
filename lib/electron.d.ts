// Type declarations for Electron API exposed via preload script

interface ElectronAPI {
  openExternal: (url: string) => Promise<void>;
  openPath: (filePath: string) => Promise<string>;
  showItemInFolder: (filePath: string) => Promise<void>;
  getAppPath: () => Promise<string>;
  getPlatform: () => Promise<NodeJS.Platform>;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
