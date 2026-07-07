import { app, BrowserWindow, dialog, shell } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
import { registerConnectionIpc } from './ipc/connections'
import { registerQueryIpc } from './ipc/query'
import { registerSchemaIpc } from './ipc/schema'
import { registerStorageIpc } from './ipc/storage'
import { registerReportIpc, stopReportTimer } from './ipc/report'
import { registerPublishIpc, stopPublishServer } from './ipc/publish'
import { connectionManager } from './db/manager'

/**
 * Otomatik güncelleme: paketlenmiş uygulamada GitHub Releases kontrol edilir,
 * yeni sürüm arka planda indirilir ve kullanıcı onayıyla yerinde kurulur —
 * silip yeniden kurmaya gerek kalmaz. Geliştirme modunda çalışmaz.
 */
function setupAutoUpdate(): void {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-downloaded', async (info) => {
    const { response } = await dialog.showMessageBox({
      type: 'info',
      buttons: ['Şimdi yeniden başlat', 'Sonra'],
      defaultId: 0,
      cancelId: 1,
      title: 'Güncelleme hazır',
      message: `PaperAnalysis ${info.version} indirildi.`,
      detail:
        'Yeni sürüm, uygulamayı yeniden başlattığınızda otomatik kurulacak — ' +
        'silip yeniden kurmanıza gerek yok. Şimdi yeniden başlatmak ister misiniz?'
    })
    if (response === 0) {
      stopReportTimer()
      stopPublishServer()
      await connectionManager.closeAll()
      autoUpdater.quitAndInstall()
    }
  })

  autoUpdater.on('error', (err) => {
    // Ağ/erişim hatalarında sessizce geç; uygulamayı engelleme.
    console.error('Otomatik güncelleme hatası:', err?.message ?? err)
  })

  // Başlangıçta ve saatlik olarak kontrol et.
  autoUpdater.checkForUpdates().catch(() => undefined)
  setInterval(() => autoUpdater.checkForUpdates().catch(() => undefined), 60 * 60 * 1000)
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 640,
    show: false,
    backgroundColor: '#1e1f26',
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
