import { describe, it, expect } from 'vitest'
import { aggregateRows, aggregateMulti, computeKpi, buildEChartsOption } from './chartSpec'
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

  it('yığılmış bar için series stack=total alır', () => {
    const option = buildEChartsOption(result, {
      type: 'stackedBar',
      dimension: 'kategori',
      measure: 'tutar',
      measures: ['tutar'],
      aggregation: 'sum'
    }) as { series: { stack?: string; type: string }[] }
    expect(option.series[0].type).toBe('bar')
    expect(option.series[0].stack).toBe('total')
  })

  it('verilen tema paletini option.color olarak kullanır', () => {
    const theme = { text: '#000', axis: '#111', grid: '#222', palette: ['#abcabc', '#defdef'] }
    const option = buildEChartsOption(
      result,
      { type: 'bar', dimension: 'kategori', measure: 'tutar', aggregation: 'sum' },
      theme
    ) as { color: string[] }
    expect(option.color).toEqual(['#abcabc', '#defdef'])
  })

  it('saçılım için scatter series ve value eksenleri üretir', () => {
    const option = buildEChartsOption(result, {
      type: 'scatter',
      dimension: null,
      measure: 'tutar',
      xMeasure: 'tutar',
      aggregation: 'none'
    }) as { series: { type: string; data: number[][] }[]; xAxis: { type: string } }
    expect(option.series[0].type).toBe('scatter')
    expect(option.xAxis.type).toBe('value')
    expect(option.series[0].data.length).toBe(4)
  })

  it('showValues → series label görünür', () => {
    const option = buildEChartsOption(result, {
      type: 'bar',
      dimension: 'kategori',
      measure: 'tutar',
      aggregation: 'sum',
      showValues: true
    }) as { series: { label?: { show?: boolean; position?: string } }[] }
    expect(option.series[0].label?.show).toBe(true)
    expect(option.series[0].label?.position).toBe('top')
  })

  it('showValues kapalıyken label yok', () => {
    const option = buildEChartsOption(result, {
      type: 'bar',
      dimension: 'kategori',
      measure: 'tutar',
      aggregation: 'sum'
    }) as { series: { label?: unknown }[] }
    expect(option.series[0].label).toBeUndefined()
  })

  it('legendPosition=hidden → lejant gizlenir (çoklu seride bile)', () => {
    const option = buildEChartsOption(result, {
      type: 'bar',
      dimension: 'kategori',
      measures: ['tutar', 'tutar'],
      measure: null,
      aggregation: 'sum',
      legendPosition: 'hidden'
    }) as { legend?: unknown }
    expect(option.legend).toBeUndefined()
  })

  it('legendPosition=bottom → lejant altta konumlanır', () => {
    const option = buildEChartsOption(result, {
      type: 'bar',
      dimension: 'kategori',
      measure: 'tutar',
      aggregation: 'sum',
      legendPosition: 'bottom'
    }) as { legend?: { bottom?: number } }
    expect(option.legend?.bottom).toBe(0)
  })

  it('yAxisTitle → y ekseni adı ayarlanır', () => {
    const option = buildEChartsOption(result, {
      type: 'line',
      dimension: 'kategori',
      measure: 'tutar',
      aggregation: 'sum',
      yAxisTitle: 'Tutar (₺)'
    }) as { yAxis: { name?: string } }
    expect(option.yAxis.name).toBe('Tutar (₺)')
  })

  it('pasta showValues → etiket yüzde biçimlendirir', () => {
    const option = buildEChartsOption(result, {
      type: 'pie',
      dimension: 'kategori',
      measure: 'tutar',
      aggregation: 'sum',
      showValues: true
    }) as { series: { label?: { formatter?: string } }[] }
    expect(option.series[0].label?.formatter).toContain('%')
  })
})

describe('aggregateMulti', () => {
  const multiResult: QueryResult = {
    columns: [{ name: 'ay' }, { name: 'gelir' }, { name: 'gider' }],
    rows: [
      { ay: 'Oca', gelir: 100, gider: 60 },
      { ay: 'Şub', gelir: 200, gider: 90 }
    ],
    rowCount: 2,
    elapsedMs: 1
  }

  it('çoklu ölçü için ayrı seriler üretir', () => {
    const ms = aggregateMulti(multiResult, {
      type: 'line',
      dimension: 'ay',
      measure: null,
      measures: ['gelir', 'gider'],
      aggregation: 'sum'
    })
    expect(ms.categories).toEqual(['Oca', 'Şub'])
    expect(ms.series.map((s) => s.name)).toEqual(['gelir', 'gider'])
    expect(ms.series[0].data).toEqual([100, 200])
    expect(ms.series[1].data).toEqual([60, 90])
  })
})

describe('computeKpi', () => {
  it('ölçünün toplamını döndürür', () => {
    const value = computeKpi(result, {
      type: 'kpi',
      dimension: null,
      measure: 'tutar',
      aggregation: 'sum'
    })
    expect(value).toBe(38) // 10+5+20+3
  })

  it('count agregasyonunda satır sayısını döndürür', () => {
    const value = computeKpi(result, {
      type: 'kpi',
      dimension: null,
      measure: null,
      aggregation: 'count'
    })
    expect(value).toBe(4)
  })
})
