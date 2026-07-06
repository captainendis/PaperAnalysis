import type { QueryResult } from '@shared/types'

export interface DrillResult {
  /** O anki drill seviyesinin etkin boyutu (grafik X ekseni). */
  dimension: string | null
  /** Üst seviye seçimlerine göre süzülmüş sonuç. */
  result: QueryResult
}

/**
 * Drill-down uygular: `path` üst seviyelerde seçilen değerlerdir. Satırlar bu
 * değerlere göre süzülür ve etkin boyut `drillLevels[path.length]` olur.
 * Yeni sorgu gerekmez — istemci tarafında yeniden agregeleme için kullanılır.
 */
export function applyDrill(
  result: QueryResult,
  drillLevels: string[] | undefined,
  path: string[]
): DrillResult {
  if (!drillLevels || drillLevels.length === 0) {
    return { dimension: null, result }
  }

  // Geçerli path uzunluğu, en fazla son seviyeye kadar.
  const depth = Math.min(path.length, drillLevels.length - 1)

  const rows = result.rows.filter((r) =>
    path
      .slice(0, depth)
      .every((val, i) => String(r[drillLevels[i]] ?? '') === val)
  )

  return {
    dimension: drillLevels[depth] ?? null,
    result: { ...result, rows, rowCount: rows.length }
  }
}

/** Path'e göre breadcrumb etiketleri üretir ("Tümü" kökü ile). */
export function drillBreadcrumbs(path: string[]): string[] {
  return ['Tümü', ...path]
}
