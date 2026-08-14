/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { CH } from '@shared/channels'
import type { Dashboard, IpcResult } from '@shared/types'

export function registerStorageIpc(): void {
  // Pano kaydet (.pbdash). path verilmezse "Farklı kaydet" diyaloğu açılır.
  ipcMain.handle(
    CH.dashSave,
    async (
      e,
      payload: { dashboard: Dashboard; path?: string }
    ): Promise<IpcResult<{ path: string }>> => {
      try {
        let target = payload.path
        if (!target) {
          const win = BrowserWindow.fromWebContents(e.sender) ?? undefined
          const res = await dialog.showSaveDialog(win!, {
            title: 'Panoyu Kaydet',
            defaultPath: `${payload.dashboard.name || 'pano'}.pbdash`,
            filters: [{ name: 'Pano', extensions: ['pbdash', 'json'] }]
          })
          if (res.canceled || !res.filePath) {
            return { ok: false, error: 'İptal edildi.' }
          }
          target = res.filePath
        }
        await writeFile(target, JSON.stringify(payload.dashboard, null, 2), 'utf-8')
        return { ok: true, data: { path: target } }
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    }
  )

  // Pano aç (.pbdash) -> Dashboard nesnesi döndürür.
  ipcMain.handle(
    CH.dashOpen,
    async (e): Promise<IpcResult<{ dashboard: Dashboard; path: string }>> => {
      try {
        const win = BrowserWindow.fromWebContents(e.sender) ?? undefined
        const res = await dialog.showOpenDialog(win!, {
          title: 'Pano Aç',
          properties: ['openFile'],
          filters: [{ name: 'Pano', extensions: ['pbdash', 'json'] }]
        })
        if (res.canceled || res.filePaths.length === 0) {
          return { ok: false, error: 'İptal edildi.' }
        }
        const path = res.filePaths[0]
        const raw = await readFile(path, 'utf-8')
        const dashboard = JSON.parse(raw) as Dashboard
        return { ok: true, data: { dashboard, path } }
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    }
  )

  // Grafik PNG dışa aktarma (renderer'dan gelen dataURL'i dosyaya yazar).
  ipcMain.handle(
    CH.dashExport,
    async (
      e,
      payload: { dataUrl: string; suggestedName: string }
    ): Promise<IpcResult<{ path: string }>> => {
      try {
        const win = BrowserWindow.fromWebContents(e.sender) ?? undefined
        const res = await dialog.showSaveDialog(win!, {
          title: 'Grafiği Dışa Aktar',
          defaultPath: payload.suggestedName,
          filters: [{ name: 'PNG Görsel', extensions: ['png'] }]
        })
        if (res.canceled || !res.filePath) {
          return { ok: false, error: 'İptal edildi.' }
        }
        const base64 = payload.dataUrl.replace(/^data:image\/png;base64,/, '')
        await writeFile(res.filePath, Buffer.from(base64, 'base64'))
        return { ok: true, data: { path: res.filePath } }
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    }
  )

  // Düz metin dosyası kaydet (CSV vb.).
  ipcMain.handle(
    CH.fileSaveText,
    async (
      e,
      payload: { text: string; suggestedName: string; extensions: string[] }
    ): Promise<IpcResult<{ path: string }>> => {
      try {
        const win = BrowserWindow.fromWebContents(e.sender) ?? undefined
        const res = await dialog.showSaveDialog(win!, {
          title: 'Dışa Aktar',
          defaultPath: payload.suggestedName,
          filters: [{ name: 'Dosya', extensions: payload.extensions }]
        })
        if (res.canceled || !res.filePath) return { ok: false, error: 'İptal edildi.' }
        await writeFile(res.filePath, payload.text, 'utf-8')
        return { ok: true, data: { path: res.filePath } }
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    }
  )

  // İkili dosya kaydet (Excel/xlsx; base64 ile aktarılır).
  ipcMain.handle(
    CH.fileSaveBinary,
    async (
      e,
      payload: { base64: string; suggestedName: string; extensions: string[] }
    ): Promise<IpcResult<{ path: string }>> => {
      try {
        const win = BrowserWindow.fromWebContents(e.sender) ?? undefined
        const res = await dialog.showSaveDialog(win!, {
          title: 'Dışa Aktar',
          defaultPath: payload.suggestedName,
          filters: [{ name: 'Dosya', extensions: payload.extensions }]
        })
        if (res.canceled || !res.filePath) return { ok: false, error: 'İptal edildi.' }
        await writeFile(res.filePath, Buffer.from(payload.base64, 'base64'))
        return { ok: true, data: { path: res.filePath } }
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    }
  )

  // Panoyu PDF olarak dışa aktar (Electron printToPDF).
  ipcMain.handle(
    CH.dashExportPdf,
    async (e, payload: { suggestedName: string }): Promise<IpcResult<{ path: string }>> => {
      try {
        const win = BrowserWindow.fromWebContents(e.sender)
        if (!win) return { ok: false, error: 'Pencere bulunamadı.' }
        const res = await dialog.showSaveDialog(win, {
          title: 'Panoyu PDF Olarak Kaydet',
          defaultPath: payload.suggestedName,
          filters: [{ name: 'PDF', extensions: ['pdf'] }]
        })
        if (res.canceled || !res.filePath) return { ok: false, error: 'İptal edildi.' }
        const pdf = await win.webContents.printToPDF({
          landscape: true,
          printBackground: true,
          pageSize: 'A4'
        })
        await writeFile(res.filePath, pdf)
        return { ok: true, data: { path: res.filePath } }
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    }
  )
}
