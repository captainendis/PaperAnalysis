/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
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
 * Bir ya da birden çok sütundaki tekrarlayan (aynı) değerlere sahip satırları tek
 * satırda birleştirir. `groupBy` bir dizi ise **bileşik (koşullu) gruplama** yapılır:
 * yalnızca tüm anahtar sütunları aynı olan satırlar birleşir (ör. kod + birim aynı).
 * `sum` true ise sayısal sütunlar toplanır; false ise toplanmaz (ilk değer korunur).
 * `excludeSum` içindeki sütunlar sayısal olsa bile toplama dışı tutulur (ilk değer
 * korunur) — ör. birim fiyat, yükseklik gibi toplanması anlamsız sütunlar.
 * `concat` içindeki sütunlar için grup içindeki **farklı** değerler ", " ile
 * listelenir (ör. barkod → "barkod1, barkod2"). Diğer (metin) sütunlarda daima ilk
 * değer korunur; kaç satırın birleştiğini gösteren bir "Adet" sütunu eklenir.
 * Hiçbir geçerli grup sütunu yoksa sonuç değişmeden döner.
 */
export function groupResult(
  result: QueryResult,
  groupBy: string | string[],
  sum = true,
  excludeSum: string[] = [],
  concat: string[] = []
): QueryResult {
  const names = result.columns.map((c) => c.name)
  const keys = (Array.isArray(groupBy) ? groupBy : [groupBy]).filter(
    (k) => k && names.includes(k)
  )
  if (keys.length === 0) return result

  const keySet = new Set(keys)
  const excluded = new Set(excludeSum)
  // Listeleme (concat) sütunları: anahtarlar hariç, sonuçta var olan sütunlar.
  const concatSet = new Set(concat.filter((c) => !keySet.has(c) && names.includes(c)))
  const sample = result.rows.slice(0, 200)
  const numeric = sum
    ? new Set(
        names.filter(
          (n) =>
            !keySet.has(n) && !excluded.has(n) && !concatSet.has(n) && isNumericColumn(sample, n)
        )
      )
    : new Set<string>()
  const countName = names.includes('Adet') ? '__adet' : 'Adet'

  const groups = new Map<string, Record<string, unknown>>()
  // Concat sütunları için grup başına, sırayı koruyan benzersiz değer kümesi.
  const concatAcc = new Map<string, Record<string, Set<string>>>()
  const order: string[] = []
  const addConcat = (key: string, row: Record<string, unknown>) => {
    if (concatSet.size === 0) return
    let acc = concatAcc.get(key)
    if (!acc) {
      acc = {}
      for (const n of concatSet) acc[n] = new Set<string>()
      concatAcc.set(key, acc)
    }
    for (const n of concatSet) {
      const t = cellToText(row[n]).trim()
      if (t !== '') acc[n].add(t)
    }
  }
  for (const row of result.rows) {
    // Bileşik anahtar: her anahtar sütunun metni NUL ile ayrılır (çakışmayı önler).
    const key = keys.map((k) => cellToText(row[k])).join('\u0000')
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
    addConcat(key, row)
  }

  // Concat sütunlarını grup başına ", " ile listeye çevir.
  if (concatSet.size > 0) {
    for (const key of order) {
      const g = groups.get(key)!
      const acc = concatAcc.get(key)
      if (acc) for (const n of concatSet) g[n] = [...acc[n]].join(', ')
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
