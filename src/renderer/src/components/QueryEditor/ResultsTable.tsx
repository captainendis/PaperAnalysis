import { useEffect, useMemo, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState
} from '@tanstack/react-table'
import type { QueryResult } from '@shared/types'
import { compareCells, includesFilter } from '../../lib/tableView'

export function ResultsTable({ result }: { result: QueryResult }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [showFilters, setShowFilters] = useState(false)
  const [menuCol, setMenuCol] = useState<string | null>(null)
  const headRef = useRef<HTMLTableSectionElement>(null)

  // Menü açıkken dışarı tıklayınca kapat.
  useEffect(() => {
    if (!menuCol) return
    const onDown = (e: MouseEvent) => {
      if (headRef.current && !headRef.current.contains(e.target as Node)) setMenuCol(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuCol])

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () =>
      result.columns.map((c) => ({
        accessorKey: c.name,
        header: c.name,
        sortingFn: (a, b, id) => compareCells(a.getValue(id), b.getValue(id)),
        filterFn: (row, id, value) => includesFilter(row.getValue(id), String(value)),
        cell: (info) => {
          const v = info.getValue()
          if (v === null || v === undefined) return <span className="text-gray-600">NULL</span>
          if (typeof v === 'object') return JSON.stringify(v)
          return String(v)
        }
      })),
    [result.columns]
  )

  const table = useReactTable({
    data: result.rows,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  if (result.columns.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-400">
        Sorgu {result.rowCount} satır etkiledi ({result.elapsedMs} ms).
      </div>
    )
  }

  const filteredCount = table.getFilteredRowModel().rows.length
  const totalCount = result.rows.length
  const isFiltered = columnFilters.some((f) => String(f.value ?? '').trim() !== '')

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex items-center justify-between gap-2 px-2 py-1 text-[11px] text-gray-400"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          className={`rounded px-1.5 py-0.5 hover:bg-white/10 ${
            showFilters ? 'text-brand-500' : ''
          }`}
          title={showFilters ? 'Filtre satırını gizle' : 'Sütun filtrelerini göster'}
          onClick={() => setShowFilters((s) => !s)}
        >
          🔍 Filtrele
        </button>
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
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead ref={headRef} className="sticky top-0 z-10 bg-surface">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const sorted = h.column.getIsSorted()
                  const open = menuCol === h.column.id
                  return (
                    <th
                      key={h.id}
                      className="relative border-b border-edge px-3 py-2 text-left font-semibold text-gray-300 whitespace-nowrap"
                    >
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
                        <div
                          className="absolute left-3 top-full z-20 mt-0.5 min-w-[130px] rounded border border-edge bg-surface py-1 text-xs font-normal shadow-lg"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <button
                            className={`flex w-full items-center gap-2 px-3 py-1 text-left hover:bg-white/10 ${
                              sorted === 'asc' ? 'text-brand-500' : 'text-gray-200'
                            }`}
                            onClick={() => {
                              h.column.toggleSorting(false)
                              setMenuCol(null)
                            }}
                          >
                            <span className="text-[10px]">▲</span> A → Z (artan)
                          </button>
                          <button
                            className={`flex w-full items-center gap-2 px-3 py-1 text-left hover:bg-white/10 ${
                              sorted === 'desc' ? 'text-brand-500' : 'text-gray-200'
                            }`}
                            onClick={() => {
                              h.column.toggleSorting(true)
                              setMenuCol(null)
                            }}
                          >
                            <span className="text-[10px]">▼</span> Z → A (azalan)
                          </button>
                          {sorted && (
                            <button
                              className="flex w-full items-center gap-2 px-3 py-1 text-left text-gray-400 hover:bg-white/10"
                              onClick={() => {
                                h.column.clearSorting()
                                setMenuCol(null)
                              }}
                            >
                              <span className="text-[10px]">✕</span> Sıralamayı kaldır
                            </button>
                          )}
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
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="border-b border-edge bg-surface px-2 py-1"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <input
                        className="w-full rounded border border-edge bg-base px-1.5 py-0.5 text-xs font-normal text-gray-100 outline-none focus:border-brand-500"
                        placeholder="Filtre…"
                        value={(h.column.getFilterValue() as string) ?? ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => h.column.setFilterValue(e.target.value)}
                      />
                    </th>
                  ))}
                </tr>
              ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-white/5">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="border-b border-edge/60 px-3 py-1.5 text-gray-200 whitespace-nowrap"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
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
}
