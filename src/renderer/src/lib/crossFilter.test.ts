/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { describe, it, expect } from 'vitest'
import { toggleCrossFilter } from './crossFilter'

describe('toggleCrossFilter', () => {
  it('boşken tıklanan değeri ayarlar', () => {
    expect(toggleCrossFilter('', 'Elektronik')).toBe('Elektronik')
  })

  it('farklı bir değere tıklanınca onu ayarlar', () => {
    expect(toggleCrossFilter('Giyim', 'Elektronik')).toBe('Elektronik')
  })

  it('aynı değere tekrar tıklanınca temizler', () => {
    expect(toggleCrossFilter('Elektronik', 'Elektronik')).toBe('')
  })
})
