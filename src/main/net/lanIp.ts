/** os.networkInterfaces() benzeri girdi tipi (yalnızca gerekli alanlar). */
export interface IfaceAddr {
  address: string
  family: string | number
  internal: boolean
}

/**
 * Ağ arayüzlerinden ilk internal olmayan IPv4 adresini seçer.
 * Bulunamazsa 127.0.0.1 döner.
 */
export function pickLanIp(interfaces: Record<string, IfaceAddr[] | undefined>): string {
  for (const addrs of Object.values(interfaces)) {
    for (const a of addrs ?? []) {
      const isV4 = a.family === 'IPv4' || a.family === 4
      if (isV4 && !a.internal && a.address) return a.address
    }
  }
  return '127.0.0.1'
}
