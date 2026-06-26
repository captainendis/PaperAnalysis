import { useEffect, useState } from 'react'
import type { DbKind, SafeConnection } from '@shared/types'
import { useConnections } from '../../store/connections'
import { Button } from '../common/Button'
import { ConnectionForm } from './ConnectionForm'

const KIND_BADGE: Record<DbKind, string> = {
  mssql: 'MSSQL',
  postgres: 'PG',
  mysql: 'MySQL',
  sqlite: 'SQLite'
}

export function ConnectionPanel() {
  const { items, activeId, setActive, refresh, remove } = useConnections()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SafeConnection | undefined>()

  useEffect(() => {
    refresh()
  }, [refresh])

  function openNew() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(c: SafeConnection) {
    setEditing(c)
    setFormOpen(true)
  }

  return (
    <aside className="flex w-64 flex-col border-r border-edge bg-panel">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Bağlantılar
        </h2>
        <Button variant="primary" className="!px-2 !py-1" onClick={openNew}>
          + Yeni
        </Button>
      </div>

      <div className="flex-1 overflow-auto px-2 pb-3">
        {items.length === 0 && (
          <p className="px-2 py-4 text-xs text-gray-500">
            Henüz bağlantı yok. Başlamak için “+ Yeni”ye tıklayın.
          </p>
        )}
        {items.map((c) => (
          <div
            key={c.id}
            className={`group mb-1 cursor-pointer rounded-md px-3 py-2 transition ${
              activeId === c.id ? 'bg-brand-500/20 ring-1 ring-brand-500/40' : 'hover:bg-white/5'
            }`}
            onClick={() => setActive(c.id)}
          >
            <div className="flex items-center justify-between">
              <span className="truncate text-sm font-medium text-gray-100">{c.name}</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-300">
                {KIND_BADGE[c.kind]}
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="truncate text-[11px] text-gray-500">
                {c.kind === 'sqlite' ? c.filePath : `${c.host ?? ''}${c.database ? '/' + c.database : ''}`}
              </span>
              <div className="hidden gap-2 group-hover:flex">
                <button
                  className="text-[11px] text-gray-400 hover:text-brand-500"
                  onClick={(e) => {
                    e.stopPropagation()
                    openEdit(c)
                  }}
                >
                  Düzenle
                </button>
                <button
                  className="text-[11px] text-gray-400 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`"${c.name}" bağlantısı silinsin mi?`)) remove(c.id)
                  }}
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConnectionForm open={formOpen} initial={editing} onClose={() => setFormOpen(false)} />
    </aside>
  )
}
