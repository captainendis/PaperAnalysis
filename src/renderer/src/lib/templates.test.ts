import { describe, it, expect } from 'vitest'
import { salesOverviewTemplate } from './templates'

describe('salesOverviewTemplate', () => {
  const dash = salesOverviewTemplate('conn-1')

  it('adlandırılmış bir pano üretir', () => {
    expect(dash.name).toBe('Satış Genel Bakış')
    expect(dash.version).toBe(1)
  })

  it('beklenen grafik türlerini içerir', () => {
    const types = dash.tiles.map((t) => t.chart.type)
    expect(types).toContain('kpi')
    expect(types).toContain('bar')
    expect(types).toContain('line')
    expect(types).toContain('pie')
    expect(types).toContain('table')
  })

  it('her tile geçerli SQL ve bağlantı id içerir', () => {
    expect(dash.tiles.length).toBeGreaterThanOrEqual(5)
    for (const t of dash.tiles) {
      expect(t.sql.trim().length).toBeGreaterThan(0)
      expect(t.connectionId).toBe('conn-1')
      expect(t.id).toBeTruthy()
      expect(t.layout.w).toBeGreaterThan(0)
    }
  })

  it('tile id\'leri benzersizdir', () => {
    const ids = dash.tiles.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('çapraz filtre parametrelerini tanımlar', () => {
    const names = (dash.parameters ?? []).map((p) => p.name)
    expect(names).toContain('kategori')
    expect(names).toContain('bolge')
    expect((dash.parameters ?? []).every((p) => p.value === '')).toBe(true)
  })

  it('kategori bar grafiği kategori parametresini yayar', () => {
    const bar = dash.tiles.find((t) => t.chart.type === 'bar')
    expect(bar?.chart.crossFilterParam).toBe('kategori')
  })

  it('bölge pasta grafiği bolge parametresini yayar', () => {
    const pie = dash.tiles.find((t) => t.chart.type === 'pie')
    expect(pie?.chart.crossFilterParam).toBe('bolge')
  })

  it('trend grafiği koruyucu WHERE koşulu içerir', () => {
    const line = dash.tiles.find((t) => t.chart.type === 'line')
    expect(line?.sql).toContain(':kategori IS NULL OR kategori = :kategori')
  })
})
