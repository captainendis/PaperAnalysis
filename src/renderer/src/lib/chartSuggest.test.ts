/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { describe, it, expect } from 'vitest'
import { classifyColumns, suggestChart } from './chartSuggest'
import type { QueryResult } from '@shared/types'

const salesByCategory: QueryResult = {
  columns: [{ name: 'kategori' }, { name: 'ciro' }],
  rows: [
    { kategori: 'Elektronik', ciro: 1000 },
    { kategori: 'Giyim', ciro: 500 }
  ],
  rowCount: 2,
  elapsedMs: 1
}

const trend: QueryResult = {
  columns: [{ name: 'ay' }, { name: 'ciro' }],
  rows: [
    { ay: '2025-01', ciro: 100 },
    { ay: '2025-02', ciro: 200 }
  ],
  rowCount: 2,
  elapsedMs: 1
}

describe('classifyColumns', () => {
  it('sayısal ve metin sütunları ayırır', () => {
    const cols = classifyColumns(salesByCategory)
    expect(cols).toEqual([
      { name: 'kategori', kind: 'text' },
      { name: 'ciro', kind: 'number' }
    ])
  })

  it('tarih benzeri sütunu algılar', () => {
    const cols = classifyColumns(trend)
    expect(cols.find((c) => c.name === 'ay')?.kind).toBe('date')
  })
})

describe('suggestChart', () => {
  it('kategori → bar; X=metin, Y=sayısal, sum', () => {
    expect(suggestChart(salesByCategory)).toMatchObject({
      type: 'bar',
      dimension: 'kategori',
      measure: 'ciro',
      measures: ['ciro'],
      aggregation: 'sum'
    })
  })

  it('tarih boyutu → çizgi grafik', () => {
    expect(suggestChart(trend)).toMatchObject({ type: 'line', dimension: 'ay', measure: 'ciro' })
  })

  it('sayısal ölçü yoksa count kullanır', () => {
    const onlyText: QueryResult = {
      columns: [{ name: 'sehir' }],
      rows: [{ sehir: 'Ankara' }, { sehir: 'İzmir' }],
      rowCount: 2,
      elapsedMs: 1
    }
    expect(suggestChart(onlyText)).toMatchObject({
      dimension: 'sehir',
      measure: null,
      aggregation: 'count'
    })
  })
})
