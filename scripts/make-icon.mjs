// Bağımlılıksız uygulama ikonu üreteci: 1024x1024 RGBA tampon çizer ve PNG
// olarak kodlar (yalnızca Node + zlib). Tarayıcı/ağ gerektirmez, deterministiktir.
// Marka mavisi yuvarlatılmış kare zemin + beyaz sütun-grafik glifi.

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SIZE = 1024
const __dirname = dirname(fileURLToPath(import.meta.url))

// RGBA tampon (SIZE*SIZE*4), şeffaf başlar.
const buf = new Uint8Array(SIZE * SIZE * 4)

function setPx(x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return
  const i = (y * SIZE + x) * 4
  // Basit "source-over" karışım (mevcut piksel üstüne).
  const ba = buf[i + 3] / 255
  const na = a / 255
  const outA = na + ba * (1 - na)
  if (outA === 0) return
  buf[i] = Math.round((r * na + buf[i] * ba * (1 - na)) / outA)
  buf[i + 1] = Math.round((g * na + buf[i + 1] * ba * (1 - na)) / outA)
  buf[i + 2] = Math.round((b * na + buf[i + 2] * ba * (1 - na)) / outA)
  buf[i + 3] = Math.round(outA * 255)
}

function fillRoundedRect(x0, y0, w, h, radius, colorAt) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      // Yuvarlatılmış köşe testi.
      const dx = Math.min(x - x0, x0 + w - 1 - x)
      const dy = Math.min(y - y0, y0 + h - 1 - y)
      if (dx < radius && dy < radius) {
        const cx = x0 + (dx === x - x0 ? radius : w - radius)
        const cy = y0 + (dy === y - y0 ? radius : h - radius)
        const dist = Math.hypot(x - cx + 0.5, y - cy + 0.5)
        if (dist > radius) continue
      }
      const [r, g, b, a] = colorAt(x, y)
      setPx(x, y, r, g, b, a)
    }
  }
}

// Zemin: köşeden köşeye dikey mavi gradyan (#1d4ed8 → #2563eb → #3b82f6).
const top = [29, 78, 216]
const bottom = [59, 130, 246]
fillRoundedRect(0, 0, SIZE, SIZE, 200, (_x, y) => {
  const t = y / SIZE
  return [
    Math.round(top[0] + (bottom[0] - top[0]) * t),
    Math.round(top[1] + (bottom[1] - top[1]) * t),
    Math.round(top[2] + (bottom[2] - top[2]) * t),
    255
  ]
})

// Beyaz sütun-grafik glifi: artan yükseklikte 4 çubuk.
const white = () => [255, 255, 255, 255]
const baseY = 720
const barW = 120
const gap = 56
const startX = 232
const heights = [180, 300, 420, 300]
heights.forEach((hgt, i) => {
  const x = startX + i * (barW + gap)
  fillRoundedRect(x, baseY - hgt, barW, hgt, 24, white)
})
// Zemin çizgisi (taban).
fillRoundedRect(200, baseY + 8, SIZE - 400, 20, 10, () => [255, 255, 255, 200])

// ---- PNG kodlama ----
function crc32(bytes) {
  let c = ~0
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0)
  return Buffer.concat([len, typeBytes, data, crc])
}

// IHDR
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // color type RGBA
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

// IDAT: her satır başına filtre baytı (0) + RGBA.
const raw = Buffer.alloc(SIZE * (1 + SIZE * 4))
for (let y = 0; y < SIZE; y++) {
  const rowStart = y * (1 + SIZE * 4)
  raw[rowStart] = 0
  const src = Buffer.from(buf.buffer, y * SIZE * 4, SIZE * 4)
  src.copy(raw, rowStart + 1)
}
const idat = deflateSync(raw, { level: 9 })

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const png = Buffer.concat([
  signature,
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0))
])

const outDir = join(__dirname, '..', 'build')
mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, 'icon.png')
writeFileSync(outPath, png)
console.log(`İkon yazıldı: ${outPath} (${png.length} bayt, ${SIZE}x${SIZE})`)
