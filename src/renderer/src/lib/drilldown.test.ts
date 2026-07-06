import { describe, it, expect } from 'vitest'
import { applyDrill } from './drilldown'
import type { QueryResult } from '@shared/types'

const result: QueryResult = {
  columns: [{ name: 'kategori' }, { name: 'urun' }, { name: 'tutar' }],
  rows: [
    { kategori: 'Elektronik', urun: 'Telefon', tutar: 100 },
    { kategori: 'Elektronik', urun: 'Laptop', tutar: 200 },
    { kategori: 'Giyim', urun: 'Tişört', tutar: 50 }
  ],
  rowCount: 3,
  elapsedMs: 1
}

const levels = ['kategori', 'urun']

describe('applyDrill', () => {
  it('boş path en üst boyutu ve tüm satırları verir', () => {
    const d = applyDrill(result, levels, [])
    expect(d.dimension).toBe('kategori')
    expect(d.result.rowCount).toBe(3)
  })

  it('bir seviye inince süzer ve boyutu değiştirir', () => {
    const d = applyDrill(result, levels, ['Elektronik'])
    expect(d.dimension).toBe('urun')
    expect(d.result.rowCount).toBe(2)
    expect(d.result.rows.every((r) => r.kategori === 'Elektronik')).toBe(true)
  })

  it('son seviyeyi aşan path boyutu son seviyede tutar', () => {
    const d = applyDrill(result, levels, ['Elektronik', 'Telefon'])
    // path.length(2) > levels.length-1(1) → depth=1, boyut son seviye 'urun'
    expect(d.dimension).toBe('urun')
    expect(d.result.rows.every((r) => r.kategori === 'Elektronik')).toBe(true)
  })

  it('drillLevels boşsa boyut null ve sonuç değişmez', () => {
    const d = applyDrill(result, [], [])
    expect(d.dimension).toBeNull()
    expect(d.result.rowCount).toBe(3)
  })
})
