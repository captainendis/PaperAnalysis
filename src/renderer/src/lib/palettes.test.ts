/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { describe, it, expect } from 'vitest'
import { PALETTES, getPalette } from './palettes'

describe('palettes', () => {
  it('bilinen palet adını döndürür', () => {
    expect(getPalette('vivid').name).toBe('vivid')
  })

  it('bilinmeyen adda kurumsal palete düşer', () => {
    expect(getPalette('yok').name).toBe('paperaxis')
  })

  it('her palet en az 6 farklı renk içerir (dark & light)', () => {
    for (const p of PALETTES) {
      expect(new Set(p.dark).size).toBeGreaterThanOrEqual(6)
      expect(new Set(p.light).size).toBeGreaterThanOrEqual(6)
    }
  })
})
