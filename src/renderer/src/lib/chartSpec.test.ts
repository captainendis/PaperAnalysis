import { describe, it, expect } from 'vitest'
import { aggregateRows, buildEChartsOption } from './chartSpec'
import type { ChartConfig, QueryResult } from '@shared/types'

const result: QueryResult = {
  columns: [{ name: 'kategori' }, { name: 'tutar' }],
  rows: [
    { kategori: 'A', tutar: 10 },
    { kategori: 'A', tutar: 5 },
    { kategori: 'B', tutar: 20 },
    { kategori: 'C', tutar: '3' }
  ],
  rowCount: 4,
  elapsedMs: 1
}

describe('aggregateRows', () => {
  it('toplama (sum) ile kategori bazında gruplar', () => {
    const chart: ChartConfig = {
      type: 'bar',
      dimension: 'kategori',
      measure: 'tutar',
      aggregation: 'sum'
    }
    const points = aggregateRows(result, chart)
    expect(points).toEqual([
      { category: 'A', value: 15 },
      { category: 'B', value: 20 },
      { category: 'C', value: 3 }
    ])
  })

  it('ortalama (avg) hesaplar', () => {
    const points = aggregateRows(result, {
      type: 'bar',
      dimension: 'kategori',
      measure: 'tutar',
      aggregation: 'avg'
    })
    expect(points.find((p) => p.category === 'A')?.value).toBe(7.5)
  })

  it('count agregasyonu ölçü gerektirmez', () => {
    const points = aggregateRows(result, {
      type: 'bar',
      dimension: 'kategori',
      measure: null,
      aggregation: 'count'
    })
    expect(points).toEqual([
      { category: 'A', value: 2 },
      { category: 'B', value: 1 },
      { category: 'C', value: 1 }
    ])
  })

  it('boyut yoksa boş döner', () => {
    const points = aggregateRows(result, {
      type: 'bar',
      dimension: null,
      measure: 'tutar',
      aggregation: 'sum'
    })
    expect(points).toEqual([])
  })
})

describe('buildEChartsOption', () => {
  it('pasta grafiği için series tipi pie üretir', () => {
    const option = buildEChartsOption(result, {
      type: 'pie',
      dimension: 'kategori',
      measure: 'tutar',
      aggregation: 'sum'
    }) as { series: { type: string }[] }
    expect(option.series[0].type).toBe('pie')
  })

  it('bar grafiği için kategori ekseni doldurur', () => {
    const option = buildEChartsOption(result, {
      type: 'bar',
      dimension: 'kategori',
      measure: 'tutar',
      aggregation: 'sum'
    }) as { xAxis: { data: string[] } }
    expect(option.xAxis.data).toEqual(['A', 'B', 'C'])
  })
})
