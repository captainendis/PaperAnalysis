/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { describe, it, expect } from 'vitest'
import { pickLanIp } from './lanIp'

describe('pickLanIp', () => {
  it('internal olmayan ilk IPv4 adresini seçer', () => {
    const ifaces = {
      lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
      eth0: [
        { address: '::1', family: 'IPv6', internal: false },
        { address: '192.168.1.42', family: 'IPv4', internal: false }
      ]
    }
    expect(pickLanIp(ifaces)).toBe('192.168.1.42')
  })

  it('family sayısal (4) olsa da çalışır', () => {
    const ifaces = { en0: [{ address: '10.0.0.5', family: 4, internal: false }] }
    expect(pickLanIp(ifaces)).toBe('10.0.0.5')
  })

  it('uygun adres yoksa 127.0.0.1 döner', () => {
    const ifaces = { lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true }] }
    expect(pickLanIp(ifaces)).toBe('127.0.0.1')
  })
})
