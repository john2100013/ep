import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const backendPort = 3001;

// Get backend path - handle both dev and production
const getBackendPath = (): string => {
  if (isDev) {
    // In development, backend is in sibling directory
    return path.join(__dirname, '../../backend');
  } else {
    // In production (packaged), backend is in resources
    // Try multiple possible locations
    const possiblePaths = [
      path.join(process.resourcesPath, 'backend'),
      path.join(app.getAppPath(), 'resources', 'backend'),
      path.join(path.dirname(app.getPath('exe')), 'resources', 'backend'),
    ];
    
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        console.log('Found backend at:', possiblePath);
        return possiblePath;
      }
    }
    
    // If not found, use the first one and log error
    console.error('Backend not found in any expected location. Trying:', possiblePaths[0]);
    return possiblePaths[0];
  }
};

const backendPath = getBackendPath();

// Function to show error dialog
function showErrorDialog(title: string, message: string) {
  if (mainWindow) {
    dialog.showErrorBox(title, message);
  } else {
    dialog.showMessageBoxSync({
      type: 'error',
      title: title,
      message: message,
      buttons: ['OK'],
    });
  }
}

// Function to start the backend server
function startBackendServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if backend directory exists
    if (!fs.existsSync(backendPath)) {
      const errorMsg = `Backend directory not found at: ${backendPath}\n\nPlease ensure the backend is properly installed.`;
      console.error(errorMsg);
      showErrorDialog('Backend Not Found', errorMsg);
      reject(new Error(errorMsg));
      return;
    }

    // Check if dist/app.js exists in production
    if (!isDev) {
      const appJsPath = path.join(backendPath, 'dist', 'app.js');
      if (!fs.existsSync(appJsPath)) {
        const errorMsg = `Backend executable not found at: ${appJsPath}\n\nPlease rebuild the backend.`;
        console.error(errorMsg);
        showErrorDialog('Backend Executable Not Found', errorMsg);
        reject(new Error(errorMsg));
        return;
      }
    }

    console.log('Starting backend server from:', backendPath);

    if (isDev) {
      // In development, use ts-node to run TypeScript directly
      backendProcess = spawn('npm', ['run', 'dev'], {
        cwd: backendPath,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'], // Capture output for debugging
      });
    } else {
      // In production, run the compiled JavaScript
      // Find node.exe - try common locations
      const pathEntries: string[] = [];
      if (process.env.PATH) {
        pathEntries.push(...process.env.PATH.split(path.delimiter).map(p => path.join(p, 'node.exe')));
      }
      
      const nodePaths: string[] = [
        'node', // In PATH
        path.join(process.resourcesPath, '..', 'node.exe'),
        'C:\\Program Files\\nodejs\\node.exe',
        ...pathEntries,
      ].filter((p): p is string => typeof p === 'string');
      
      let nodeExecutable = 'node';
      let nodeFound = false;
      
      for (const nodePath of nodePaths) {
        try {
          if (nodePath === 'node') {
            // Test if 'node' command works by trying to spawn it
            nodeExecutable = 'node';
            nodeFound = true; // Assume it's in PATH, will fail later if not
            break;
          } else if (fs.existsSync(nodePath)) {
            nodeExecutable = nodePath;
            nodeFound = true;
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }

      if (!nodeFound) {
        const errorMsg = `Node.js not found. Tried:\n${nodePaths.join('\n')}\n\nPlease install Node.js from https://nodejs.org/`;
        console.error(errorMsg);
        showErrorDialog('Node.js Not Found', errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      console.log('Using Node.js at:', nodeExecutable);
      backendProcess = spawn(nodeExecutable, ['dist/app.js'], {
        cwd: backendPath,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'], // Capture output for debugging
      });
    }

    let backendOutput = '';
    let backendError = '';

    backendProcess?.stdout?.on('data', (data) => {
      const output = data.toString();
      backendOutput += output;
      console.log('Backend stdout:', output);
    });

    backendProcess?.stderr?.on('data', (data) => {
      const error = data.toString();
      backendError += error;
      console.error('Backend stderr:', error);
    });

    backendProcess?.on('error', (error) => {
      const errorMsg = `Failed to start backend server: ${error.message}\n\nPath: ${backendPath}\n\nError: ${error}`;
      console.error(errorMsg);
      showErrorDialog('Backend Startup Error', errorMsg);
      reject(error);
    });

    backendProcess?.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        const errorMsg = `Backend server exited with code ${code}\n\nOutput: ${backendOutput}\n\nErrors: ${backendError}`;
        console.error(errorMsg);
        showErrorDialog('Backend Server Error', errorMsg);
      }
    });

    // Wait a bit for the server to start, then check if it's still running
    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        console.log('Backend server started successfully');
        resolve();
      } else {
        const errorMsg = 'Backend server failed to start or crashed immediately.';
        console.error(errorMsg);
        showErrorDialog('Backend Startup Failed', errorMsg);
        reject(new Error(errorMsg));
      }
    }, 5000); // Increased timeout to 5 seconds
  });
}

// Function to stop the backend server
function stopBackendServer() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

function createWindow() {
  const preloadPath = isDev 
    ? path.join(__dirname, 'preload.cjs')
    : path.join(__dirname, 'preload.cjs');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    titleBarStyle: 'default',
    show: false, // Don't show until ready
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools();
    }
  });

  // Load the app
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // In production, load from the built files
    // __dirname in compiled .cjs is electron/dist/, so we need to go up two levels
    const htmlPath = path.join(app.getAppPath(), 'dist', 'index.html');
    console.log('Loading HTML from:', htmlPath);
    mainWindow.loadFile(htmlPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    if (!isDev) {
      showErrorDialog('Failed to Load Application', `Error ${errorCode}: ${errorDescription}`);
    }
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone:', details);
    if (details.reason === 'crashed') {
      showErrorDialog('Application Crashed', 'The application window has crashed. Please restart the application.');
    }
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  showErrorDialog('Application Error', `An unexpected error occurred:\n\n${error.message}\n\n${error.stack}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  showErrorDialog('Application Error', `An unhandled promise rejection occurred:\n\n${reason}`);
});

// App event handlers
app.whenReady().then(async () => {
  try {
    console.log('App starting...');
    console.log('App path:', app.getAppPath());
    console.log('Resources path:', process.resourcesPath);
    console.log('Backend path:', backendPath);
    
    // Start backend server first
    console.log('Starting backend server...');
    await startBackendServer();
    console.log('Backend server started');

    // Then create the window
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error: any) {
    const errorMsg = `Failed to start application:\n\n${error.message}\n\n${error.stack || ''}`;
    console.error(errorMsg);
    showErrorDialog('Application Startup Failed', errorMsg);
    
    // Wait a bit before quitting to show the error
    setTimeout(() => {
      app.quit();
    }, 3000);
  }
});

app.on('window-all-closed', () => {
  stopBackendServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackendServer();
});

// IPC handlers for communication between renderer and main process
ipcMain.handle('get-backend-url', () => {
  return `http://localhost:${backendPort}`;
});

ipcMain.handle('is-electron', () => {
  return true;
});

// Handle app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

