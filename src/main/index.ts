import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { registerConnectionIpc } from './ipc/connections'
import { registerQueryIpc } from './ipc/query'
import { registerSchemaIpc } from './ipc/schema'
import { registerSampleIpc } from './ipc/sample'
import { registerStorageIpc } from './ipc/storage'
import { connectionManager } from './db/manager'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 640,
    show: false,
    backgroundColor: '#1e1f26',
    title: 'Power BI Tarzı Analiz',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.on('ready-to-show', () => win.show())

  // Harici linkleri tarayıcıda aç.
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerConnectionIpc()
  registerQueryIpc()
  registerSchemaIpc()
  registerSampleIpc()
  registerStorageIpc()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async () => {
  await connectionManager.closeAll()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', async () => {
  await connectionManager.closeAll()
})
