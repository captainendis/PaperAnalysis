// Tablo görünümü (ResultsTable) için saf sıralama/filtreleme yardımcıları.
// UI'dan bağımsız oldukları için birim test edilebilirler.

import type { QueryResult } from '@shared/types'

/**
 * Görünürdeki sütunlar ve (filtrelenmiş/sıralanmış) satırlardan dışa aktarılabilir
 * bir QueryResult üretir. Excel/CSV dışa aktarımının ekrandaki görünümü yansıtması için.
 */
export function buildViewResult(
  columnNames: string[],
  rows: Record<string, unknown>[]
): QueryResult {
  return {
    columns: columnNames.map((name) => ({ name })),
    rows,
    rowCount: rows.length,
    elapsedMs: 0
  }
}

/** Hücre değerini görüntülemeyle tutarlı bir metne çevirir. */
export function cellToText(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

/** Değeri sonlu bir sayıya çözer; olmuyorsa null. */
function toFiniteNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

/**
 * Büyük/küçük harf duyarsız "içeren" filtresi. Boş sorgu tüm satırları geçirir.
 */
export function includesFilter(v: unknown, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (q === '') return true
  return cellToText(v).toLowerCase().includes(q)
}

/**
 * Sayı-duyarlı hücre karşılaştırması. İkisi de sayıya çözülürse sayısal,
 * aksi halde yerel dize karşılaştırması. null/undefined en sona sıralanır.
 */
export function compareCells(a: unknown, b: unknown): number {
  const aEmpty = a === null || a === undefined
  const bEmpty = b === null || b === undefined
  if (aEmpty && bEmpty) return 0
  if (aEmpty) return 1
  if (bEmpty) return -1

  const na = toFiniteNumber(a)
  const nb = toFiniteNumber(b)
  if (na !== null && nb !== null) return na - nb

  return cellToText(a).localeCompare(cellToText(b), 'tr', { numeric: true })
}
