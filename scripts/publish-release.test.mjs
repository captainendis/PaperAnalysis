/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { describe, it, expect } from 'vitest'
import { pickSetupFile, shouldRetry } from './publish-release.mjs'

const files = [
  'PaperAnalysis-Portable-0.3.0.exe',
  'PaperAnalysis-Setup-0.3.0.exe',
  'PaperAnalysis-Setup-0.3.0.exe.blockmap',
  'latest.yml'
]

describe('pickSetupFile', () => {
  it('sürüme ait kurulum dosyasını seçer', () => {
    expect(pickSetupFile(files, '0.3.0')).toBe('PaperAnalysis-Setup-0.3.0.exe')
  })

  it('taşınabilir sürümü ve meta dosyalarını seçmez', () => {
    expect(pickSetupFile(['PaperAnalysis-Portable-0.3.0.exe', 'latest.yml'], '0.3.0')).toBeNull()
  })

  it('sürüm eşleşmezse eldeki kurulum dosyasına düşer', () => {
    expect(pickSetupFile(files, '9.9.9')).toBe('PaperAnalysis-Setup-0.3.0.exe')
  })

  it('klasör boşsa null döner', () => {
    expect(pickSetupFile([], '0.3.0')).toBeNull()
  })
})

describe('shouldRetry', () => {
  it('ağ hatasında ve sunucu hatasında yeniden dener', () => {
    expect(shouldRetry(null)).toBe(true)
    expect(shouldRetry(503)).toBe(true)
  })

  it('yetki/doğrulama hatasında yeniden denemez', () => {
    expect(shouldRetry(401)).toBe(false)
    expect(shouldRetry(422)).toBe(false)
  })
})
