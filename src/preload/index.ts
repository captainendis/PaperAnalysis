/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { contextBridge, ipcRenderer } from 'electron'
import { CH } from '@shared/channels'
import type {
  AppInfo,
  ConnectionConfig,
  Dashboard,
  IpcResult,
  PublishStatus,
  QueryResult,
  ReportStatus,
  SafeConnection,
  SchemaInfo
} from '@shared/types'

const api = {
  app: {
    /** Ürün künyesi (ad, sürüm, taşınabilirlik) — Hakkında ekranı buradan okur. */
    info: (): Promise<IpcResult<AppInfo>> => ipcRenderer.invoke(CH.appInfo),
    /** Menüdeki "Hakkında" tıklandığında tetiklenir; aboneliği kaldıran işlev döner. */
    onShowAbout: (handler: () => void): (() => void) => {
      const listener = (): void => handler()
      ipcRenderer.on(CH.appShowAbout, listener)
      return () => ipcRenderer.removeListener(CH.appShowAbout, listener)
    }
  },
  connection: {
    test: (config: ConnectionConfig): Promise<IpcResult<true>> =>
      ipcRenderer.invoke(CH.connTest, config),
    save: (config: ConnectionConfig): Promise<IpcResult<SafeConnection>> =>
      ipcRenderer.invoke(CH.connSave, config),
    list: (): Promise<IpcResult<SafeConnection[]>> => ipcRenderer.invoke(CH.connList),
    delete: (id: string): Promise<IpcResult<true>> => ipcRenderer.invoke(CH.connDelete, id)
  },
  query: {
    run: (
      connectionId: string,
      sql: string,
      params?: Record<string, unknown>,
      requestId?: string
    ): Promise<IpcResult<QueryResult>> =>
      ipcRenderer.invoke(CH.query, { connectionId, sql, params, requestId }),
    cancel: (requestId: string): Promise<IpcResult<true>> =>
      ipcRenderer.invoke(CH.queryCancel, { requestId })
  },
  schema: {
    introspect: (connectionId: string): Promise<IpcResult<SchemaInfo>> =>
      ipcRenderer.invoke(CH.schemaIntrospect, connectionId)
  },
  dashboard: {
    save: (dashboard: Dashboard, path?: string): Promise<IpcResult<{ path: string }>> =>
      ipcRenderer.invoke(CH.dashSave, { dashboard, path }),
    open: (): Promise<IpcResult<{ dashboard: Dashboard; path: string }>> =>
      ipcRenderer.invoke(CH.dashOpen),
    exportPng: (
      dataUrl: string,
      suggestedName: string
    ): Promise<IpcResult<{ path: string }>> =>
      ipcRenderer.invoke(CH.dashExport, { dataUrl, suggestedName }),
    exportPdf: (suggestedName: string): Promise<IpcResult<{ path: string }>> =>
      ipcRenderer.invoke(CH.dashExportPdf, { suggestedName })
  },
  file: {
    saveText: (
      text: string,
      suggestedName: string,
      extensions: string[]
    ): Promise<IpcResult<{ path: string }>> =>
      ipcRenderer.invoke(CH.fileSaveText, { text, suggestedName, extensions }),
    saveBinary: (
      base64: string,
      suggestedName: string,
      extensions: string[]
    ): Promise<IpcResult<{ path: string }>> =>
      ipcRenderer.invoke(CH.fileSaveBinary, { base64, suggestedName, extensions })
  },
  report: {
    pickFolder: (): Promise<IpcResult<{ folder: string }>> =>
      ipcRenderer.invoke(CH.reportPickFolder),
    schedule: (
      folder: string,
      intervalMinutes: number,
      baseName: string
    ): Promise<IpcResult<ReportStatus>> =>
      ipcRenderer.invoke(CH.reportSchedule, { folder, intervalMinutes, baseName }),
    cancel: (): Promise<IpcResult<ReportStatus>> => ipcRenderer.invoke(CH.reportCancel),
    status: (): Promise<IpcResult<ReportStatus>> => ipcRenderer.invoke(CH.reportStatus)
  },
  publish: {
    start: (html: string, port: number): Promise<IpcResult<PublishStatus>> =>
      ipcRenderer.invoke(CH.publishStart, { html, port }),
    republish: (html: string): Promise<IpcResult<PublishStatus>> =>
      ipcRenderer.invoke(CH.publishRepublish, { html }),
    stop: (): Promise<IpcResult<PublishStatus>> => ipcRenderer.invoke(CH.publishStop),
    status: (): Promise<IpcResult<PublishStatus>> => ipcRenderer.invoke(CH.publishStatus)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
