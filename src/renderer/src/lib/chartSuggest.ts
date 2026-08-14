/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import type { ChartConfig, QueryResult } from '@shared/types'
import { toNumber } from './chartSpec'

export type ColKind = 'number' | 'date' | 'text'

const DATE_NAME = /(tarih|date|zaman|time|ay|yıl|yil|gün|gun|hafta|month|year|day)/i
const DATE_VALUE = /^\d{4}[-/]\d{1,2}([-/]\d{1,2})?([ T]\d{2}:\d{2})?/

/** Bir sütunun baskın türünü örnek satırlardan belirler. */
export function classifyColumn(result: QueryResult, name: string): ColKind {
  const sample = result.rows.slice(0, 50).map((r) => r[name]).filter((v) => v != null && v !== '')
  if (sample.length === 0) return 'text'

  let numeric = 0
  let dateish = 0
  for (const v of sample) {
    if (toNumber(v) !== null) numeric++
    if (typeof v === 'string' && DATE_VALUE.test(v)) dateish++
  }
  // Sayısal ama tarih adı taşıyan sütunları (ör. 2025) tarih saymayalım.
  if (numeric / sample.length >= 0.8) return 'number'
  if (dateish / sample.length >= 0.6 || DATE_NAME.test(name)) return 'date'
  return 'text'
}

export interface ColumnMeta {
  name: string
  kind: ColKind
}

export function classifyColumns(result: QueryResult): ColumnMeta[] {
  return result.columns.map((c) => ({ name: c.name, kind: classifyColumn(result, c.name) }))
}

/**
 * Sorgu sonucundan makul bir grafik yapılandırması önerir:
 * X = tarih (varsa) ya da ilk metin sütunu; Y = ilk sayısal sütun;
 * tür = tarih için çizgi, aksi halde sütun. Sayısal ölçü yoksa sayım (count).
 */
export function suggestChart(result: QueryResult): Partial<ChartConfig> {
  const cols = classifyColumns(result)
  if (cols.length === 0) return {}

  const dateCol = cols.find((c) => c.kind === 'date')
  const textCol = cols.find((c) => c.kind === 'text')
  const numCols = cols.filter((c) => c.kind === 'number')

  const dimension = (dateCol ?? textCol ?? cols[0]).name
  const measure = numCols.find((c) => c.name !== dimension)?.name ?? null

  return {
    type: dateCol ? 'line' : 'bar',
    dimension,
    measure,
    measures: measure ? [measure] : [],
    aggregation: measure ? 'sum' : 'count'
  }
}
