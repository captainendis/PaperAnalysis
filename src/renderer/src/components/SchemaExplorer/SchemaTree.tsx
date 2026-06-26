import { useEffect, useState } from 'react'
import type { TableInfo } from '@shared/types'
import { useSchema } from '../../store/schema'

interface Props {
  connectionId: string | null
  /** Tabloya tıklanınca: otomatik SELECT ekle. */
  onPickTable: (table: TableInfo) => void
  /** Sütuna tıklanınca: imleç konumuna sütun adı ekle. */
  onPickColumn: (column: string) => void
}

export function SchemaTree({ connectionId, onPickTable, onPickColumn }: Props) {
  const { cache, loadingId, error, load } = useSchema()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (connectionId) load(connectionId)
  }, [connectionId, load])

  if (!connectionId) {
    return <div className="p-3 text-xs text-gray-500">Önce bir bağlantı seçin.</div>
  }

  const schema = cache[connectionId]
  const loading = loadingId === connectionId

  if (loading && !schema) {
    return <div className="p-3 text-xs text-gray-500">Şema yükleniyor…</div>
  }
  if (error && !schema) {
    return <div className="p-3 text-xs text-red-300">{error}</div>
  }
  if (!schema) return null

  const q = filter.trim().toLowerCase()
  const tables = q
    ? schema.tables.filter((t) => t.name.toLowerCase().includes(q))
    : schema.tables

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 px-2 pb-2">
        <input
          className="w-full rounded border border-edge bg-surface px-2 py-1 text-xs text-gray-100 outline-none focus:border-brand-500"
          placeholder="Tablo ara…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button
          className="rounded px-1.5 py-1 text-xs text-gray-400 hover:bg-white/10"
          title="Şemayı yenile"
          onClick={() => load(connectionId, true)}
        >
          ⟳
        </button>
      </div>
      <div className="flex-1 overflow-auto px-1 text-sm">
        {tables.length === 0 && (
          <div className="p-2 text-xs text-gray-500">Tablo bulunamadı.</div>
        )}
        {tables.map((t) => {
          const key = `${t.schema ?? ''}.${t.name}`
          const isOpen = expanded[key]
          return (
            <div key={key} className="mb-0.5">
              <div className="flex items-center gap-1 rounded px-1 py-1 hover:bg-white/5">
                <button
                  className="text-gray-500 hover:text-gray-300"
                  onClick={() => setExpanded((e) => ({ ...e, [key]: !e[key] }))}
                >
                  {isOpen ? '▾' : '▸'}
                </button>
                <button
                  className="flex-1 truncate text-left text-gray-200"
                  title="Tabloyu sorgula"
                  onClick={() => onPickTable(t)}
                >
                  🗄 {t.name}
                </button>
                <span className="text-[10px] text-gray-600">{t.columns.length}</span>
              </div>
              {isOpen && (
                <div className="ml-5 border-l border-edge pl-2">
                  {t.columns.map((c) => (
                    <button
                      key={c.name}
                      className="flex w-full items-center justify-between gap-2 rounded px-1 py-0.5 text-left text-xs text-gray-400 hover:bg-white/5 hover:text-brand-500"
                      title="Sütun adını ekle"
                      onClick={() => onPickColumn(c.name)}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] text-gray-600">{c.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
