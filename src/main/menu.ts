/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { BrowserWindow, Menu, app, shell } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'
import { CH } from '@shared/channels'
import { checkForUpdates } from './update/paxUpdate'

/** Hakkında penceresini açması için ön yüze haber verir. */
function showAbout(): void {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  win?.webContents.send(CH.appShowAbout)
}

/**
 * Uygulama menüsü. Menü metinleri Türkçe; Yardım altında PaperAxis künyesine
 * açılan "PaperAnalysis Hakkında" girişi bulunur.
 */
export function buildAppMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Dosya',
      submenu: [
        { role: 'close', label: 'Pencereyi Kapat' },
        { type: 'separator' },
        { role: 'quit', label: 'Çıkış' }
      ]
    },
    {
      label: 'Düzen',
      submenu: [
        { role: 'undo', label: 'Geri Al' },
        { role: 'redo', label: 'Yinele' },
        { type: 'separator' },
        { role: 'cut', label: 'Kes' },
        { role: 'copy', label: 'Kopyala' },
        { role: 'paste', label: 'Yapıştır' },
        { role: 'selectAll', label: 'Tümünü Seç' }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        { role: 'reload', label: 'Yenile' },
        { role: 'toggleDevTools', label: 'Geliştirici Araçları' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Yakınlaştırmayı Sıfırla' },
        { role: 'zoomIn', label: 'Yakınlaştır' },
        { role: 'zoomOut', label: 'Uzaklaştır' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tam Ekran' }
      ]
    },
    {
      label: 'Yardım',
      submenu: [
        {
          label: 'Güncellemeleri Denetle',
          click: () => void checkForUpdates(false)
        },
        {
          label: 'PaperAxis',
          click: () => void shell.openExternal('https://paperaxis.com')
        },
        {
          label: 'İletişim (info@paperaxis.com)',
          click: () => void shell.openExternal('mailto:info@paperaxis.com')
        },
        { type: 'separator' },
        { label: `${app.getName()} Hakkında`, click: showAbout }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
