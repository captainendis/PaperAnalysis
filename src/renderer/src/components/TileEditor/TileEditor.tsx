import { useState } from 'react'
import type { DashboardTile, QueryResult, TableInfo } from '@shared/types'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Select } from '../common/Field'
import { SqlEditor } from '../QueryEditor/SqlEditor'
import { ResultsTable } from '../QueryEditor/ResultsTable'
import { QueryLibrary } from '../QueryEditor/QueryLibrary'
import { ChartBuilder } from '../ChartBuilder/ChartBuilder'
import { ChartView } from '../ChartBuilder/ChartView'
import { SchemaTree } from '../SchemaExplorer/SchemaTree'
import { JoinBuilderModal } from '../JoinBuilder/JoinBuilderModal'
import { useConnections } from '../../store/connections'
import { useDashboard } from '../../store/dashboard'
import { useQueries } from '../../store/queries'
import { paramValues } from '../../lib/params'
import { previewSelect } from '../../lib/sqlDialect'
import { toCsv, toXlsxBase64 } from '../../lib/exporters'

interface Props {
  open: boolean
  tile: DashboardTile
  onClose: () => void
  onSave: (tile: DashboardTile) => void
}

type Tab = 'data' | 'chart'

/** Grafik yapılandırmasının panoya kaydedilebilir olup olmadığını belirler. */
function canSave(tile: DashboardTile): boolean {
  const c = tile.chart
  switch (c.type) {
    case 'table':
      return true
    case 'kpi':
      return c.aggregation === 'count' || !!c.measure
    case 'scatter':
      return !!c.xMeasure && !!c.measure
    default:
      return !!c.dimension
  }
}

export function TileEditor({ open, tile, onClose, onSave }: Props) {
  const connections = useConnections((s) => s.items)
  const parameters = useDashboard((s) => s.dashboard.parameters)
  const addHistory = useQueries((s) => s.addHistory)
  const [draft, setDraft] = useState<DashboardTile>(tile)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('data')
  const [showSchema, setShowSchema] = useState(true)
  const [joinOpen, setJoinOpen] = useState(false)

  const activeKind = connections.find((c) => c.id === draft.connectionId)?.kind ?? 'sqlite'

  async function runQuery() {
    if (!draft.connectionId) {
      setError('Lütfen bir bağlantı seçin.')
      return
    }
    setRunning(true)
    setError(null)
    const res = await window.api.query.run(draft.connectionId, draft.sql, paramValues(parameters))
    setRunning(false)
    if (res.ok) {
      setResult(res.data)
      setTab('chart')
      addHistory(draft.sql, draft.connectionId)
    } else {
      setError(res.error)
    }
  }

  function pickTable(t: TableInfo) {
    // Veritabanı türüne uygun önizleme sorgusu (MSSQL TOP, diğerleri LIMIT).
    const kind = connections.find((c) => c.id === draft.connectionId)?.kind ?? 'sqlite'
    const sql = previewSelect(kind, t.schema, t.name)
    setDraft((d) => ({ ...d, sql, title: d.title || t.name }))
  }

  function pickColumn(col: string) {
    setDraft((d) => ({ ...d, sql: d.sql ? `${d.sql} ${col}` : col }))
  }

  async function exportCsv() {
    if (!result) return
    await window.api.file.saveText(toCsv(result), `${draft.title || 'veri'}.csv`, ['csv'])
  }
  async function exportXlsx() {
    if (!result) return
    await window.api.file.saveBinary(toXlsxBase64(result), `${draft.title || 'veri'}.xlsx`, ['xlsx'])
  }

  function handleSave() {
    onSave(draft)
    onClose()
  }

  return (
    <Modal
      open={open}
      wide
      title="Grafik Düzenleyici"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!canSave(draft)}>
            Panoya Kaydet
          </Button>
        </>
      }
    >
      <div className="flex h-[68vh] gap-3">
        {/* En sol: şema ağacı */}
        {showSchema && (
          <div className="flex w-52 flex-col rounded-md border border-edge bg-panel">
            <div className="flex items-center justify-between border-b border-edge px-2 py-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Şema
              </span>
              <button
                className="text-xs text-gray-500 hover:text-gray-300"
                onClick={() => setShowSchema(false)}
                title="Gizle"
              >
                «
              </button>
            </div>
            <div className="flex-1 overflow-hidden py-1">
              <SchemaTree
                connectionId={draft.connectionId}
                onPickTable={pickTable}
                onPickColumn={pickColumn}
              />
            </div>
          </div>
        )}

        {/* Orta: sorgu / sonuç */}
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-2">
            {!showSchema && (
              <button
                className="rounded border border-edge px-2 py-1.5 text-xs text-gray-400 hover:bg-white/10"
                onClick={() => setShowSchema(true)}
                title="Şemayı göster"
              >
                »
              </button>
            )}
            <input
              className="flex-1 rounded-md border border-edge bg-surface px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-brand-500"
              value={draft.title}
              placeholder="Grafik başlığı"
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <Select
              value={draft.connectionId ?? ''}
              onChange={(e) => setDraft({ ...draft, connectionId: e.target.value || null })}
            >
              <option value="">— bağlantı seçin —</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Button
              variant="ghost"
              onClick={() => setJoinOpen(true)}
              disabled={!draft.connectionId}
              title="İki tabloyu birleştir (Join/Union)"
            >
              🔗 Birleştir
            </Button>
            <Button variant="primary" onClick={runQuery} disabled={running}>
              {running ? 'Çalışıyor…' : '▶ Çalıştır'}
            </Button>
          </div>

          <QueryLibrary
            sql={draft.sql}
            connectionId={draft.connectionId}
            onLoad={(sql) => setDraft({ ...draft, sql })}
          />

          <div className="h-2/5 overflow-hidden rounded-md border border-edge">
            <SqlEditor
              value={draft.sql}
              onChange={(sql) => setDraft({ ...draft, sql })}
              onRun={runQuery}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>
          )}

          <div className="flex-1 overflow-hidden rounded-md border border-edge bg-surface">
            {result ? (
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-edge px-3 py-1.5 text-xs text-gray-400">
                  <span>
                    {result.rowCount} satır · {result.elapsedMs} ms
                  </span>
                  <div className="flex gap-2">
                    <button className="hover:text-brand-500" onClick={exportCsv}>
                      CSV
                    </button>
                    <button className="hover:text-brand-500" onClick={exportXlsx}>
                      Excel
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ResultsTable result={result} />
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Sorgu sonucu burada görünecek. (Ctrl/Cmd+Enter ile çalıştır)
              </div>
            )}
          </div>
        </div>

        {/* Sağ: grafik yapılandırma + önizleme */}
        <div className="flex w-80 flex-col gap-3">
          <div className="flex rounded-md border border-edge bg-surface p-0.5 text-sm">
            <button
              className={`flex-1 rounded px-3 py-1 ${tab === 'data' ? 'bg-brand-500 text-white' : 'text-gray-300'}`}
              onClick={() => setTab('data')}
            >
              Ayarlar
            </button>
            <button
              className={`flex-1 rounded px-3 py-1 ${tab === 'chart' ? 'bg-brand-500 text-white' : 'text-gray-300'}`}
              onClick={() => setTab('chart')}
            >
              Önizleme
            </button>
          </div>

          {tab === 'data' ? (
            <div className="flex-1 overflow-auto rounded-md border border-edge bg-surface p-4">
              <ChartBuilder
                chart={draft.chart}
                result={result}
                onChange={(chart) => setDraft({ ...draft, chart })}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden rounded-md border border-edge bg-surface p-2">
              <ChartView result={result} chart={draft.chart} />
            </div>
          )}
        </div>
      </div>

      <JoinBuilderModal
        open={joinOpen}
        connectionId={draft.connectionId}
        kind={activeKind}
        onClose={() => setJoinOpen(false)}
        onGenerate={(generatedSql) => {
          setDraft((d) => ({ ...d, sql: generatedSql }))
          setJoinOpen(false)
        }}
      />
    </Modal>
  )
}
