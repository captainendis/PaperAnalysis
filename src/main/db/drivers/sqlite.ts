import Database from 'better-sqlite3'
import type { ConnectionConfig } from '@shared/types'
import { buildResult, type Driver } from './types'

export function createSqliteDriver(config: ConnectionConfig): Driver {
  if (!config.filePath) {
    throw new Error('SQLite bağlantısı için dosya yolu (filePath) gerekli.')
  }

  let db: Database.Database | null = null
  const open = (): Database.Database => {
    if (!db) db = new Database(config.filePath!, { fileMustExist: false })
    return db
  }

  return {
    async test() {
      const handle = open()
      handle.prepare('SELECT 1').get()
    },
    async query(sql) {
      const start = Date.now()
      const handle = open()
      const stmt = handle.prepare(sql)
      // SELECT vb. sonuç döndüren sorgular için .reader true olur.
      if (stmt.reader) {
        const rows = stmt.all() as Record<string, unknown>[]
        const columns = stmt.columns().map((c) => c.name)
        return buildResult(columns, rows, Date.now() - start)
      }
      const info = stmt.run()
      return buildResult(
        ['changes', 'lastInsertRowid'],
        [{ changes: info.changes, lastInsertRowid: Number(info.lastInsertRowid) }],
        Date.now() - start
      )
    },
    async close() {
      if (db) {
        db.close()
        db = null
      }
    }
  }
}
