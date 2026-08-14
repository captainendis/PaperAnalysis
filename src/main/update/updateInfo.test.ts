/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { describe, it, expect } from 'vitest'
import { DOWNLOAD_URL, PAGE_URL, formatSize, pickDownloadUrl, pickPageUrl } from './updateInfo'

describe('pickDownloadUrl', () => {
  it('servisin bildirdiği https adresini kullanır', () => {
    expect(pickDownloadUrl({ downloadUrl: 'https://download.paperaxis.com/download/x' })).toBe(
      'https://download.paperaxis.com/download/x'
    )
  })

  it('adres yoksa sabit adrese düşer', () => {
    expect(pickDownloadUrl(null)).toBe(DOWNLOAD_URL)
    expect(pickDownloadUrl({})).toBe(DOWNLOAD_URL)
  })

  it('https olmayan adresi kabul etmez', () => {
    expect(pickDownloadUrl({ downloadUrl: 'http://kotu.example/x' })).toBe(DOWNLOAD_URL)
  })
})

describe('pickPageUrl', () => {
  it('servisin bildirdiği sayfa adresini kullanır', () => {
    expect(pickPageUrl({ pageUrl: 'https://download.paperaxis.com/f/x' })).toBe(
      'https://download.paperaxis.com/f/x'
    )
  })

  it('adres yoksa sabit sayfaya düşer', () => {
    expect(pickPageUrl({})).toBe(PAGE_URL)
    expect(pickPageUrl({ pageUrl: 'javascript:alert(1)' })).toBe(PAGE_URL)
  })
})

describe('formatSize', () => {
  it('baytı MB olarak yazar', () => {
    expect(formatSize(93121734)).toBe('88,8 MB')
  })

  it('bilinmeyen boyutta boş döner', () => {
    expect(formatSize(undefined)).toBe('')
    expect(formatSize(0)).toBe('')
  })
})
