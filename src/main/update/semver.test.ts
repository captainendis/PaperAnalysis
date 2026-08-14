/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { describe, it, expect } from 'vitest'
import { parseVersion, compareVersions, isNewerVersion } from './semver'

describe('parseVersion', () => {
  it('sürüm dizesini sayı dizisine çevirir', () => {
    expect(parseVersion('0.2.34')).toEqual([0, 2, 34])
    expect(parseVersion('v1.0')).toEqual([1, 0])
  })
  it('geçersiz/eksik parçaları 0 sayar', () => {
    expect(parseVersion('1.x.3')).toEqual([1, 0, 3])
    expect(parseVersion('')).toEqual([0])
  })
})

describe('compareVersions', () => {
  it('sayısal (dize değil) karşılaştırır', () => {
    expect(compareVersions('0.2.9', '0.2.10')).toBe(-1) // 9 < 10
    expect(compareVersions('0.2.34', '0.2.34')).toBe(0)
    expect(compareVersions('0.3.0', '0.2.99')).toBe(1)
  })
  it('farklı uzunlukları ele alır', () => {
    expect(compareVersions('1.0', '1.0.0')).toBe(0)
    expect(compareVersions('1.0.1', '1.0')).toBe(1)
  })
})

describe('isNewerVersion', () => {
  it('uzak sürüm daha yeniyse true', () => {
    expect(isNewerVersion('0.2.35', '0.2.34')).toBe(true)
    expect(isNewerVersion('0.2.34', '0.2.34')).toBe(false)
    expect(isNewerVersion('0.2.33', '0.2.34')).toBe(false)
  })
})
