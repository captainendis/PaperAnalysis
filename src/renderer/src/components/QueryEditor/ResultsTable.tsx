import { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { QueryResult } from '@shared/types'
import {
  buildViewResult,
  compareCells,
  isNumericColumn,
  matchesFilter,
  sumValues
} from '../../lib/tableView'
import { toCsv, toXlsxBase64 } from '../../lib/exporters'

/** Tahmini satır yüksekliği (px) — sanallaştırma için (py-1.5 + metin + kenarlık). */
const ROW_HEIGHT = 33

/** Toplam/hesaplanan sütun tanımı. */
interface SumColumn {
  id: string
  name: string
  cols: string[]
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n)
}

interface Props {
  result: QueryResult
  /** Dışa aktarım dosya adı için başlık. */
  title?: string
}

export const ResultsTable = memo(function ResultsTable({ result, title }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [showFilters, setShowFilters] = useState(false)
  const [showCols, setShowCols] = useState(false)
  const [showTotals, setShowTotals] = useState(false)
  const [showSumMenu, setShowSumMenu] = useState(false)
  const [sumColumns, setSumColumns] = useState<SumColumn[]>([])
  const [sumDraft, setSumDraft] = useState<{ name: string; cols: Set<string> }>({
    name: 'Toplam',
    cols: new Set()
  })
  const [menuCol, setMenuCol] = useState<string | null>(null)
  const headRef = useRef<HTMLTableSectionElement>(null)
  const colsRef = useRef<HTMLDivElement>(null)
  const sumRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sumIdRef = useRef(0)

  // Bağlantı/sonuç değişince eklenen toplam sütunlarını sıfırla.
  useEffect(() => {
    setSumColumns([])
    setSumDraft({ name: 'Toplam', cols: new Set() })
  }, [result.columns])

  useEffect(() => {
    if (!menuCol) return
    const onDown = (e: MouseEvent) => {
      if (headRef.current && !headRef.current.contains(e.target as Node)) setMenuCol(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuCol])

  useEffect(() => {
    if (!showCols) return
    const onDown = (e: MouseEvent) => {
      if (colsRef.current && !colsRef.current.contains(e.target as Node)) setShowCols(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showCols])

  useEffect(() => {
    if (!showSumMenu) return
    const onDown = (e: MouseEvent) => {
      if (sumRef.current && !sumRef.current.contains(e.target as Node)) setShowSumMenu(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showSumMenu])

  // Sayısal sütunları saptar (ilk 200 satır örneklenir — büyük veride hızlı).
  const numericNames = useMemo(() => {
    const sample = result.rows.slice(0, 200)
    return new Set(result.columns.map((c) => c.name).filter((n) => isNumericColumn(sample, n)))
  }, [result.columns, result.rows])

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const base = result.columns.map((c) => ({
      accessorKey: c.name,
      header: c.name,
      sortingFn: (a, b, id) => compareCells(a.getValue(id), b.getValue(id)),
      filterFn: (row, id, value) => matchesFilter(row.getValue(id), String(value)),
      cell: (info) => {
        const v = info.getValue()
        if (v === null || v === undefined) return <span className="text-gray-600">NULL</span>
        if (typeof v === 'object') return JSON.stringify(v)
        return String(v)
      }
    })) as ColumnDef<Record<string, unknown>>[]

    const sums = sumColumns.map((sc) => ({
      id: sc.id,
      header: sc.name,
      accessorFn: (row: Record<string, unknown>) => sumValues(sc.cols.map((c) => row[c])),
      sortingFn: (a, b, id) => compareCells(a.getValue(id), b.getValue(id)),
      filterFn: (row, id, value) => matchesFilter(row.getValue(id), String(value)),
      cell: (info) => formatNumber(Number(info.getValue()))
    })) as ColumnDef<Record<string, unknown>>[]

    return [...base, ...sums]
  }, [result.columns, sumColumns])

  const table = useReactTable({
    data: result.rows,
    columns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  const rows = table.getRowModel().rows

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12
  })
  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0

  // Sayısal sütun kimlikleri (temel sayısal + eklenen toplam sütunları).
  const numericColIds = useMemo(
    () => new Set<string>([...numericNames, ...sumColumns.map((s) => s.id)]),
    [numericNames, sumColumns]
  )

  const filteredRows = table.getFilteredRowModel().rows

  // Alt toplam satırı: her görünür sayısal sütunun (filtrelenmiş) satır toplamı.
  // Kaydırma sırasında yeniden hesaplanmaması için kararlı bağımlılıklara dayanır.
  const totals = useMemo(() => {
    if (!showTotals) return null
    const map: Record<string, number> = {}
    for (const col of table.getVisibleLeafColumns()) {
      if (numericColIds.has(col.id)) {
        map[col.id] = sumValues(filteredRows.map((r) => r.getValue(col.id)))
      }
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTotals, filteredRows, columnVisibility, numericColIds, sumColumns])

  function currentView(): QueryResult {
    const cols = table.getVisibleLeafColumns()
    const names = cols.map((c) => String(c.columnDef.header))
    const viewRows = table.getSortedRowModel().rows.map((r) => {
      const o: Record<string, unknown> = {}
      cols.forEach((c) => {
        o[String(c.columnDef.header)] = r.getValue(c.id)
      })
      return o
    })
    return buildViewResult(names, viewRows)
  }
  async function exportCsv() {
    await window.api.file.saveText(toCsv(currentView()), `${title || 'veri'}.csv`, ['csv'])
  }
  async function exportXlsx() {
    await window.api.file.saveBinary(toXlsxBase64(currentView()), `${title || 'veri'}.xlsx`, [
      'xlsx'
    ])
  }

  function addSumColumn() {
    const cols = [...sumDraft.cols]
    if (cols.length === 0) return
    const id = `__sum_${sumIdRef.current++}`
    setSumColumns((prev) => [...prev, { id, name: sumDraft.name.trim() || 'Toplam', cols }])
    setSumDraft({ name: 'Toplam', cols: new Set() })
    setShowSumMenu(false)
  }

  if (result.columns.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-400">
        Sorgu {result.rowCount} satır etkiledi ({result.elapsedMs} ms).
      </div>
    )
  }

  const filteredCount = filteredRows.length
  const totalCount = result.rows.length
  const isFiltered = columnFilters.some((f) => String(f.value ?? '').trim() !== '')
  const allCols = table.getAllLeafColumns()
  const hiddenCount = allCols.filter((c) => !c.getIsVisible()).length
  const numericBaseNames = result.columns.map((c) => c.name).filter((n) => numericNames.has(n))
  const visibleLeaf = table.getVisibleLeafColumns()

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 text-[11px] text-gray-400"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-1">
          <button
            className={`rounded px-1.5 py-0.5 hover:bg-white/10 ${showFilters ? 'text-brand-500' : ''}`}
            title={showFilters ? 'Filtre satırını gizle' : 'Sütun filtrelerini göster'}
            onClick={() => setShowFilters((s) => !s)}
          >
            🔍 Filtrele
          </button>
          <div ref={colsRef} className="relative">
            <button
              className={`rounded px-1.5 py-0.5 hover:bg-white/10 ${hiddenCount > 0 || showCols ? 'text-brand-500' : ''}`}
              title="Sütunları göster/gizle"
              onClick={() => setShowCols((s) => !s)}
            >
              🗂 Sütunlar{hiddenCount > 0 ? ` (${allCols.length - hiddenCount}/${allCols.length})` : ''}
            </button>
            {showCols && (
              <div className="absolute left-0 top-full z-30 mt-0.5 max-h-64 w-52 overflow-auto rounded border border-edge bg-surface p-1 shadow-lg">
                <div className="flex items-center justify-between px-1 pb-1">
                  <button className="rounded px-1 py-0.5 text-brand-500 hover:bg-white/10" onClick={() => table.toggleAllColumnsVisible(true)}>
                    Tümü
                  </button>
                  <button className="rounded px-1 py-0.5 text-gray-400 hover:bg-white/10" onClick={() => table.toggleAllColumnsVisible(false)}>
                    Hiçbiri
                  </button>
                </div>
                {allCols.map((col) => (
                  <label key={col.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs text-gray-200 hover:bg-white/5">
                    <input type="checkbox" checked={col.getIsVisible()} onChange={col.getToggleVisibilityHandler()} />
                    <span className="truncate">{String(col.columnDef.header)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            className={`rounded px-1.5 py-0.5 hover:bg-white/10 ${showTotals ? 'text-brand-500' : ''}`}
            title="Sayısal sütunların alt toplamını göster"
            onClick={() => setShowTotals((s) => !s)}
          >
            Σ Alt toplam
          </button>
          <div ref={sumRef} className="relative">
            <button
              className={`rounded px-1.5 py-0.5 hover:bg-white/10 ${sumColumns.length > 0 || showSumMenu ? 'text-brand-500' : ''}`}
              title="Seçili sütunları toplayan yeni bir sütun ekle"
              onClick={() => setShowSumMenu((s) => !s)}
            >
              ➕ Toplam sütunu{sumColumns.length > 0 ? ` (${sumColumns.length})` : ''}
            </button>
            {showSumMenu && (
              <div className="absolute left-0 top-full z-30 mt-0.5 w-60 rounded border border-edge bg-surface p-2 shadow-lg">
                {numericBaseNames.length === 0 ? (
                  <div className="text-xs text-gray-500">Sayısal sütun bulunamadı.</div>
                ) : (
                  <>
                    <div className="mb-1 text-[11px] text-gray-400">Toplanacak sütunlar:</div>
                    <div className="max-h-40 overflow-auto">
                      {numericBaseNames.map((n) => (
                        <label key={n} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs text-gray-200 hover:bg-white/5">
                          <input
                            type="checkbox"
                            checked={sumDraft.cols.has(n)}
                            onChange={() =>
                              setSumDraft((d) => {
                                const cols = new Set(d.cols)
                                if (cols.has(n)) cols.delete(n)
                                else cols.add(n)
                                return { ...d, cols }
                              })
                            }
                          />
                          <span className="truncate">{n}</span>
                        </label>
                      ))}
                    </div>
                    <input
                      className="mt-2 w-full rounded border border-edge bg-base px-1.5 py-0.5 text-xs text-gray-100 outline-none focus:border-brand-500"
                      placeholder="Yeni sütun adı"
                      value={sumDraft.name}
                      onChange={(e) => setSumDraft((d) => ({ ...d, name: e.target.value }))}
                    />
                    <button
                      className="mt-2 w-full rounded bg-brand-500 px-2 py-1 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-40"
                      disabled={sumDraft.cols.size === 0}
                      onClick={addSumColumn}
                    >
                      Sütunu ekle
                    </button>
                  </>
                )}
                {sumColumns.length > 0 && (
                  <div className="mt-2 border-t border-edge pt-1">
                    {sumColumns.map((sc) => (
                      <div key={sc.id} className="flex items-center justify-between gap-1 px-1 py-0.5 text-xs text-gray-300">
                        <span className="truncate" title={sc.cols.join(' + ')}>
                          {sc.name} = {sc.cols.join(' + ')}
                        </span>
                        <button
                          className="text-gray-500 hover:text-red-400"
                          title="Kaldır"
                          onClick={() => setSumColumns((prev) => prev.filter((x) => x.id !== sc.id))}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button className="rounded px-1.5 py-0.5 hover:bg-white/10 hover:text-brand-500" title="Görünümü CSV olarak indir" onClick={exportCsv}>
            CSV
          </button>
          <button className="rounded px-1.5 py-0.5 hover:bg-white/10 hover:text-brand-500" title="Görünümü Excel olarak indir" onClick={exportXlsx}>
            Excel
          </button>
        </div>
        <span>
          {isFiltered ? `${filteredCount} / ${totalCount} satır` : `${totalCount} satır`}
          {isFiltered && (
            <button
              className="ml-2 rounded px-1 py-0.5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
              title="Filtreleri temizle"
              onClick={() => setColumnFilters([])}
            >
              temizle ✕
            </button>
          )}
        </span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead ref={headRef} className="sticky top-0 z-10 bg-surface">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const sorted = h.column.getIsSorted()
                  const open = menuCol === h.column.id
                  return (
                    <th key={h.id} className="relative border-b border-edge px-3 py-2 text-left font-semibold text-gray-300 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <button
                          className="cursor-pointer select-none hover:text-brand-500"
                          title="Sıralamak için tıklayın (A→Z / Z→A)"
                          onClick={h.column.getToggleSortingHandler()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          <span className="ml-1 text-[10px] text-gray-500">
                            {sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '↕'}
                          </span>
                        </button>
                        <button
                          className="rounded px-0.5 text-[10px] text-gray-500 hover:bg-white/10 hover:text-gray-300"
                          title="Sıralama menüsü"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={() => setMenuCol(open ? null : h.column.id)}
                        >
                          ▾
                        </button>
                      </span>
                      {open && (
                        <div className="absolute left-3 top-full z-20 mt-0.5 min-w-[130px] rounded border border-edge bg-surface py-1 text-xs font-normal shadow-lg" onMouseDown={(e) => e.stopPropagation()}>
                          <button className={`flex w-full items-center gap-2 px-3 py-1 text-left hover:bg-white/10 ${sorted === 'asc' ? 'text-brand-500' : 'text-gray-200'}`} onClick={() => { h.column.toggleSorting(false); setMenuCol(null) }}>
                            <span className="text-[10px]">▲</span> A → Z (artan)
                          </button>
                          <button className={`flex w-full items-center gap-2 px-3 py-1 text-left hover:bg-white/10 ${sorted === 'desc' ? 'text-brand-500' : 'text-gray-200'}`} onClick={() => { h.column.toggleSorting(true); setMenuCol(null) }}>
                            <span className="text-[10px]">▼</span> Z → A (azalan)
                          </button>
                          {sorted && (
                            <button className="flex w-full items-center gap-2 px-3 py-1 text-left text-gray-400 hover:bg-white/10" onClick={() => { h.column.clearSorting(); setMenuCol(null) }}>
                              <span className="text-[10px]">✕</span> Sıralamayı kaldır
                            </button>
                          )}
                          <button className="flex w-full items-center gap-2 px-3 py-1 text-left text-gray-400 hover:bg-white/10" onClick={() => { h.column.toggleVisibility(false); setMenuCol(null) }}>
                            <span className="text-[10px]">🗙</span> Sütunu gizle
                          </button>
                        </div>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
            {showFilters &&
              table.getHeaderGroups().map((hg) => (
                <tr key={`f-${hg.id}`}>
                  {hg.headers.map((h) => {
                    const numeric = numericColIds.has(h.column.id)
                    return (
                      <th key={h.id} className="border-b border-edge bg-surface px-2 py-1" onMouseDown={(e) => e.stopPropagation()}>
                        <input
                          className="w-full rounded border border-edge bg-base px-1.5 py-0.5 text-xs font-normal text-gray-100 outline-none focus:border-brand-500"
                          placeholder={numeric ? 'Filtre ( >0, =0, <100 )' : 'Filtre…'}
                          value={(h.column.getFilterValue() as string) ?? ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => h.column.setFilterValue(e.target.value)}
                        />
                      </th>
                    )
                  })}
                </tr>
              ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td colSpan={allCols.length} style={{ height: paddingTop }} />
              </tr>
            )}
            {virtualRows.map((vr) => {
              const row = rows[vr.index]
              return (
                <tr key={row.id} className="hover:bg-white/5" style={{ height: ROW_HEIGHT }}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="border-b border-edge/60 px-3 py-1.5 text-gray-200 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
            {paddingBottom > 0 && (
              <tr>
                <td colSpan={allCols.length} style={{ height: paddingBottom }} />
              </tr>
            )}
          </tbody>
          {totals && (
            <tfoot className="sticky bottom-0 z-10 bg-panel">
              <tr>
                {visibleLeaf.map((col, i) => (
                  <td key={col.id} className="border-t border-edge px-3 py-1.5 font-semibold text-gray-100 whitespace-nowrap">
                    {col.id in totals ? (
                      <span title="Görünen satırların toplamı">{formatNumber(totals[col.id])}</span>
                    ) : i === 0 ? (
                      <span className="text-gray-400">Toplam</span>
                    ) : (
                      ''
                    )}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
        {totalCount === 0 && (
          <div className="p-4 text-sm text-gray-500">Sonuç bulunamadı (0 satır).</div>
        )}
        {totalCount > 0 && filteredCount === 0 && (
          <div className="p-4 text-sm text-gray-500">Filtreyle eşleşen satır yok.</div>
        )}
      </div>
    </div>
  )
})
