import { create } from 'zustand'
import type { Dashboard } from '@shared/types'
import { createEmptyDashboard, uid } from '../lib/serialize'
import { useDashboard } from './dashboard'

/**
 * Birden fazla açık pano ("sekme") yönetir. Aktif pano canlı olarak
 * `useDashboard` store'unda tutulur; sekme değişince aktif panonun anlık görüntüsü
 * saklanır ve hedef sekmenin görüntüsü aktif edilir. Böylece mevcut bileşenler
 * (hepsi `useDashboard`'u kullanır) değişmeden çalışır.
 */

interface Snapshot {
  dashboard: Dashboard
  filePath: string | null
  dirty: boolean
}

interface WorkspaceState {
  /** Sekme id'leri (soldan sağa sıra). */
  tabIds: string[]
  /** Aktif sekme id'si. */
  activeId: string
  /** Aktif olmayan sekmelerin içerikleri. */
  snapshots: Record<string, Snapshot>
  newTab: () => void
  newTabWith: (dashboard: Dashboard, filePath: string | null) => void
  switchTo: (id: string) => void
  closeTab: (id: string) => void
}

const firstId = uid('tab')

function snapshotActive(): Snapshot {
  const d = useDashboard.getState()
  return { dashboard: d.dashboard, filePath: d.filePath, dirty: d.dirty }
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  tabIds: [firstId],
  activeId: firstId,
  snapshots: {},

  newTab: () => {
    const { tabIds, activeId, snapshots } = get()
    const id = uid('tab')
    const next = { ...snapshots, [activeId]: snapshotActive() }
    useDashboard.getState().restoreDoc(createEmptyDashboard(), null, false)
    set({ tabIds: [...tabIds, id], activeId: id, snapshots: next })
  },

  newTabWith: (dashboard, filePath) => {
    const { tabIds, activeId, snapshots } = get()
    const id = uid('tab')
    const next = { ...snapshots, [activeId]: snapshotActive() }
    useDashboard.getState().restoreDoc(dashboard, filePath, false)
    set({ tabIds: [...tabIds, id], activeId: id, snapshots: next })
  },

  switchTo: (id) => {
    const { activeId, snapshots } = get()
    if (id === activeId) return
    const next = { ...snapshots, [activeId]: snapshotActive() }
    const target = next[id]
    if (target) {
      useDashboard.getState().restoreDoc(target.dashboard, target.filePath, target.dirty)
      delete next[id]
    }
    set({ activeId: id, snapshots: next })
  },

  closeTab: (id) => {
    const { tabIds, activeId, snapshots } = get()
    if (tabIds.length <= 1) return // en az bir sekme kalsın

    const isActive = id === activeId
    const dirty = isActive ? useDashboard.getState().dirty : snapshots[id]?.dirty
    if (dirty && !confirm('Bu panoda kaydedilmemiş değişiklikler var. Sekme kapatılsın mı?')) {
      return
    }

    const idx = tabIds.indexOf(id)
    const newIds = tabIds.filter((t) => t !== id)
    const newSnaps = { ...snapshots }
    delete newSnaps[id]

    if (isActive) {
      // Solundaki (yoksa ilk) sekmeye geç.
      const neighbor = newIds[Math.max(0, idx - 1)]
      const snap = newSnaps[neighbor]
      if (snap) {
        useDashboard.getState().restoreDoc(snap.dashboard, snap.filePath, snap.dirty)
        delete newSnaps[neighbor]
      }
      set({ tabIds: newIds, activeId: neighbor, snapshots: newSnaps })
    } else {
      set({ tabIds: newIds, snapshots: newSnaps })
    }
  }
}))
