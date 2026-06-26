import { useState } from 'react'
import type { DashboardTile, QueryResult } from '@shared/types'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Select } from '../common/Field'
import { SqlEditor } from '../QueryEditor/SqlEditor'
import { ResultsTable } from '../QueryEditor/ResultsTable'
import { ChartBuilder } from '../ChartBuilder/ChartBuilder'
import { ChartView } from '../ChartBuilder/ChartView'
import { useConnections } from '../../store/connections'

interface Props {
  open: boolean
  tile: DashboardTile
  onClose: () => void
  onSave: (tile: DashboardTile) => void
}

type Tab = 'data' | 'chart'

export function TileEditor({ open, tile, onClose, onSave }: Props) {
  const connections = useConnections((s) => s.items)
  const [draft, setDraft] = useState<DashboardTile>(tile)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('data')

  async function runQuery() {
    if (!draft.connectionId) {
      setError('Lütfen bir bağlantı seçin.')
      return
    }
    setRunning(true)
    setError(null)
    const res = await window.api.query.run(draft.connectionId, draft.sql)
    setRunning(false)
    if (res.ok) {
      setResult(res.data)
      setTab('chart')
    } else {
      setError(res.error)
    }
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
          <Button variant="primary" onClick={handleSave} disabled={!draft.chart.dimension}>
            Panoya Kaydet
          </Button>
        </>
      }
    >
      <div className="flex h-[68vh] gap-4">
        {/* Sol: sorgu / sonuç */}
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-2">
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
            <Button variant="primary" onClick={runQuery} disabled={running}>
              {running ? 'Çalışıyor…' : '▶ Çalıştır'}
            </Button>
          </div>

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
                <div className="border-b border-edge px-3 py-1.5 text-xs text-gray-400">
                  {result.rowCount} satır · {result.elapsedMs} ms
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
    </Modal>
  )
}
