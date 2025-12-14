import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  isElectron: () => ipcRenderer.invoke('is-electron'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getBackendUrl: () => Promise<string>;
      isElectron: () => Promise<boolean>;
      getAppVersion: () => Promise<string>;
    };
  }
}

