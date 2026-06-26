import { contextBridge, ipcRenderer } from 'electron'
import { CH } from '@shared/channels'
import type {
  ConnectionConfig,
  Dashboard,
  IpcResult,
  QueryResult,
  SafeConnection
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
    run: (connectionId: string, sql: string): Promise<IpcResult<QueryResult>> =>
      ipcRenderer.invoke(CH.query, { connectionId, sql })
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
      ipcRenderer.invoke(CH.dashExport, { dataUrl, suggestedName })
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
