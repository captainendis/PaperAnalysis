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
