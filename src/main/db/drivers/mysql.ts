import mysql from 'mysql2/promise'
import type { ConnectionConfig } from '@shared/types'
import { buildResult, type Driver } from './types'

export function createMysqlDriver(config: ConnectionConfig): Driver {
  let pool: mysql.Pool | null = null
  const getPool = (): mysql.Pool => {
    if (!pool) {
      pool = mysql.createPool({
        host: config.host,
        port: config.port ?? 3306,
        user: config.user,
        password: config.password,
        database: config.database,
        ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
        connectTimeout: 10_000,
        connectionLimit: 4,
        // Tarih/sayı değerlerini JS string yerine doğal tip olarak döndür.
        dateStrings: true
      })
    }
    return pool
  }

  return {
    async test() {
      const conn = await getPool().getConnection()
      try {
        await conn.query('SELECT 1')
      } finally {
        conn.release()
      }
    },
    async query(sql) {
      const start = Date.now()
      const [rows, fields] = await getPool().query(sql)
      // INSERT/UPDATE gibi sorgularda rows bir ResultSetHeader olur.
      if (Array.isArray(rows)) {
        const columns = (fields ?? []).map((f) => f.name)
        return buildResult(columns, rows as Record<string, unknown>[], Date.now() - start)
      }
      const header = rows as mysql.ResultSetHeader
      return buildResult(
        ['affectedRows', 'insertId'],
        [{ affectedRows: header.affectedRows, insertId: header.insertId }],
        Date.now() - start
      )
    },
    async close() {
      if (pool) {
        await pool.end()
        pool = null
      }
    }
  }
}
