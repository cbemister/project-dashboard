const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn, fork } = require('child_process');
const net = require('net');

const isDev = process.env.NODE_ENV === 'development';
const PORT = 3000;
const SERVER_URL = `http://localhost:${PORT}`;

let mainWindow;
let serverProcess;

// Find an available port
async function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// Wait for server to be ready
async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Server failed to start within timeout');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    titleBarStyle: 'default',
    show: false,
    backgroundColor: '#1a1a1a',
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadURL(SERVER_URL);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (!url.startsWith(SERVER_URL)) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    }
    return { action: 'allow' };
  });
}

// Start Next.js development server
function startDevServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting Next.js development server...');

    serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      shell: true,
      stdio: 'pipe',
      env: { ...process.env, PORT: PORT.toString() },
    });

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Next.js] ${output}`);

      if (output.includes('Ready') || output.includes('Local:')) {
        setTimeout(resolve, 1000);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[Next.js] ${data}`);
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start Next.js:', err);
      reject(err);
    });

    // Fallback timeout
    setTimeout(resolve, 30000);
  });
}

// Start production server
function startProductionServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting production server...');

    const standaloneDir = path.join(__dirname, '../.next/standalone');
    const serverPath = path.join(standaloneDir, 'server.js');

    serverProcess = fork(serverPath, [], {
      cwd: standaloneDir,
      env: {
        ...process.env,
        PORT: PORT.toString(),
        NODE_ENV: 'production',
      },
      stdio: 'pipe',
    });

    serverProcess.stdout?.on('data', (data) => {
      console.log(`[Server] ${data}`);
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error(`[Server] ${data}`);
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start production server:', err);
      reject(err);
    });

    // Wait for server to be ready
    waitForServer(SERVER_URL)
      .then(resolve)
      .catch(reject);
  });
}

// Start the appropriate server
async function startServer() {
  if (isDev) {
    await startDevServer();
  } else {
    await startProductionServer();
  }
}

// Cleanup server process
function cleanupServer() {
  if (serverProcess) {
    console.log('Stopping server...');
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
    } else {
      serverProcess.kill('SIGTERM');
    }
    serverProcess = null;
  }
}

// App lifecycle
app.whenReady().then(async () => {
  try {
    await startServer();
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  cleanupServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  cleanupServer();
});

app.on('quit', () => {
  cleanupServer();
});

// IPC handlers for native operations
ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('open-path', async (event, filePath) => {
  await shell.openPath(filePath);
});

ipcMain.handle('show-item-in-folder', async (event, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});
