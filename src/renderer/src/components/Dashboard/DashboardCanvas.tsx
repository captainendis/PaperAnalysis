import { useMemo, useState } from 'react'
import RGL, { WidthProvider, type Layout } from 'react-grid-layout'
import { useDashboard } from '../../store/dashboard'
import { useConnections } from '../../store/connections'
import { DashboardTileCard } from './DashboardTileCard'
import { TileEditor } from '../TileEditor/TileEditor'
import { defaultTile } from '../../lib/serialize'
import { Button } from '../common/Button'
import type { DashboardTile } from '@shared/types'

export function DashboardCanvas() {
  const ResponsiveGrid = useMemo(() => WidthProvider(RGL), [])
  const { dashboard, addTile, updateTile, removeTile, updateLayouts } = useDashboard()
  const activeConnId = useConnections((s) => s.activeId)
  const [editing, setEditing] = useState<DashboardTile | null>(null)
  const [isNew, setIsNew] = useState(false)

  function startNew() {
    setEditing(defaultTile(activeConnId))
    setIsNew(true)
  }

  function startEdit(tile: DashboardTile) {
    setEditing(tile)
    setIsNew(false)
  }

  function handleSave(tile: DashboardTile) {
    if (isNew) addTile(tile)
    else updateTile(tile)
  }

  const layout: Layout[] = dashboard.tiles.map((t) => ({
    i: t.id,
    x: t.layout.x,
    y: t.layout.y === Infinity ? Infinity : t.layout.y,
    w: t.layout.w,
    h: t.layout.h,
    minW: 3,
    minH: 4
  }))

  function onLayoutChange(next: Layout[]) {
    updateLayouts(next.map((l) => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h })))
  }

  return (
    <div className="relative h-full overflow-auto bg-[#15161b] p-4">
      {dashboard.tiles.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <p className="text-lg text-gray-300">Panonuz boş</p>
          <p className="max-w-sm text-sm text-gray-500">
            Bir SQL sorgusu yazıp grafiğe dönüştürün ve bu panoya ekleyin.
          </p>
          <Button variant="primary" onClick={startNew}>
            + İlk Grafiği Ekle
          </Button>
        </div>
      ) : (
        <ResponsiveGrid
          className="layout"
          layout={layout}
          cols={12}
          rowHeight={36}
          draggableHandle=".drag-handle"
          onLayoutChange={onLayoutChange}
          compactType="vertical"
          margin={[12, 12]}
        >
          {dashboard.tiles.map((tile) => (
            <div key={tile.id}>
              <DashboardTileCard
                tile={tile}
                onEdit={() => startEdit(tile)}
                onRemove={() => {
                  if (confirm('Bu grafik panodan kaldırılsın mı?')) removeTile(tile.id)
                }}
              />
            </div>
          ))}
        </ResponsiveGrid>
      )}

      {dashboard.tiles.length > 0 && (
        <button
          className="fixed bottom-6 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-2xl text-white shadow-lg hover:bg-brand-600"
          title="Yeni grafik ekle"
          onClick={startNew}
        >
          +
        </button>
      )}

      {editing && (
        <TileEditor
          open={!!editing}
          tile={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
