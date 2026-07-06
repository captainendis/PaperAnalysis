import { describe, it, expect } from 'vitest'
import { reportFileName } from './filename'

describe('reportFileName', () => {
  const date = new Date(2026, 6, 6, 14, 30, 5) // 2026-07-06 14:30:05 (yerel)

  it('zaman damgalı .pdf adı üretir', () => {
    expect(reportFileName('pano', date)).toBe('pano_2026-07-06_14-30-05.pdf')
  })

  it('boşlukları ve güvensiz karakterleri alt çizgiye çevirir', () => {
    expect(reportFileName('Satış / Rapor', date)).toBe('Satış_Rapor_2026-07-06_14-30-05.pdf')
  })

  it('boş taban için varsayılan kullanır', () => {
    expect(reportFileName('', date)).toBe('pano_2026-07-06_14-30-05.pdf')
  })
})
