import pg from 'pg'
import type { ConnectionConfig, SchemaInfo } from '@shared/types'
import { buildResult, resolveTimeoutMs, type Driver } from './types'
import { bindParams } from '../bindParams'
import { groupColumns } from './introspect'

export function createPostgresDriver(config: ConnectionConfig): Driver {
  let pool: pg.Pool | null = null
  const getPool = (): pg.Pool => {
    if (!pool) {
      // statement_timeout: 0 = sınırsız (büyük sorgularda erken kesilmeyi önler).
      const statementTimeout = resolveTimeoutMs(config.queryTimeoutSec)
      pool = new pg.Pool({
        host: config.host,
        port: config.port ?? 5432,
        user: config.user,
        password: config.password,
        database: config.database,
        ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
        connectionTimeoutMillis: 30_000,
        statement_timeout: statementTimeout || undefined,
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
    async query(sql, params, signal) {
      const start = Date.now()
      const bound = bindParams(sql, params, 'postgres')
      if (signal?.aborted) throw new Error('Sorgu iptal edildi.')
      // İptal edilebilmesi için özel bir istemci al; iptalde bağlantıyı düşür
      // (sunucu çalışan sorguyu iptal eder).
      const client = await getPool().connect()
      let cancelled = false
      const onAbort = (): void => {
        cancelled = true
        client.release(new Error('İptal edildi'))
      }
      signal?.addEventListener('abort', onAbort, { once: true })
      try {
        const res = await client.query(bound.sql, bound.values)
        const columns = res.fields.map((f) => f.name)
        const rows = res.rows as Record<string, unknown>[]
        return buildResult(columns, rows, Date.now() - start)
      } catch (err) {
        if (cancelled) throw new Error('Sorgu iptal edildi.')
        throw err
      } finally {
        signal?.removeEventListener('abort', onAbort)
        if (!cancelled) client.release()
      }
    },
    async introspect(): Promise<SchemaInfo> {
      const res = await getPool().query<{
        table_schema: string
        table_name: string
        column_name: string
        data_type: string
      }>(
        `SELECT table_schema, table_name, column_name, data_type
         FROM information_schema.columns
         WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
         ORDER BY table_schema, table_name, ordinal_position`
      )
      return groupColumns(
        res.rows.map((r) => ({
          schema: r.table_schema,
          table: r.table_name,
          column: r.column_name,
          type: r.data_type
        }))
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
