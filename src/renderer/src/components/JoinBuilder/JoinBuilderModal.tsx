import { useEffect, useMemo, useState } from 'react'
import type { DbKind, TableInfo } from '@shared/types'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Field, Select, TextInput } from '../common/Field'
import { useSchema } from '../../store/schema'
import {
  buildJoinSql,
  buildUnionSql,
  type FilterCond,
  type FilterOp,
  type JoinKey,
  type JoinType
} from '../../lib/joinBuilder'

interface Props {
  open: boolean
  connectionId: string | null
  kind: DbKind
  onClose: () => void
  onGenerate: (sql: string) => void
}

const JOIN_TYPES: { value: JoinType; label: string }[] = [
  { value: 'inner', label: 'Eşleşenler (INNER)' },
  { value: 'left', label: 'Sol + eksikler (LEFT)' },
  { value: 'right', label: 'Sağ + eksikler (RIGHT)' },
  { value: 'full', label: 'Tümü (FULL)' }
]

const OPS: FilterOp[] = ['=', '<>', '>', '<', '>=', '<=', 'LIKE', 'IS NULL', 'IS NOT NULL']

function tableRef(t: TableInfo | null) {
  return t ? { schema: t.schema, name: t.name } : { name: '' }
}

export function JoinBuilderModal({ open, connectionId, kind, onClose, onGenerate }: Props) {
  const { cache, load } = useSchema()
  const schema = connectionId ? cache[connectionId] : undefined
  const tables = schema?.tables ?? []

  const [mode, setMode] = useState<'join' | 'union'>('join')
  const [leftName, setLeftName] = useState('')
  const [rightName, setRightName] = useState('')
  const [joinType, setJoinType] = useState<JoinType>('inner')
  const [keys, setKeys] = useState<JoinKey[]>([{ left: '', right: '' }])
  const [onlyUnmatched, setOnlyUnmatched] = useState(false)
  const [allColumns, setAllColumns] = useState(true)
  const [pickedCols, setPickedCols] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<FilterCond[]>([])
  const [unionAll, setUnionAll] = useState(true)
  const [limit, setLimit] = useState(0)

  useEffect(() => {
    if (open && connectionId) load(connectionId)
  }, [open, connectionId, load])

  const leftT = tables.find((t) => t.name === leftName) ?? null
  const rightT = tables.find((t) => t.name === rightName) ?? null
  const leftCols = leftT?.columns.map((c) => c.name) ?? []
  const rightCols = rightT?.columns.map((c) => c.name) ?? []

  function toggleCol(key: string) {
    setPickedCols((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const columns = useMemo(() => {
    if (mode !== 'join') return []
    if (allColumns) {
      return [
        ...leftCols.map((c) => ({ table: 'a' as const, column: c })),
        ...rightCols.map((c) => ({ table: 'b' as const, column: c }))
      ]
    }
    const out: { table: 'a' | 'b'; column: string }[] = []
    for (const c of leftCols) if (pickedCols.has('a:' + c)) out.push({ table: 'a', column: c })
    for (const c of rightCols) if (pickedCols.has('b:' + c)) out.push({ table: 'b', column: c })
    return out
  }, [mode, allColumns, leftCols, rightCols, pickedCols])

  const sql = useMemo(() => {
    if (!leftT || !rightT) return ''
    if (mode === 'union') {
      return buildUnionSql(kind, {
        mode: 'union',
        left: tableRef(leftT),
        right: tableRef(rightT),
        all: unionAll,
        limit: limit || undefined
      })
    }
    return buildJoinSql(kind, {
      mode: 'join',
      left: tableRef(leftT),
      right: tableRef(rightT),
      joinType,
      keys: keys.filter((k) => k.left && k.right),
      onlyUnmatched,
      columns,
      filters: filters.filter((f) => f.column),
      limit: limit || undefined
    })
  }, [mode, leftT, rightT, kind, joinType, keys, onlyUnmatched, columns, filters, unionAll, limit])

  return (
    <Modal
      open={open}
      wide
      title="İki Tabloyu Birleştir"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button variant="primary" onClick={() => onGenerate(sql)} disabled={!sql}>
            Sorguya Ekle
          </Button>
        </>
      }
    >
      {!connectionId ? (
        <p className="text-sm text-gray-400">Önce bir bağlantı seçin.</p>
      ) : (
        <div className="flex gap-4">
          {/* Sol: yapılandırma */}
          <div className="flex w-1/2 flex-col gap-4">
            <div className="flex rounded-md border border-edge bg-surface p-0.5 text-sm">
              <button
                className={`flex-1 rounded px-3 py-1 ${mode === 'join' ? 'bg-brand-500 text-white' : 'text-gray-300'}`}
                onClick={() => setMode('join')}
              >
                Birleştir (Join)
              </button>
              <button
                className={`flex-1 rounded px-3 py-1 ${mode === 'union' ? 'bg-brand-500 text-white' : 'text-gray-300'}`}
                onClick={() => setMode('union')}
              >
                Alt Alta (Union)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tablo A">
                <Select value={leftName} onChange={(e) => setLeftName(e.target.value)}>
                  <option value="">— seçin —</option>
                  {tables.map((t) => (
                    <option key={`l-${t.schema}-${t.name}`} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tablo B">
                <Select value={rightName} onChange={(e) => setRightName(e.target.value)}>
                  <option value="">— seçin —</option>
                  {tables.map((t) => (
                    <option key={`r-${t.schema}-${t.name}`} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {mode === 'join' ? (
              <>
                <Field label="Birleştirme Türü">
                  <Select value={joinType} onChange={(e) => setJoinType(e.target.value as JoinType)}>
                    {JOIN_TYPES.map((j) => (
                      <option key={j.value} value={j.value}>
                        {j.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Eşleştirme Anahtarları (A = B)
                  </span>
                  <div className="mt-1 flex flex-col gap-1">
                    {keys.map((k, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <Select
                          className="flex-1"
                          value={k.left}
                          onChange={(e) =>
                            setKeys((ks) => ks.map((x, j) => (j === i ? { ...x, left: e.target.value } : x)))
                          }
                        >
                          <option value="">A sütunu</option>
                          {leftCols.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </Select>
                        <span className="text-gray-500">=</span>
                        <Select
                          className="flex-1"
                          value={k.right}
                          onChange={(e) =>
                            setKeys((ks) => ks.map((x, j) => (j === i ? { ...x, right: e.target.value } : x)))
                          }
                        >
                          <option value="">B sütunu</option>
                          {rightCols.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </Select>
                        <button
                          className="px-1 text-gray-500 hover:text-red-400"
                          onClick={() => setKeys((ks) => ks.filter((_, j) => j !== i))}
                          title="Kaldır"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      className="self-start text-xs text-brand-500 hover:underline"
                      onClick={() => setKeys((ks) => [...ks, { left: '', right: '' }])}
                    >
                      + anahtar ekle
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={onlyUnmatched}
                    onChange={(e) => setOnlyUnmatched(e.target.checked)}
                  />
                  Yalnızca eşleşmeyenler (B tarafı boş) — “stoğu olup ölçüsü olmayan” gibi
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={allColumns}
                    onChange={(e) => setAllColumns(e.target.checked)}
                  />
                  Tüm sütunlar
                </label>
                {!allColumns && (
                  <div className="grid grid-cols-2 gap-2">
                    {(['a', 'b'] as const).map((side) => (
                      <div key={side} className="max-h-32 overflow-auto rounded border border-edge bg-surface p-2">
                        <div className="mb-1 text-[11px] text-gray-500">
                          {side === 'a' ? leftName || 'A' : rightName || 'B'}
                        </div>
                        {(side === 'a' ? leftCols : rightCols).map((c) => (
                          <label key={c} className="flex items-center gap-1 text-xs text-gray-200">
                            <input
                              type="checkbox"
                              checked={pickedCols.has(`${side}:${c}`)}
                              onChange={() => toggleCol(`${side}:${c}`)}
                            />
                            {c}
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Filtreler
                  </span>
                  <div className="mt-1 flex flex-col gap-1">
                    {filters.map((f, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <Select
                          value={f.table}
                          onChange={(e) =>
                            setFilters((fs) => fs.map((x, j) => (j === i ? { ...x, table: e.target.value as 'a' | 'b' } : x)))
                          }
                        >
                          <option value="a">A</option>
                          <option value="b">B</option>
                        </Select>
                        <Select
                          className="flex-1"
                          value={f.column}
                          onChange={(e) =>
                            setFilters((fs) => fs.map((x, j) => (j === i ? { ...x, column: e.target.value } : x)))
                          }
                        >
                          <option value="">sütun</option>
                          {(f.table === 'a' ? leftCols : rightCols).map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </Select>
                        <Select
                          value={f.op}
                          onChange={(e) =>
                            setFilters((fs) => fs.map((x, j) => (j === i ? { ...x, op: e.target.value as FilterOp } : x)))
                          }
                        >
                          {OPS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                        {f.op !== 'IS NULL' && f.op !== 'IS NOT NULL' && (
                          <TextInput
                            className="w-24"
                            placeholder="değer"
                            value={f.value ?? ''}
                            onChange={(e) =>
                              setFilters((fs) => fs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                            }
                          />
                        )}
                        <button
                          className="px-1 text-gray-500 hover:text-red-400"
                          onClick={() => setFilters((fs) => fs.filter((_, j) => j !== i))}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      className="self-start text-xs text-brand-500 hover:underline"
                      onClick={() =>
                        setFilters((fs) => [...fs, { table: 'a', column: '', op: '=', value: '' }])
                      }
                    >
                      + filtre ekle
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <label className="flex items-center gap-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={unionAll}
                    onChange={(e) => setUnionAll(e.target.checked)}
                  />
                  UNION ALL (tekrarları koru)
                </label>
                <p className="text-xs text-gray-500">
                  İki tablonun sütun yapısı uyumlu olmalıdır (aynı sıra/sayı). Tüm sütunlar
                  (`*`) alt alta eklenir.
                </p>
              </>
            )}

            <Field label="Satır sınırı (0 = Tümü)">
              <TextInput
                type="number"
                min={0}
                value={limit || ''}
                placeholder="Tümü"
                onChange={(e) => setLimit(Math.max(0, Number(e.target.value) || 0))}
              />
            </Field>
          </div>

          {/* Sağ: SQL önizleme */}
          <div className="flex w-1/2 flex-col">
            <span className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
              Üretilen SQL
            </span>
            <pre className="h-full min-h-[300px] overflow-auto whitespace-pre-wrap rounded-md border border-edge bg-surface p-3 text-xs text-gray-200">
              {sql || '— Tabloları ve anahtarları seçin —'}
            </pre>
          </div>
        </div>
      )}
    </Modal>
  )
}
