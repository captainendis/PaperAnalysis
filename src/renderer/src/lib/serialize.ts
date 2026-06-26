import type { Dashboard, DashboardTile } from '@shared/types'

export function createEmptyDashboard(name = 'Yeni Pano'): Dashboard {
  return { version: 1, name, tiles: [] }
}

/** Basit benzersiz id üreteci (zaman + sayaç). */
let counter = 0
export function uid(prefix = 'id'): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}_${counter}`
}

export function defaultTile(connectionId: string | null): DashboardTile {
  return {
    id: uid('tile'),
    title: 'Yeni Grafik',
    connectionId,
    sql: '',
    chart: { type: 'bar', dimension: null, measure: null, aggregation: 'sum' },
    layout: { x: 0, y: Infinity, w: 6, h: 8 }
  }
}
