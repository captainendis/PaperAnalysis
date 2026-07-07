import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type ReactECharts from 'echarts-for-react'
import type { DashboardTile, QueryResult } from '@shared/types'
import { ChartView } from '../ChartBuilder/ChartView'
import { useDashboard } from '../../store/dashboard'
import { paramValues } from '../../lib/params'
import { toCsv, toXlsxBase64 } from '../../lib/exporters'
import { toggleCrossFilter } from '../../lib/crossFilter'
import { applyDrill } from '../../lib/drilldown'

interface Props {
  tile: DashboardTile
  onEdit: () => void
  onRemove: () => void
}

/** Pano üzerindeki tek bir grafik kartı; kendi sorgusunu çalıştırır. */
export function DashboardTileCard({ tile, onEdit, onRemove }: Props) {
  const parameters = useDashboard((s) => s.dashboard.parameters)
  const refreshIntervalSec = useDashboard((s) => s.dashboard.refreshIntervalSec)
  const setParamValue = useDashboard((s) => s.setParamValue)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [drillPath, setDrillPath] = useState<string[]>([])
  const chartRef = useRef<ReactECharts>(null)

  // Parametre değerlerinin serileştirilmiş hali — değişince yeniden yükle.
  const paramKey = JSON.stringify(parameters?.map((p) => [p.name, p.value]) ?? [])

  const load = useCallback(async () => {
    if (!tile.connectionId || !tile.sql.trim()) return
    setLoading(true)
    setError(null)
    const res = await window.api.query.run(
      tile.connectionId,
      tile.sql,
      paramValues(parameters)
    )
    setLoading(false)
    if (res.ok) {
      setResult(res.data)
      setDrillPath([]) // yeni veri gelince drill sıfırlanır
    } else setError(res.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tile.connectionId, tile.sql, paramKey])

  // Sorgu, bağlantı veya parametre değiştiğinde yeniden çalıştır.
  useEffect(() => {
    load()
  }, [load])

  // Otomatik yenileme.
  useEffect(() => {
    if (!refreshIntervalSec || refreshIntervalSec <= 0) return
    const id = setInterval(load, refreshIntervalSec * 1000)
    return () => clearInterval(id)
  }, [refreshIntervalSec, load])

  async function exportPng() {
    const inst = chartRef.current?.getEchartsInstance()
    if (!inst) return
    const dataUrl = inst.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#252731' })
    await window.api.dashboard.exportPng(dataUrl, `${tile.title || 'grafik'}.png`)
  }

  async function exportCsv() {
    if (!result) return
    await window.api.file.saveText(toCsv(result), `${tile.title || 'veri'}.csv`, ['csv'])
  }

  async function exportXlsx() {
    if (!result) return
    await window.api.file.saveBinary(toXlsxBase64(result), `${tile.title || 'veri'}.xlsx`, ['xlsx'])
  }

  const isChart = tile.chart.type !== 'kpi' && tile.chart.type !== 'table'
  const isTable = tile.chart.type === 'table'

  // Drill-down: yapılandırıldıysa (≥2 seviye) tıklama alt kırılıma iner.
  const drillLevels = tile.chart.drillLevels ?? []
  const drillActive = drillLevels.length > 1
  const drilled = useMemo(
    () => (result && drillActive ? applyDrill(result, drillLevels, drillPath) : null),
    [result, drillActive, drillLevels, drillPath]
  )
  const effectiveChart =
    drilled?.dimension ? { ...tile.chart, dimension: drilled.dimension } : tile.chart
  const effectiveResult = drilled ? drilled.result : result

  // Çapraz filtre: bu grafik bir parametre yayıyorsa tıklama değeri ayarlar.
  const cfParam = tile.chart.crossFilterParam || null
  const cfCurrent = cfParam ? (parameters?.find((p) => p.name === cfParam)?.value ?? '') : ''

  // Tıklama önceliği: önce drill (son seviyeye kadar), sonra çapraz filtre.
  const handleCategoryClick =
    drillActive || cfParam
      ? (value: string) => {
          if (drillActive && drillPath.length < drillLevels.length - 1) {
            setDrillPath([...drillPath, value])
          } else if (cfParam) {
            setParamValue(cfParam, toggleCrossFilter(cfCurrent, value))
          }
        }
      : undefined

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-edge bg-surface">
      <div className="drag-handle flex cursor-move items-center justify-between border-b border-edge px-3 py-1.5">
        <span className="flex items-center gap-2 truncate text-sm font-medium text-gray-200">
          {tile.title || 'İsimsiz Grafik'}
          {cfParam && cfCurrent && (
            <button
              className="flex items-center gap-1 rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] text-brand-500 hover:bg-brand-500/30"
              title="Çapraz filtreyi temizle"
              onClick={() => setParamValue(cfParam, '')}
            >
              ⚡ {cfParam} = {cfCurrent} ✕
            </button>
          )}
        </span>
        <div
          className="flex items-center gap-1.5 text-gray-400"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button title="Yenile" className="hover:text-brand-500" onClick={load}>
            ⟳
          </button>
          {result && !isTable && (
            <>
              <button title="CSV dışa aktar" className="hover:text-brand-500" onClick={exportCsv}>
                CSV
              </button>
              <button title="Excel dışa aktar" className="hover:text-brand-500" onClick={exportXlsx}>
                XLS
              </button>
            </>
          )}
          {isChart && (
            <button title="PNG dışa aktar" className="hover:text-brand-500" onClick={exportPng}>
              ⤓
            </button>
          )}
          <button title="Düzenle" className="hover:text-brand-500" onClick={onEdit}>
            ✎
          </button>
          <button title="Sil" className="hover:text-red-400" onClick={onRemove}>
            ✕
          </button>
        </div>
      </div>
      {/* Drill-down breadcrumb */}
      {drillActive && drillPath.length > 0 && (
        <div className="flex items-center gap-1 border-b border-edge px-3 py-1 text-[11px] text-gray-400">
          <button className="hover:text-brand-500" onClick={() => setDrillPath([])}>
            Tümü
          </button>
          {drillPath.map((v, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-gray-600">›</span>
              <button
                className="hover:text-brand-500"
                onClick={() => setDrillPath(drillPath.slice(0, i + 1))}
              >
                {v}
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative flex-1 overflow-hidden p-1">
        {error ? (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-red-300">
            {error}
          </div>
        ) : (
          <ChartView
            ref={chartRef}
            result={effectiveResult}
            chart={effectiveChart}
            onCategoryClick={handleCategoryClick}
          />
        )}
        {loading && (
          <div className="absolute right-2 top-2 text-xs text-gray-500">yükleniyor…</div>
        )}
      </div>
    </div>
  )
}
