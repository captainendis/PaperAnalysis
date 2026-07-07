import { useMemo, forwardRef } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ChartConfig, QueryResult } from '@shared/types'
import { buildEChartsOption, computeKpi, resolveMeasures } from '../../lib/chartSpec'
import { chartTheme } from '../../lib/chartTheme'
import { useSettings } from '../../store/settings'
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
  const themeMode = useSettings((s) => s.theme)
  const paletteName = useSettings((s) => s.palette)

  const option = useMemo(() => {
    if (!result || chart.type === 'kpi' || chart.type === 'table') return null
    return buildEChartsOption(result, chart, chartTheme(themeMode, paletteName))
  }, [result, chart, themeMode, paletteName])

  if (!result) return empty('Önce sorgu çalıştırın.')

  // KPI kartı.
  if (chart.type === 'kpi') {
    const value = computeKpi(result, chart)
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gray-100">{formatNumber(value)}</span>
        <span className="mt-1 text-sm text-gray-400">
          {chart.title || resolveMeasures(chart)[0] || 'Sayım'}
        </span>
      </div>
    )
  }

  // Tablo görseli.
  if (chart.type === 'table') {
    return <ResultsTable result={result} title={chart.title} />
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
    <ReactECharts
      ref={ref}
      option={option!}
      style={{ height: '100%', width: '100%' }}
      notMerge
      lazyUpdate
      opts={{ renderer: 'canvas' }}
      onEvents={onEvents}
    />
  )
})
