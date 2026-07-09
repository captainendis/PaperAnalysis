import type { Aggregation, ChartConfig, QueryResult } from '@shared/types'
import type { EChartsOption } from 'echarts'
import { DEFAULT_CHART_THEME, type ChartTheme } from './chartTheme'

/** Bir değeri sayıya çevirmeyi dener; başarısızsa null. */
export function toNumber(v: unknown): number | null {
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

/** Yapılandırmadan etkin ölçü listesini çözer (çoklu seri öncelikli). */
export function resolveMeasures(chart: ChartConfig): string[] {
  if (chart.measures && chart.measures.length > 0) return chart.measures
  if (chart.measure) return [chart.measure]
  return []
}

export interface AggregatedPoint {
  category: string
  value: number
}

/**
 * Tekil ölçü için (kategori, değer) çiftleri. count agregasyonunda ölçü
 * gerekmez. KPI ve geriye dönük uyum için kullanılır.
 */
export function aggregateRows(result: QueryResult, chart: ChartConfig): AggregatedPoint[] {
  const { dimension, aggregation } = chart
  const measure = resolveMeasures(chart)[0] ?? null
  if (!dimension) return []

  const order: string[] = []
  const groups = new Map<string, number[]>()
  for (const row of result.rows) {
    const cat = String(row[dimension] ?? '∅')
    if (!groups.has(cat)) {
      groups.set(cat, [])
      order.push(cat)
    }
    const arr = groups.get(cat)!
    if (aggregation === 'count') {
      arr.push(1)
    } else if (measure) {
      const n = toNumber(row[measure])
      if (n !== null) arr.push(n)
    }
  }

  return order.map((category) => ({
    category,
    value: aggregate(groups.get(category)!, aggregation)
  }))
}

export interface MultiSeries {
  categories: string[]
  series: { name: string; data: number[] }[]
}

/** Çoklu ölçü için kategori bazında seri verisi üretir. */
export function aggregateMulti(result: QueryResult, chart: ChartConfig): MultiSeries {
  const { dimension, aggregation } = chart
  if (!dimension) return { categories: [], series: [] }
  const measures = resolveMeasures(chart)
  const isCount = aggregation === 'count'
  const seriesKeys = isCount ? ['__count__'] : measures
  const seriesNames = isCount ? ['Sayım'] : measures

  const categories: string[] = []
  // kategori -> seriKey -> değerler
  const groups = new Map<string, Record<string, number[]>>()
  for (const row of result.rows) {
    const cat = String(row[dimension] ?? '∅')
    if (!groups.has(cat)) {
      groups.set(cat, {})
      categories.push(cat)
    }
    const g = groups.get(cat)!
    if (isCount) {
      ;(g['__count__'] ??= []).push(1)
    } else {
      for (const m of measures) {
        const n = toNumber(row[m])
        if (n !== null) (g[m] ??= []).push(n)
      }
    }
  }

  const series = seriesKeys.map((key, i) => ({
    name: seriesNames[i],
    data: categories.map((c) => aggregate(groups.get(c)![key] ?? [], aggregation))
  }))
  return { categories, series }
}

/** KPI tek değer: tüm satırlar üzerinden ölçünün agregasyonu. */
export function computeKpi(result: QueryResult, chart: ChartConfig): number {
  if (chart.aggregation === 'count') return result.rowCount
  const measure = resolveMeasures(chart)[0]
  if (!measure) return result.rowCount
  const values: number[] = []
  for (const row of result.rows) {
    const n = toNumber(row[measure])
    if (n !== null) values.push(n)
  }
  return aggregate(values, chart.aggregation === 'none' ? 'sum' : chart.aggregation)
}

/**
 * Lejant yapılandırması. `pos` verilmezse otomatik: yalnızca çoklu seride (ya da
 * pastada) gösterilir. 'hidden' her zaman gizler.
 */
function buildLegend(
  pos: ChartConfig['legendPosition'],
  autoShow: boolean,
  hasTitle: boolean,
  theme: ChartTheme
): EChartsOption['legend'] {
  if (pos === 'hidden') return undefined
  const show = pos ? true : autoShow
  if (!show) return undefined
  const textStyle = { color: theme.text }
  if (pos === 'bottom') return { bottom: 0, textStyle, type: 'scroll' }
  return { top: hasTitle ? 26 : 4, textStyle, type: 'scroll' }
}

function axisCommon(
  title: string | undefined,
  multi: boolean,
  theme: ChartTheme
): EChartsOption {
  const textStyle = { color: theme.text }
  return {
    title: title
      ? { text: title, left: 'center', textStyle: { color: theme.text, fontSize: 14 } }
      : undefined,
    tooltip: { trigger: 'axis' },
    legend: multi ? { top: title ? 26 : 4, textStyle, type: 'scroll' } : undefined,
    grid: { left: 48, right: 24, top: title ? 56 : 36, bottom: 56, containLabel: true },
    color: theme.palette,
    textStyle
  }
}

/** Grafik yapılandırması + sorgu sonucundan ECharts option üretir. */
export function buildEChartsOption(
  result: QueryResult,
  chart: ChartConfig,
  theme: ChartTheme = DEFAULT_CHART_THEME
): EChartsOption {
  const title = chart.title?.trim() || undefined
  const textStyle = { color: theme.text }

  // Pasta: tekil ölçü.
  if (chart.type === 'pie') {
    const points = aggregateRows(result, chart)
    return {
      title: title
        ? { text: title, left: 'center', textStyle: { color: theme.text, fontSize: 14 } }
        : undefined,
      tooltip: { trigger: 'item' },
      // Pastada lejant varsayılan olarak altta; konum/gizleme seçilebilir.
      legend: buildLegend(chart.legendPosition ?? 'bottom', true, !!title, theme),
      color: theme.palette,
      textStyle,
      series: [
        {
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['50%', '46%'],
          data: points.map((p) => ({ name: p.category, value: p.value })),
          label: {
            color: theme.text,
            formatter: chart.showValues ? '{b}: {c} ({d}%)' : '{b}'
          }
        }
      ]
    }
  }

  // Saçılım: ham (xMeasure, measure) noktaları.
  if (chart.type === 'scatter') {
    const xKey = chart.xMeasure ?? null
    const yKey = resolveMeasures(chart)[0] ?? null
    const data: [number, number][] = []
    if (xKey && yKey) {
      for (const row of result.rows) {
        const x = toNumber(row[xKey])
        const y = toNumber(row[yKey])
        if (x !== null && y !== null) data.push([x, y])
      }
    }
    return {
      ...axisCommon(title, false, theme),
      legend: buildLegend(chart.legendPosition, false, !!title, theme),
      tooltip: { trigger: 'item' },
      xAxis: {
        type: 'value',
        name: xKey ?? '',
        axisLabel: { color: theme.axis },
        splitLine: { lineStyle: { color: theme.grid } }
      },
      yAxis: {
        type: 'value',
        name: chart.yAxisTitle?.trim() || yKey || '',
        nameTextStyle: { color: theme.text },
        axisLabel: { color: theme.axis },
        splitLine: { lineStyle: { color: theme.grid } }
      },
      series: [
        {
          type: 'scatter',
          data,
          symbolSize: 10,
          label: chart.showValues
            ? { show: true, position: 'top', color: theme.text, formatter: '{@[1]}' }
            : undefined
        }
      ]
    }
  }

  // Bar / line / area / stackedBar: çoklu seri.
  const { categories, series } = aggregateMulti(result, chart)
  const multi = series.length > 1
  const isStacked = chart.type === 'stackedBar'
  const isLineLike = chart.type === 'line' || chart.type === 'area'
  const echartsType: 'bar' | 'line' = isLineLike ? 'line' : 'bar'

  return {
    ...axisCommon(title, multi, theme),
    legend: buildLegend(chart.legendPosition, multi, !!title, theme),
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: theme.axis, rotate: categories.length > 8 ? 35 : 0 },
      axisLine: { lineStyle: { color: theme.axis } }
    },
    yAxis: {
      type: 'value',
      name: chart.yAxisTitle?.trim() || undefined,
      nameTextStyle: { color: theme.text },
      axisLabel: { color: theme.axis },
      splitLine: { lineStyle: { color: theme.grid } }
    },
    series: series.map((s) => ({
      name: s.name,
      type: echartsType,
      data: s.data,
      stack: isStacked ? 'total' : undefined,
      smooth: isLineLike,
      areaStyle: chart.type === 'area' ? { opacity: 0.15 } : undefined,
      itemStyle: { borderRadius: echartsType === 'bar' && !isStacked ? [4, 4, 0, 0] : 0 },
      barMaxWidth: 48,
      // Veri etiketleri: yığılmış grafikte içeride, diğerlerinde üstte.
      label: chart.showValues
        ? { show: true, position: isStacked ? 'inside' : 'top', color: theme.text }
        : undefined
    }))
  }
}
