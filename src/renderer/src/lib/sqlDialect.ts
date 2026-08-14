/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
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
 * Bir tabloyu önizlemek için veritabanı türüne uygun SELECT üretir.
 * `limit` verilmezse (0/undefined) satır sınırı eklenmez (tüm veri).
 * MSSQL `TOP` kullanır; diğerleri `LIMIT`.
 */
export function previewSelect(
  kind: DbKind,
  schema: string | undefined,
  table: string,
  limit?: number
): string {
  const qualified = schema
    ? `${quoteIdent(kind, schema)}.${quoteIdent(kind, table)}`
    : quoteIdent(kind, table)

  if (!limit || limit <= 0) {
    return `SELECT * FROM ${qualified}`
  }
  if (kind === 'mssql') {
    return `SELECT TOP ${limit} * FROM ${qualified}`
  }
  return `SELECT * FROM ${qualified} LIMIT ${limit}`
}
