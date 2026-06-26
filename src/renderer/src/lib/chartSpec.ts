import type { Aggregation, ChartConfig, QueryResult } from '@shared/types'
import type { EChartsOption } from 'echarts'

/** Bir değeri sayıya çevirmeyi dener; başarısızsa null. */
function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function aggregate(values: number[], agg: Aggregation): number {
  if (values.length === 0) return 0
  switch (agg) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0)
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length
    case 'min':
      return Math.min(...values)
    case 'max':
      return Math.max(...values)
    case 'count':
      return values.length
    case 'none':
    default:
      return values[0]
  }
}

export interface AggregatedPoint {
  category: string
  value: number
}

/**
 * Sorgu sonucunu grafik yapılandırmasına göre (kategori, değer) çiftlerine
 * indirger. count agregasyonunda ölçü alanı olmadan da çalışır.
 */
export function aggregateRows(result: QueryResult, chart: ChartConfig): AggregatedPoint[] {
  const { dimension, measure, aggregation } = chart
  if (!dimension) return []

  const groups = new Map<string, number[]>()
  for (const row of result.rows) {
    const cat = String(row[dimension] ?? '∅')
    const arr = groups.get(cat) ?? []
    if (aggregation === 'count') {
      arr.push(1)
    } else if (measure) {
      const n = toNumber(row[measure])
      if (n !== null) arr.push(n)
    }
    groups.set(cat, arr)
  }

  return Array.from(groups.entries()).map(([category, values]) => ({
    category,
    value: aggregate(values, aggregation)
  }))
}

const PALETTE = [
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#f97316',
  '#14b8a6'
]

/** Grafik yapılandırması + sorgu sonucundan ECharts option üretir. */
export function buildEChartsOption(result: QueryResult, chart: ChartConfig): EChartsOption {
  const points = aggregateRows(result, chart)
  const title = chart.title?.trim() || undefined

  const baseTextStyle = { color: '#cbd5e1' }
  const common: EChartsOption = {
    title: title
      ? { text: title, left: 'center', textStyle: { color: '#e5e7eb', fontSize: 14 } }
      : undefined,
    tooltip: { trigger: chart.type === 'pie' ? 'item' : 'axis' },
    grid: { left: 48, right: 24, top: title ? 48 : 24, bottom: 56, containLabel: true },
    textStyle: baseTextStyle
  }

  if (chart.type === 'pie') {
    return {
      ...common,
      legend: { bottom: 0, textStyle: baseTextStyle, type: 'scroll' },
      color: PALETTE,
      series: [
        {
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['50%', '46%'],
          data: points.map((p) => ({ name: p.category, value: p.value })),
          label: { color: '#cbd5e1' }
        }
      ]
    }
  }

  return {
    ...common,
    xAxis: {
      type: 'category',
      data: points.map((p) => p.category),
      axisLabel: { color: '#94a3b8', rotate: points.length > 8 ? 35 : 0 },
      axisLine: { lineStyle: { color: '#475569' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#2a2c36' } }
    },
    color: PALETTE,
    series: [
      {
        type: chart.type,
        data: points.map((p) => p.value),
        smooth: chart.type === 'line',
        areaStyle: chart.type === 'line' ? { opacity: 0.08 } : undefined,
        itemStyle: { borderRadius: chart.type === 'bar' ? [4, 4, 0, 0] : 0 },
        barMaxWidth: 48
      }
    ]
  }
}
