/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { setupPortablePaths } from './portable'
import { buildAppMenu } from './menu'
import { setupAutoUpdate } from './update/paxUpdate'
import { registerAppIpc } from './ipc/app'
import { registerConnectionIpc } from './ipc/connections'
import { registerQueryIpc } from './ipc/query'
import { registerSchemaIpc } from './ipc/schema'
import { registerStorageIpc } from './ipc/storage'
import { registerReportIpc, stopReportTimer } from './ipc/report'
import { registerPublishIpc, stopPublishServer } from './ipc/publish'
import { connectionManager } from './db/manager'

// Otomatik güncelleme, PaperAxis indirme servisi üzerinden yürütülür
// (bkz. ./update/paxUpdate). API anahtarları derlemeye gömülüdür.

// Taşınabilir kopyada veri yolları exe'nin yanına alınır; bu, herhangi bir yol
// okunmadan önce yapılmalıdır.
setupPortablePaths()

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 640,
    show: false,
    // PaperAxis koyu tema zemini (navy-900) — ilk boyama beyaz parlamasın.
    backgroundColor: '#0A1B30',
    title: 'PaperAnalysis',
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
  buildAppMenu()
  registerAppIpc()
  registerConnectionIpc()
  registerQueryIpc()
  registerSchemaIpc()
  registerStorageIpc()
  registerReportIpc()
  registerPublishIpc()

  createWindow()
  setupAutoUpdate()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async () => {
  await connectionManager.closeAll()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', async () => {
  stopReportTimer()
  stopPublishServer()
  await connectionManager.closeAll()
})
