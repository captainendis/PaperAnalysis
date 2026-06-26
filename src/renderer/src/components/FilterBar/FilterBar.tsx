import { useDashboard } from '../../store/dashboard'

/** Pano parametrelerini girdi olarak gösteren filtre çubuğu. */
export function FilterBar() {
  const parameters = useDashboard((s) => s.dashboard.parameters)
  const setParamValue = useDashboard((s) => s.setParamValue)

  if (!parameters || parameters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-edge bg-panel px-4 py-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Filtreler
      </span>
      {parameters.map((p) => (
        <label key={p.name} className="flex items-center gap-1.5 text-sm">
          <span className="text-gray-400">{p.label || p.name}</span>
          <input
            type={p.type === 'date' ? 'date' : p.type === 'number' ? 'number' : 'text'}
            value={p.value}
            onChange={(e) => setParamValue(p.name, e.target.value)}
            className="w-36 rounded-md border border-edge bg-surface px-2 py-1 text-sm text-gray-100 outline-none focus:border-brand-500"
          />
          <code className="text-[10px] text-gray-600">:{p.name}</code>
        </label>
      ))}
    </div>
  )
}
