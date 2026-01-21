const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require('electron')
const path = require('node:path')

const createWindow = () => {
  const isDev = process.env.NODE_ENV === 'development'

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Don't show until ready
    backgroundColor: '#1a1a1a', // Match app background to prevent white flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Show window only when content is ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Register DevTools shortcut (F12 or Ctrl+Shift+I)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' ||
        (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools()
    }
  })

  // In development, load the Next.js dev server
  // In production, load the built Next.js app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
  } else {
    // For now, load a simple index.html to verify Electron works
    mainWindow.loadFile(path.join(__dirname, 'index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC handler for native folder selection dialog
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select Projects Root Directory'
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})
