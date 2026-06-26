import mysql from 'mysql2/promise'
import type { ConnectionConfig, SchemaInfo } from '@shared/types'
import { buildResult, type Driver } from './types'
import { bindParams } from '../bindParams'
import { groupColumns } from './introspect'

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
    async query(sql, params) {
      const start = Date.now()
      const bound = bindParams(sql, params, 'mysql')
      const [rows, fields] = await getPool().query(bound.sql, bound.values)
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
    async introspect(): Promise<SchemaInfo> {
      const [rows] = await getPool().query(
        `SELECT TABLE_NAME AS t, COLUMN_NAME AS c, DATA_TYPE AS d
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ?
         ORDER BY TABLE_NAME, ORDINAL_POSITION`,
        [config.database]
      )
      const list = rows as { t: string; c: string; d: string }[]
      return groupColumns(list.map((r) => ({ table: r.t, column: r.c, type: r.d })))
    },
    async close() {
      if (pool) {
        await pool.end()
        pool = null
      }
    }
  }
}
