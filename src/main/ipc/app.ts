/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { app, ipcMain } from 'electron'
import { CH } from '@shared/channels'
import type { AppInfo, IpcResult } from '@shared/types'
import { isPortable } from '../portable'

/**
 * Ürün künyesi. Sürüm tek kaynaktan — package.json'dan — okunur; Hakkında ekranı
 * ve alt bilgi bu değeri gösterir, hiçbir yerde elle yazılmaz.
 */
export function appInfo(): AppInfo {
  return {
    name: app.getName(),
    version: app.getVersion(),
    portable: isPortable(),
    dataDir: app.getPath('userData')
  }
}

export function registerAppIpc(): void {
  ipcMain.handle(CH.appInfo, (): IpcResult<AppInfo> => ({ ok: true, data: appInfo() }))
}
