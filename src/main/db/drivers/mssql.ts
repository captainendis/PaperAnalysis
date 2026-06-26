import sql from 'mssql'
import type { ConnectionConfig } from '@shared/types'
import { buildResult, type Driver } from './types'

export function createMssqlDriver(config: ConnectionConfig): Driver {
  let pool: sql.ConnectionPool | null = null

  const getPool = async (): Promise<sql.ConnectionPool> => {
    if (!pool) {
      pool = await new sql.ConnectionPool({
        server: config.host ?? 'localhost',
        port: config.port ?? 1433,
        user: config.user,
        password: config.password,
        database: config.database,
        connectionTimeout: 10_000,
        requestTimeout: 30_000,
        options: {
          encrypt: config.ssl ?? true,
          trustServerCertificate: true
        }
      }).connect()
    }
    return pool
  }

  return {
    async test() {
      const p = await getPool()
      await p.request().query('SELECT 1')
    },
    async query(sqlText) {
      const start = Date.now()
      const p = await getPool()
      const result = await p.request().query(sqlText)
      const recordset = result.recordset ?? []
      const columns = recordset.columns
        ? Object.keys(recordset.columns)
        : recordset.length > 0
          ? Object.keys(recordset[0])
          : []
      return buildResult(columns, recordset as Record<string, unknown>[], Date.now() - start)
    },
    async close() {
      if (pool) {
        await pool.close()
        pool = null
      }
    }
  }
}
