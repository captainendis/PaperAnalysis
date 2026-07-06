import { useWorkspace } from '../store/workspace'
import { useDashboard } from '../store/dashboard'

/** Açık panolar arasında geçiş için sekme çubuğu. */
export function DashboardTabs() {
  const { tabIds, activeId, snapshots, switchTo, closeTab, newTab } = useWorkspace()
  const activeName = useDashboard((s) => s.dashboard.name)
  const activeDirty = useDashboard((s) => s.dirty)

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-edge bg-panel px-2 py-1">
      {tabIds.map((id) => {
        const isActive = id === activeId
        const name = isActive
          ? activeName
          : (snapshots[id]?.dashboard.name ?? 'Pano')
        const dirty = isActive ? activeDirty : (snapshots[id]?.dirty ?? false)
        return (
          <div
            key={id}
            className={`group flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 py-1 text-sm transition ${
              isActive
                ? 'bg-brand-500/20 text-gray-100 ring-1 ring-brand-500/40'
                : 'text-gray-400 hover:bg-white/5'
            }`}
            onClick={() => switchTo(id)}
            title={name || 'İsimsiz pano'}
          >
            <span className="max-w-[160px] truncate">{name || 'İsimsiz pano'}</span>
            {dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="kaydedilmedi" />}
            {tabIds.length > 1 && (
              <button
                className="rounded px-1 text-gray-500 opacity-0 hover:text-red-400 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(id)
                }}
                title="Sekmeyi kapat"
              >
                ✕
              </button>
            )}
          </div>
        )
      })}
      <button
        className="shrink-0 rounded-md px-2 py-1 text-sm text-gray-400 hover:bg-white/10 hover:text-brand-500"
        onClick={newTab}
        title="Yeni pano"
      >
        +
      </button>
    </div>
  )
}
