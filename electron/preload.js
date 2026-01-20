const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Open URL in external browser
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Open file/folder with default application
  openPath: (filePath) => ipcRenderer.invoke('open-path', filePath),

  // Show file in folder (Explorer/Finder)
  showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),

  // Get app data path
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  // Get platform
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Check if running in Electron
  isElectron: true,
});

// Also expose a way to detect we're in Electron from the window object
window.addEventListener('DOMContentLoaded', () => {
  // Add a class to body for Electron-specific styling if needed
  document.body.classList.add('electron-app');
});
