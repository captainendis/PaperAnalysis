import { useMemo, forwardRef } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ChartConfig, QueryResult } from '@shared/types'
import { buildEChartsOption } from '../../lib/chartSpec'

interface Props {
  result: QueryResult | null
  chart: ChartConfig
}

/**
 * Sorgu sonucu + grafik yapılandırmasından ECharts grafiği çizer.
 * ref, PNG dışa aktarımı için ECharts örneğine erişim sağlar.
 */
export const ChartView = forwardRef<ReactECharts, Props>(function ChartView(
  { result, chart },
  ref
) {
  const option = useMemo(() => {
    if (!result) return null
    return buildEChartsOption(result, chart)
  }, [result, chart])

  if (!result) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Önce sorgu çalıştırın.
      </div>
    )
  }
  if (!chart.dimension) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Kategori (X) alanı seçin.
      </div>
    )
  }

  return (
    <ReactECharts
      ref={ref}
      option={option!}
      style={{ height: '100%', width: '100%' }}
      notMerge
      lazyUpdate
      opts={{ renderer: 'canvas' }}
    />
  )
})
