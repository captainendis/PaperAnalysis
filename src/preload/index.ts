import { contextBridge, ipcRenderer } from 'electron'
import { CH } from '@shared/channels'
import type {
  ConnectionConfig,
  Dashboard,
  IpcResult,
  QueryResult,
  SafeConnection,
  SchemaInfo
} from '@shared/types'

const api = {
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
      params?: Record<string, unknown>
    ): Promise<IpcResult<QueryResult>> =>
      ipcRenderer.invoke(CH.query, { connectionId, sql, params })
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
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
