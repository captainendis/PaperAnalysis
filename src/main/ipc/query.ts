import { ipcMain } from 'electron'
import { CH } from '@shared/channels'
import type { IpcResult, QueryResult } from '@shared/types'
import { credentialStore } from '../secure/credentials'
import { connectionManager } from '../db/manager'

export function registerQueryIpc(): void {
  ipcMain.handle(
    CH.query,
    async (
      _e,
      payload: { connectionId: string; sql: string; params?: Record<string, unknown> }
    ): Promise<IpcResult<QueryResult>> => {
      try {
        const config = credentialStore.getFull(payload.connectionId)
        if (!config) {
          return { ok: false, error: 'Bağlantı bulunamadı. Önce bir bağlantı kaydedin.' }
        }
        const sql = payload.sql.trim()
        if (!sql) {
          return { ok: false, error: 'Sorgu boş olamaz.' }
        }
        const data = await connectionManager.run(config, sql, payload.params)
        return { ok: true, data }
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    }
  )
}
