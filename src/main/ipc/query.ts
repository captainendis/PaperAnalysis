import { ipcMain } from 'electron'
import { CH } from '@shared/channels'
import type { IpcResult, QueryResult } from '@shared/types'
import { credentialStore } from '../secure/credentials'
import { connectionManager } from '../db/manager'

/** Çalışan sorguların iptal denetleyicileri (requestId → AbortController). */
const active = new Map<string, AbortController>()

export function registerQueryIpc(): void {
  ipcMain.handle(
    CH.query,
    async (
      _e,
      payload: {
        connectionId: string
        sql: string
        params?: Record<string, unknown>
        requestId?: string
      }
    ): Promise<IpcResult<QueryResult>> => {
      const controller = new AbortController()
      if (payload.requestId) active.set(payload.requestId, controller)
      try {
        const config = credentialStore.getFull(payload.connectionId)
        if (!config) {
          return { ok: false, error: 'Bağlantı bulunamadı. Önce bir bağlantı kaydedin.' }
        }
        const sql = payload.sql.trim()
        if (!sql) {
          return { ok: false, error: 'Sorgu boş olamaz.' }
        }
        const data = await connectionManager.run(config, sql, payload.params, controller.signal)
        return { ok: true, data }
      } catch (err) {
        if (controller.signal.aborted) {
          return { ok: false, error: 'Sorgu iptal edildi.' }
        }
        return { ok: false, error: (err as Error).message }
      } finally {
        if (payload.requestId) active.delete(payload.requestId)
      }
    }
  )

  ipcMain.handle(CH.queryCancel, async (_e, payload: { requestId: string }): Promise<IpcResult<true>> => {
    const controller = active.get(payload.requestId)
    if (controller) controller.abort()
    return { ok: true, data: true }
  })
}
