/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { useMemo, forwardRef } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ChartConfig, QueryResult } from '@shared/types'
import { buildEChartsOption, computeKpi, resolveMeasures } from '../../lib/chartSpec'
import { chartTheme } from '../../lib/chartTheme'
import { groupResult } from '../../lib/tableView'
import { useSettings } from '../../store/settings'
import { useDashboard } from '../../store/dashboard'
import { ResultsTable } from '../QueryEditor/ResultsTable'

interface Props {
  result: QueryResult | null
  chart: ChartConfig
  /** Bir kategoriye (bar/çizgi/pasta) tıklanınca çağrılır (çapraz filtre). */
  onCategoryClick?: (value: string) => void
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n)
}

const empty = (msg: string) => (
  <div className="flex h-full items-center justify-center px-3 text-center text-sm text-gray-500">
    {msg}
  </div>
)

/**
 * Sorgu sonucu + grafik yapılandırmasından görseli çizer. ECharts türleri için
 * grafik, KPI/tablo türleri için özel render kullanır. ref yalnızca ECharts
 * türlerinde PNG dışa aktarımı için doludur.
 */
export const ChartView = forwardRef<ReactECharts, Props>(function ChartView(
  { result, chart, onCategoryClick },
  ref
) {
  const globalTheme = useSettings((s) => s.theme)
  const globalPalette = useSettings((s) => s.palette)
  const dashTheme = useDashboard((s) => s.dashboard.theme)
  const dashPalette = useDashboard((s) => s.dashboard.palette)
  // Öncelik: grafiğe özel > panoya özel > genel ayar.
  const themeMode = chart.theme ?? dashTheme ?? globalTheme
  const paletteName = chart.palette ?? dashPalette ?? globalPalette

  const option = useMemo(() => {
    if (!result || chart.type === 'kpi' || chart.type === 'table') return null
    return buildEChartsOption(result, chart, chartTheme(themeMode, paletteName))
  }, [result, chart, themeMode, paletteName])

  if (!result) return empty('Önce sorgu çalıştırın.')

  // Grafiğe özel tema seçiliyse kartın arka planını da o temaya uydur (aksi halde
  // kartın kendi/pano arka planı kullanılır).
  const cardBg = chart.theme
    ? chart.theme === 'light'
      ? '#ffffff'
      : '#14140f'
    : undefined

  // KPI kartı. Metin renkleri geçerli temaya (grafik > pano > genel) göre.
  if (chart.type === 'kpi') {
    const value = computeKpi(result, chart)
    const dark = themeMode === 'dark'
    return (
      <div
        className="flex h-full flex-col items-center justify-center"
        style={cardBg ? { background: cardBg } : undefined}
      >
        <span className="text-4xl font-bold" style={{ color: dark ? '#f3f3f0' : '#1c1c1a' }}>
          {formatNumber(value)}
        </span>
        <span className="mt-1 text-sm" style={{ color: dark ? '#9ca3af' : '#6b7280' }}>
          {chart.title || resolveMeasures(chart)[0] || 'Sayım'}
        </span>
      </div>
    )
  }

  // Tablo görseli. groupBy ayarlıysa tekrarlayan değerler birleştirilir.
  if (chart.type === 'table') {
    const gb = chart.tableConfig?.groupBy
    const grouped = gb && chart.tableConfig?.groupEnabled !== false
    const groupKeys = gb ? [gb, ...(chart.tableConfig?.groupByExtra ?? [])] : []
    const tableResult = grouped
      ? groupResult(
          result,
          groupKeys,
          chart.tableConfig?.groupSum !== false,
          chart.tableConfig?.groupSumExclude,
          chart.tableConfig?.groupConcat
        )
      : result
    return <ResultsTable result={tableResult} title={chart.title} config={chart.tableConfig} />
  }

  if (!chart.dimension) return empty('Kategori (X) alanı seçin.')
  if (chart.type === 'scatter' && !chart.xMeasure) return empty('Saçılım için sayısal X alanı seçin.')

  // Çapraz filtre: tıklanan kategorinin adını yakala (bar/çizgi/pasta).
  const onEvents =
    onCategoryClick && chart.type !== 'scatter'
      ? {
          click: (params: { name?: string }) => {
            if (params?.name != null) onCategoryClick(String(params.name))
          }
        }
      : undefined

  return (
    <div className="h-full w-full" style={cardBg ? { background: cardBg } : undefined}>
      <ReactECharts
        ref={ref}
        option={option!}
        style={{ height: '100%', width: '100%' }}
        notMerge
        lazyUpdate
        opts={{ renderer: 'canvas' }}
        onEvents={onEvents}
      />
    </div>
  )
})
