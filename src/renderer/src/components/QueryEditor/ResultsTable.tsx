import { useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table'
import type { QueryResult } from '@shared/types'

export function ResultsTable({ result }: { result: QueryResult }) {
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () =>
      result.columns.map((c) => ({
        accessorKey: c.name,
        header: c.name,
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
    getCoreRowModel: getCoreRowModel()
  })

  if (result.columns.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-400">
        Sorgu {result.rowCount} satır etkiledi ({result.elapsedMs} ms).
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-surface">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="border-b border-edge px-3 py-2 text-left font-semibold text-gray-300 whitespace-nowrap"
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
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
      {result.rows.length === 0 && (
        <div className="p-4 text-sm text-gray-500">Sonuç bulunamadı (0 satır).</div>
      )}
    </div>
  )
}
