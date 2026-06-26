import Database from 'better-sqlite3'
import type { ConnectionConfig, SchemaInfo } from '@shared/types'
import { buildResult, type Driver } from './types'
import { bindParams } from '../bindParams'

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
    async query(sql, params) {
      const start = Date.now()
      const handle = open()
      const bound = bindParams(sql, params, 'sqlite')
      const stmt = handle.prepare(bound.sql)
      const args = bound.usedNames.length > 0 ? [bound.named] : []
      // SELECT vb. sonuç döndüren sorgular için .reader true olur.
      if (stmt.reader) {
        const rows = stmt.all(...args) as Record<string, unknown>[]
        const columns = stmt.columns().map((c) => c.name)
        return buildResult(columns, rows, Date.now() - start)
      }
      const info = stmt.run(...args)
      return buildResult(
        ['changes', 'lastInsertRowid'],
        [{ changes: info.changes, lastInsertRowid: Number(info.lastInsertRowid) }],
        Date.now() - start
      )
    },
    async introspect(): Promise<SchemaInfo> {
      const handle = open()
      const tables = handle
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .all() as { name: string }[]
      return {
        tables: tables.map((t) => {
          const cols = handle.prepare(`PRAGMA table_info("${t.name}")`).all() as {
            name: string
            type: string
          }[]
          return {
            name: t.name,
            columns: cols.map((c) => ({ name: c.name, type: c.type || 'TEXT' }))
          }
        })
      }
    },
    async close() {
      if (db) {
        db.close()
        db = null
      }
    }
  }
}
