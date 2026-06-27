import { ipcMain, app } from 'electron'
import { join } from 'path'
import { CH } from '@shared/channels'
import type { IpcResult } from '@shared/types'
import { createSampleDatabase } from '../db/sampleData'

export function registerSampleIpc(): void {
  ipcMain.handle(
    CH.sampleCreate,
    async (): Promise<IpcResult<{ filePath: string; rowCount: number }>> => {
      try {
        const filePath = join(app.getPath('userData'), 'samples', 'ornek-satis.sqlite')
        const res = createSampleDatabase(filePath)
        return { ok: true, data: res }
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    }
  )
}
