import { ipcMain } from 'electron'
import { CH } from '@shared/channels'
import type { ConnectionConfig, IpcResult, SafeConnection } from '@shared/types'
import { credentialStore } from '../secure/credentials'
import { connectionManager } from '../db/manager'

function toSafe(c: ConnectionConfig): SafeConnection {
  const { password, ...rest } = c
  return { ...rest, hasPassword: Boolean(password) }
}

export function registerConnectionIpc(): void {
  ipcMain.handle(
    CH.connTest,
    async (_e, config: ConnectionConfig): Promise<IpcResult<true>> => {
      try {
        await connectionManager.testEphemeral(config)
        return { ok: true, data: true }
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    }
  )

  ipcMain.handle(
    CH.connSave,
    async (_e, config: ConnectionConfig): Promise<IpcResult<SafeConnection>> => {
      try {
        credentialStore.save(config)
        return { ok: true, data: toSafe(config) }
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    }
  )

  ipcMain.handle(CH.connList, async (): Promise<IpcResult<SafeConnection[]>> => {
    try {
      return { ok: true, data: credentialStore.listFull().map(toSafe) }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle(
    CH.connDelete,
    async (_e, id: string): Promise<IpcResult<true>> => {
      try {
        await connectionManager.closeOne(id)
        credentialStore.delete(id)
        return { ok: true, data: true }
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    }
  )
}
