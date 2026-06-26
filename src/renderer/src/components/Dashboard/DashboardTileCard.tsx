import { useEffect, useRef, useState } from 'react'
import type ReactECharts from 'echarts-for-react'
import type { DashboardTile, QueryResult } from '@shared/types'
import { ChartView } from '../ChartBuilder/ChartView'

interface Props {
  tile: DashboardTile
  onEdit: () => void
  onRemove: () => void
}

/** Pano üzerindeki tek bir grafik kartı; kendi sorgusunu çalıştırır. */
export function DashboardTileCard({ tile, onEdit, onRemove }: Props) {
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const chartRef = useRef<ReactECharts>(null)

  async function load() {
    if (!tile.connectionId || !tile.sql.trim()) return
    setLoading(true)
    setError(null)
    const res = await window.api.query.run(tile.connectionId, tile.sql)
    setLoading(false)
    if (res.ok) setResult(res.data)
    else setError(res.error)
  }

  // Sorgu, bağlantı değiştiğinde yeniden çalıştır.
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tile.sql, tile.connectionId])

  async function exportPng() {
    const inst = chartRef.current?.getEchartsInstance()
    if (!inst) return
    const dataUrl = inst.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#252731' })
    await window.api.dashboard.exportPng(dataUrl, `${tile.title || 'grafik'}.png`)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-edge bg-surface">
      <div className="drag-handle flex cursor-move items-center justify-between border-b border-edge px-3 py-1.5">
        <span className="truncate text-sm font-medium text-gray-200">
          {tile.title || 'İsimsiz Grafik'}
        </span>
        <div className="flex items-center gap-1.5 text-gray-400">
          <button title="Yenile" className="hover:text-brand-500" onClick={load}>
            ⟳
          </button>
          <button title="PNG dışa aktar" className="hover:text-brand-500" onClick={exportPng}>
            ⤓
          </button>
          <button title="Düzenle" className="hover:text-brand-500" onClick={onEdit}>
            ✎
          </button>
          <button title="Sil" className="hover:text-red-400" onClick={onRemove}>
            ✕
          </button>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden p-1">
        {error ? (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-red-300">
            {error}
          </div>
        ) : (
          <ChartView ref={chartRef} result={result} chart={tile.chart} />
        )}
        {loading && (
          <div className="absolute right-2 top-2 text-xs text-gray-500">yükleniyor…</div>
        )}
      </div>
    </div>
  )
}
