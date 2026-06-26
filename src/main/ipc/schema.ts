import { ipcMain } from 'electron'
import { CH } from '@shared/channels'
import type { IpcResult, SchemaInfo } from '@shared/types'
import { credentialStore } from '../secure/credentials'
import { connectionManager } from '../db/manager'

export function registerSchemaIpc(): void {
  ipcMain.handle(
    CH.schemaIntrospect,
    async (_e, connectionId: string): Promise<IpcResult<SchemaInfo>> => {
      try {
        const config = credentialStore.getFull(connectionId)
        if (!config) {
          return { ok: false, error: 'Bağlantı bulunamadı.' }
        }
        const data = await connectionManager.introspect(config)
        return { ok: true, data }
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    }
  )
}
