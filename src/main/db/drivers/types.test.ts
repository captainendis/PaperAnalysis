import { describe, it, expect } from 'vitest'
import { buildResult } from './types'

describe('buildResult', () => {
  it('sütun adları verildiğinde onları kullanır', () => {
    const r = buildResult(['x', 'y'], [{ x: 1, y: 2 }], 5)
    expect(r.columns).toEqual([{ name: 'x' }, { name: 'y' }])
    expect(r.rowCount).toBe(1)
    expect(r.elapsedMs).toBe(5)
  })

  it('sütun adları boşsa ilk satırın anahtarlarından türetir (MSSQL yedeği)', () => {
    const r = buildResult([], [{ kategori: 'A', tutar: 10 }], 3)
    expect(r.columns).toEqual([{ name: 'kategori' }, { name: 'tutar' }])
    expect(r.rowCount).toBe(1)
  })

  it('boş sonuç için boş sütun döndürür', () => {
    const r = buildResult([], [], 0)
    expect(r.columns).toEqual([])
    expect(r.rowCount).toBe(0)
  })
})
