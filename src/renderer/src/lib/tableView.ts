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

/** Değeri sonlu bir sayıya çözer; olmuyorsa null. Ondalıkta virgül de kabul eder. */
export function toFiniteNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v.trim().replace(',', '.'))
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

/** Sayısal filtre operatörü ifadesini ayrıştırır (ör. ">100", "<=0", "=5"). */
const NUMERIC_FILTER = /^(>=|<=|<>|!=|=|>|<)\s*(-?\d+(?:[.,]\d+)?)$/

/**
 * Hücre filtresi: sorgu bir operatör ifadesiyse (>, <, >=, <=, =, <>) sayısal
 * karşılaştırma yapar; aksi halde büyük/küçük harf duyarsız "içeren" eşleşmesi.
 * Sayısal karşılaştırmada hücre sayıya çözülemezse satır elenir.
 * Örn: "stok" sütununda ">0" → stokta olanlar; "=0" → stokta olmayanlar.
 */
export function matchesFilter(v: unknown, query: string): boolean {
  const q = query.trim()
  if (q === '') return true

  const m = NUMERIC_FILTER.exec(q)
  if (!m) return includesFilter(v, q)

  const cell = toFiniteNumber(v)
  if (cell === null) return false
  const target = Number(m[2].replace(',', '.'))
  switch (m[1]) {
    case '>':
      return cell > target
    case '<':
      return cell < target
    case '>=':
      return cell >= target
    case '<=':
      return cell <= target
    case '<>':
    case '!=':
      return cell !== target
    case '=':
    default:
      return cell === target
  }
}

/** Sonlu sayısal değerlerin toplamı (sayı olmayanlar yok sayılır). */
export function sumValues(values: unknown[]): number {
  let total = 0
  for (const v of values) {
    const n = toFiniteNumber(v)
    if (n !== null) total += n
  }
  return total
}

/**
 * Bir sütunun sayısal olup olmadığını belirler: en az bir sayısal değer içerir ve
 * boş olmayan tüm değerleri sayıya çözülür.
 */
export function isNumericColumn(rows: Record<string, unknown>[], name: string): boolean {
  let sawNumber = false
  for (const row of rows) {
    const v = row[name]
    if (v === null || v === undefined || v === '') continue
    if (toFiniteNumber(v) === null) return false
    sawNumber = true
  }
  return sawNumber
}

/**
 * Bir sütundaki tekrarlayan (aynı) değerlere sahip satırları tek satırda birleştirir.
 * Sayısal sütunlar toplanır; diğer (metin) sütunlarda ilk değer korunur; kaç satırın
 * birleştiğini gösteren bir "Adet" sütunu eklenir. Grup sütunu bulunamazsa sonuç
 * değişmeden döner.
 */
export function groupResult(result: QueryResult, groupBy: string): QueryResult {
  const names = result.columns.map((c) => c.name)
  if (!groupBy || !names.includes(groupBy)) return result

  const sample = result.rows.slice(0, 200)
  const numeric = new Set(names.filter((n) => n !== groupBy && isNumericColumn(sample, n)))
  const countName = names.includes('Adet') ? '__adet' : 'Adet'

  const groups = new Map<string, Record<string, unknown>>()
  const order: string[] = []
  for (const row of result.rows) {
    const key = cellToText(row[groupBy])
    const g = groups.get(key)
    if (!g) {
      const seed: Record<string, unknown> = {}
      for (const n of names) seed[n] = numeric.has(n) ? (toFiniteNumber(row[n]) ?? 0) : row[n]
      seed[countName] = 1
      groups.set(key, seed)
      order.push(key)
    } else {
      for (const n of numeric) g[n] = (toFiniteNumber(g[n]) ?? 0) + (toFiniteNumber(row[n]) ?? 0)
      g[countName] = (g[countName] as number) + 1
    }
  }

  const columns = [...names.map((name) => ({ name })), { name: countName }]
  const rows = order.map((k) => groups.get(k)!)
  return { columns, rows, rowCount: rows.length, elapsedMs: result.elapsedMs }
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
