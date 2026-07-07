// Tablo hücreleri için saf biçimlendirme ve koşullu renklendirme yardımcıları.
import type { ColumnFormat, ConditionalRule } from '@shared/types'
import { cellToText, toFiniteNumber } from './tableView'

/** Değeri belirtilen sütun biçimine göre metne çevirir (gösterim için). */
export function formatValue(v: unknown, format?: ColumnFormat): string {
  if (!format || format.kind === 'auto') return cellToText(v)
  if (v === null || v === undefined || v === '') return ''

  switch (format.kind) {
    case 'number': {
      const n = toFiniteNumber(v)
      if (n === null) return cellToText(v)
      return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: format.decimals ?? 0,
        maximumFractionDigits: format.decimals ?? 0,
        useGrouping: format.thousands !== false
      }).format(n)
    }
    case 'currency': {
      const n = toFiniteNumber(v)
      if (n === null) return cellToText(v)
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: format.currency || 'TRY',
        minimumFractionDigits: format.decimals ?? 2,
        maximumFractionDigits: format.decimals ?? 2
      }).format(n)
    }
    case 'percent': {
      const n = toFiniteNumber(v)
      if (n === null) return cellToText(v)
      // Değeri olduğu gibi biçimle ve % ekle (100 ile çarpmaz — öngörülebilir).
      const s = new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: format.decimals ?? 0,
        maximumFractionDigits: format.decimals ?? 0
      }).format(n)
      return `%${s}`
    }
    case 'date': {
      const d = toDate(v)
      if (!d) return cellToText(v)
      return d.toLocaleDateString('tr-TR')
    }
    default:
      return cellToText(v)
  }
}

/** Değeri güvenli biçimde Date'e çevirir (geçersizse null). */
function toDate(v: unknown): Date | null {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  if (typeof v === 'number') {
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof v === 'string' && v.trim() !== '') {
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

/** Bir koşullu kuralın hücre değeriyle eşleşip eşleşmediğini belirler. */
export function matchesRule(v: unknown, rule: ConditionalRule): boolean {
  if (rule.op === 'contains') {
    return cellToText(v).toLowerCase().includes(rule.value.trim().toLowerCase())
  }
  const cell = toFiniteNumber(v)
  const target = toFiniteNumber(rule.value)
  // Sayısal karşılaştırma (iki taraf da sayıysa); değilse metin eşitliği.
  if (cell !== null && target !== null) {
    switch (rule.op) {
      case '>':
        return cell > target
      case '<':
        return cell < target
      case '>=':
        return cell >= target
      case '<=':
        return cell <= target
      case '=':
        return cell === target
      case '<>':
        return cell !== target
    }
  }
  const cs = cellToText(v)
  const ts = rule.value
  if (rule.op === '=') return cs === ts
  if (rule.op === '<>') return cs !== ts
  return false
}

/** Bir sütuna ait kurallardan ilk eşleşenin stilini döndürür (yoksa undefined). */
export function cellStyle(
  v: unknown,
  rules: ConditionalRule[]
): { color?: string; backgroundColor?: string } | undefined {
  for (const r of rules) {
    if (matchesRule(v, r)) {
      return r.mode === 'bg' ? { backgroundColor: r.color } : { color: r.color }
    }
  }
  return undefined
}

/** Kuralları sütun adına göre gruplar. */
export function rulesByColumn(rules?: ConditionalRule[]): Record<string, ConditionalRule[]> {
  const map: Record<string, ConditionalRule[]> = {}
  for (const r of rules ?? []) {
    if (!map[r.column]) map[r.column] = []
    map[r.column].push(r)
  }
  return map
}
