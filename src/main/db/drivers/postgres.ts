import pg from 'pg'
import type { ConnectionConfig } from '@shared/types'
import { buildResult, type Driver } from './types'

export function createPostgresDriver(config: ConnectionConfig): Driver {
  let pool: pg.Pool | null = null
  const getPool = (): pg.Pool => {
    if (!pool) {
      pool = new pg.Pool({
        host: config.host,
        port: config.port ?? 5432,
        user: config.user,
        password: config.password,
        database: config.database,
        ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
        connectionTimeoutMillis: 10_000,
        max: 4
      })
    }
    return pool
  }

  return {
    async test() {
      const client = await getPool().connect()
      try {
        await client.query('SELECT 1')
      } finally {
        client.release()
      }
    },
    async query(sql) {
      const start = Date.now()
      const res = await getPool().query(sql)
      const columns = res.fields.map((f) => f.name)
      const rows = res.rows as Record<string, unknown>[]
      return buildResult(columns, rows, Date.now() - start)
    },
    async close() {
      if (pool) {
        await pool.end()
        pool = null
      }
    }
  }
}
