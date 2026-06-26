import type { SchemaInfo, TableInfo } from '@shared/types'

export interface FlatColumn {
  schema?: string
  table: string
  column: string
  type: string
}

/**
 * information_schema benzeri düz sütun satırlarını (schema, table, column, type)
 * tablo bazında gruplayarak SchemaInfo'ya dönüştürür. Giriş sırası korunur.
 */
export function groupColumns(rows: FlatColumn[]): SchemaInfo {
  const map = new Map<string, TableInfo>()
  for (const r of rows) {
    const key = `${r.schema ?? ''}.${r.table}`
    let t = map.get(key)
    if (!t) {
      t = { name: r.table, schema: r.schema, columns: [] }
      map.set(key, t)
    }
    t.columns.push({ name: r.column, type: r.type })
  }
  return { tables: Array.from(map.values()) }
}
