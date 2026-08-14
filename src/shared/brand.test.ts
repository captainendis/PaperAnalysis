/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { describe, it, expect } from 'vitest'
import { BRAND, copyrightLine, footerLine } from './brand'

describe('brand', () => {
  it('telif satırını PaperAxis künyesiyle üretir', () => {
    expect(copyrightLine()).toBe('© 2026 PaperAxis. Tüm hakları saklıdır.')
  })

  it('alt bilgiye sürümü ekler', () => {
    expect(footerLine('0.3.0')).toBe('© 2026 PaperAxis · PaperAnalysis v0.3.0')
  })

  it('sürüm bilinmiyorsa künyeyi sürümsüz basar', () => {
    expect(footerLine('')).toBe('© 2026 PaperAxis · PaperAnalysis')
  })

  it('iletişim adresi kullanıcıya görünen adrestir', () => {
    expect(BRAND.contactEmail).toBe('info@paperaxis.com')
  })
})
