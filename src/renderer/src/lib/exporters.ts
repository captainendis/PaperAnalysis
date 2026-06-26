import * as XLSX from 'xlsx'
import type { QueryResult } from '@shared/types'

function cell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** CSV alanı kaçışı: tırnak, virgül veya yeni satır içeriyorsa tırnakla. */
function csvField(value: unknown): string {
  const s = cell(value)
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

/** Sorgu sonucunu CSV metnine dönüştürür (UTF-8). */
export function toCsv(result: QueryResult): string {
  const headers = result.columns.map((c) => c.name)
  const lines = [headers.map(csvField).join(',')]
  for (const row of result.rows) {
    lines.push(headers.map((h) => csvField(row[h])).join(','))
  }
  return lines.join('\r\n')
}

/** Sorgu sonucundan .xlsx çalışma kitabı üretip base64 döndürür. */
export function toXlsxBase64(result: QueryResult): string {
  const headers = result.columns.map((c) => c.name)
  const aoa: unknown[][] = [headers]
  for (const row of result.rows) {
    aoa.push(headers.map((h) => row[h] ?? null))
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sonuç')
  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' }) as string
}
