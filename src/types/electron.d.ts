// Type definitions for Electron API exposed via preload script
export interface ElectronAPI {
  getBackendUrl: () => Promise<string>;
  isElectron: () => Promise<boolean>;
  getAppVersion: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

