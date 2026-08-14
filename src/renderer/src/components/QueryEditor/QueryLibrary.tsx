/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { useQueries } from '../../store/queries'

interface Props {
  sql: string
  connectionId: string | null
  onLoad: (sql: string) => void
}

/** Sorgu geçmişi ve kayıtlı sorgular için kompakt kütüphane çubuğu. */
export function QueryLibrary({ sql, connectionId, onLoad }: Props) {
  const { history, saved, saveQuery, deleteSaved } = useQueries()

  const selectCls =
    'rounded-md border border-edge bg-surface px-2 py-1 text-xs text-gray-200 outline-none focus:border-brand-500'

  return (
    <div className="flex items-center gap-2">
      <select
        className={selectCls}
        value=""
        onChange={(e) => {
          const item = history.find((h) => h.id === e.target.value)
          if (item) onLoad(item.sql)
        }}
        title="Sorgu geçmişi"
      >
        <option value="">🕘 Geçmiş ({history.length})</option>
        {history.map((h) => (
          <option key={h.id} value={h.id}>
            {h.sql.replace(/\s+/g, ' ').slice(0, 50)}
          </option>
        ))}
      </select>

      <select
        className={selectCls}
        value=""
        onChange={(e) => {
          const val = e.target.value
          if (val.startsWith('del:')) {
            const id = val.slice(4)
            if (confirm('Kayıtlı sorgu silinsin mi?')) deleteSaved(id)
            return
          }
          const item = saved.find((q) => q.id === val)
          if (item) onLoad(item.sql)
        }}
        title="Kayıtlı sorgular"
      >
        <option value="">⭐ Kayıtlı ({saved.length})</option>
        {saved.map((q) => (
          <option key={q.id} value={q.id}>
            {q.name}
          </option>
        ))}
        {saved.length > 0 && <option disabled>──────────</option>}
        {saved.map((q) => (
          <option key={'del-' + q.id} value={'del:' + q.id}>
            🗑 Sil: {q.name}
          </option>
        ))}
      </select>

      <button
        className="rounded-md border border-edge px-2 py-1 text-xs text-gray-200 hover:bg-white/10"
        onClick={() => {
          const name = prompt('Sorgu adı:')
          if (name && name.trim()) saveQuery(name.trim(), sql, connectionId)
        }}
        disabled={!sql.trim()}
        title="Bu sorguyu kaydet"
      >
        💾 Kaydet
      </button>
    </div>
  )
}
