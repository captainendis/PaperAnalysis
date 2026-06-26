import { create } from 'zustand'
import type { Dashboard, DashboardTile } from '@shared/types'
import { createEmptyDashboard } from '../lib/serialize'

interface DashboardState {
  dashboard: Dashboard
  /** Diske kaydedilmiş dosya yolu (varsa). */
  filePath: string | null
  dirty: boolean
  setName: (name: string) => void
  addTile: (tile: DashboardTile) => void
  updateTile: (tile: DashboardTile) => void
  removeTile: (id: string) => void
  updateLayouts: (layouts: { i: string; x: number; y: number; w: number; h: number }[]) => void
  loadDashboard: (dashboard: Dashboard, path: string | null) => void
  markSaved: (path: string) => void
  reset: () => void
}

export const useDashboard = create<DashboardState>((set) => ({
  dashboard: createEmptyDashboard(),
  filePath: null,
  dirty: false,

  setName: (name) =>
    set((s) => ({ dashboard: { ...s.dashboard, name }, dirty: true })),

  addTile: (tile) =>
    set((s) => ({
      dashboard: { ...s.dashboard, tiles: [...s.dashboard.tiles, tile] },
      dirty: true
    })),

  updateTile: (tile) =>
    set((s) => ({
      dashboard: {
        ...s.dashboard,
        tiles: s.dashboard.tiles.map((t) => (t.id === tile.id ? tile : t))
      },
      dirty: true
    })),

  removeTile: (id) =>
    set((s) => ({
      dashboard: { ...s.dashboard, tiles: s.dashboard.tiles.filter((t) => t.id !== id) },
      dirty: true
    })),

  updateLayouts: (layouts) =>
    set((s) => ({
      dashboard: {
        ...s.dashboard,
        tiles: s.dashboard.tiles.map((t) => {
          const l = layouts.find((x) => x.i === t.id)
          return l ? { ...t, layout: { x: l.x, y: l.y, w: l.w, h: l.h } } : t
        })
      },
      dirty: true
    })),

  loadDashboard: (dashboard, path) => set({ dashboard, filePath: path, dirty: false }),

  markSaved: (path) => set({ filePath: path, dirty: false }),

  reset: () => set({ dashboard: createEmptyDashboard(), filePath: null, dirty: false })
}))
