import { describe, it, expect } from 'vitest'
import { buildResult, resolveTimeoutMs, DEFAULT_QUERY_TIMEOUT_SEC } from './types'

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

describe('resolveTimeoutMs', () => {
  it('tanımsızda varsayılanı (300 sn) ms olarak verir', () => {
    expect(resolveTimeoutMs(undefined)).toBe(DEFAULT_QUERY_TIMEOUT_SEC * 1000)
    expect(resolveTimeoutMs(undefined)).toBe(300_000)
  })
  it('0 veya negatif → 0 (sınırsız)', () => {
    expect(resolveTimeoutMs(0)).toBe(0)
    expect(resolveTimeoutMs(-5)).toBe(0)
  })
  it('saniyeyi ms’ye çevirir', () => {
    expect(resolveTimeoutMs(60)).toBe(60_000)
    expect(resolveTimeoutMs(600)).toBe(600_000)
  })
})
