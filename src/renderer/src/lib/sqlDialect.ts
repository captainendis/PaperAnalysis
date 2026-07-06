import type { DbKind } from '@shared/types'

/** Tanımlayıcıyı (tablo/sütun/şema) veritabanı türüne göre güvenli tırnaklar. */
export function quoteIdent(kind: DbKind, name: string): string {
  switch (kind) {
    case 'mssql':
      return `[${name.replace(/]/g, ']]')}]`
    case 'mysql':
      return '`' + name.replace(/`/g, '``') + '`'
    case 'postgres':
    case 'sqlite':
    default:
      return `"${name.replace(/"/g, '""')}"`
  }
}

/**
 * Bir tabloyu önizlemek için ilk 100 satırı çeken, veritabanı türüne uygun
 * SELECT üretir. MSSQL `TOP` kullanır; diğerleri `LIMIT`.
 */
export function previewSelect(kind: DbKind, schema: string | undefined, table: string): string {
  const qualified = schema
    ? `${quoteIdent(kind, schema)}.${quoteIdent(kind, table)}`
    : quoteIdent(kind, table)

  if (kind === 'mssql') {
    return `SELECT TOP 100 * FROM ${qualified}`
  }
  return `SELECT * FROM ${qualified} LIMIT 100`
}
