import { describe, it, expect } from 'vitest'
import { PALETTES, getPalette } from './palettes'

describe('palettes', () => {
  it('bilinen palet adını döndürür', () => {
    expect(getPalette('vivid').name).toBe('vivid')
  })

  it('bilinmeyen adda varsayılana düşer', () => {
    expect(getPalette('yok').name).toBe('default')
  })

  it('her palet en az 6 farklı renk içerir (dark & light)', () => {
    for (const p of PALETTES) {
      expect(new Set(p.dark).size).toBeGreaterThanOrEqual(6)
      expect(new Set(p.light).size).toBeGreaterThanOrEqual(6)
    }
  })
})
