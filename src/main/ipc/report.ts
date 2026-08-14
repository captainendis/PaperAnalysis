/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { ipcMain, dialog, BrowserWindow } from 'electron'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { CH } from '@shared/channels'
import type { IpcResult, ReportStatus } from '@shared/types'
import { reportFileName } from '../report/filename'

let timer: ReturnType<typeof setInterval> | null = null

const status: ReportStatus = {
  active: false,
  folder: '',
  intervalMinutes: 0,
  baseName: 'pano',
  lastAt: null,
  lastFile: null
}

/** Aktif pencereyi panoyu PDF olarak yazdırıp klasöre kaydeder. */
async function exportOnce(): Promise<void> {
  const win = BrowserWindow.getAllWindows()[0]
  if (!win || !status.folder) return
  const pdf = await win.webContents.printToPDF({
    landscape: true,
    printBackground: true,
    pageSize: 'A4'
  })
  const file = join(status.folder, reportFileName(status.baseName, new Date()))
  await writeFile(file, pdf)
  status.lastAt = Date.now()
  status.lastFile = file
}

export function stopReportTimer(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  status.active = false
}

export function registerReportIpc(): void {
  ipcMain.handle(CH.reportPickFolder, async (e): Promise<IpcResult<{ folder: string }>> => {
    try {
      const win = BrowserWindow.fromWebContents(e.sender) ?? undefined
      const res = await dialog.showOpenDialog(win!, {
        title: 'Rapor Klasörü Seç',
        properties: ['openDirectory', 'createDirectory']
      })
      if (res.canceled || res.filePaths.length === 0) {
        return { ok: false, error: 'İptal edildi.' }
      }
      return { ok: true, data: { folder: res.filePaths[0] } }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle(
    CH.reportSchedule,
    async (
      _e,
      payload: { folder: string; intervalMinutes: number; baseName: string }
    ): Promise<IpcResult<ReportStatus>> => {
      try {
        if (!payload.folder) return { ok: false, error: 'Klasör seçilmedi.' }
        if (!payload.intervalMinutes || payload.intervalMinutes <= 0) {
          return { ok: false, error: 'Geçerli bir aralık seçin.' }
        }
        stopReportTimer()
        status.folder = payload.folder
        status.intervalMinutes = payload.intervalMinutes
        status.baseName = payload.baseName || 'pano'
        status.active = true

        // İlk raporu hemen üret (çalıştığını doğrulamak için).
        await exportOnce()

        timer = setInterval(() => {
          void exportOnce().catch(() => undefined)
        }, payload.intervalMinutes * 60_000)

        return { ok: true, data: { ...status } }
      } catch (err) {
        stopReportTimer()
        return { ok: false, error: (err as Error).message }
      }
    }
  )

  ipcMain.handle(CH.reportCancel, async (): Promise<IpcResult<ReportStatus>> => {
    stopReportTimer()
    return { ok: true, data: { ...status } }
  })

  ipcMain.handle(CH.reportStatus, async (): Promise<IpcResult<ReportStatus>> => {
    return { ok: true, data: { ...status } }
  })
}
