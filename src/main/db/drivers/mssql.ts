/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import sql from 'mssql'
import type { ConnectionConfig, SchemaInfo } from '@shared/types'
import { buildResult, resolveTimeoutMs, type Driver } from './types'
import { bindParams } from '../bindParams'
import { groupColumns } from './introspect'

export function createMssqlDriver(config: ConnectionConfig): Driver {
  let pool: sql.ConnectionPool | null = null

  const getPool = async (): Promise<sql.ConnectionPool> => {
    if (!pool) {
      // requestTimeout: 0 = sınırsız (büyük sorgu/join'lerde erken kesilmeyi önler).
      const requestTimeout = resolveTimeoutMs(config.queryTimeoutSec)
      pool = await new sql.ConnectionPool({
        server: config.host ?? 'localhost',
        port: config.port ?? 1433,
        user: config.user,
        password: config.password,
        database: config.database,
        connectionTimeout: 30_000,
        requestTimeout,
        // Havuzdan bağlantı beklerken de erken kesilme olmasın.
        pool: { acquireTimeoutMillis: requestTimeout || 600_000 },
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
    async query(sqlText, params, signal) {
      const start = Date.now()
      const p = await getPool()
      const bound = bindParams(sqlText, params, 'mssql')
      const request = p.request()
      for (const [key, value] of Object.entries(bound.named)) {
        request.input(key, value)
      }
      // İptal: signal tetiklenince çalışan isteği durdur.
      if (signal) {
        if (signal.aborted) throw new Error('Sorgu iptal edildi.')
        signal.addEventListener('abort', () => request.cancel(), { once: true })
      }
      const result = await request.query(bound.sql)
      const recordset = result.recordset ?? []
      // Meta veriden sütunları al; boş/eksikse buildResult satır anahtarlarına düşer.
      const metaCols = recordset.columns ? Object.keys(recordset.columns) : []
      return buildResult(metaCols, recordset as Record<string, unknown>[], Date.now() - start)
    },
    async introspect(): Promise<SchemaInfo> {
      const p = await getPool()
      const result = await p.request().query(
        `SELECT TABLE_SCHEMA AS s, TABLE_NAME AS t, COLUMN_NAME AS c, DATA_TYPE AS d
         FROM INFORMATION_SCHEMA.COLUMNS
         ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION`
      )
      const rows = (result.recordset ?? []) as { s: string; t: string; c: string; d: string }[]
      return groupColumns(rows.map((r) => ({ schema: r.s, table: r.t, column: r.c, type: r.d })))
    },
    async close() {
      if (pool) {
        await pool.close()
        pool = null
      }
    }
  }
}
