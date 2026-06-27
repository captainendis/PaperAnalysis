import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

/**
 * Harici sunucu gerektirmeyen örnek bir SQLite satış veritabanı üretir.
 * Üretim deterministiktir (sabit tohumlu sözde-rastgele); böylece testler
 * kararlıdır. Dosya varsa içeriği yeniden oluşturulur (idempotent).
 */

// Basit, deterministik LCG sözde-rastgele üreteci (Math.random kullanılmaz).
function makeRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0xffffffff
  }
}

const KATEGORILER = ['Elektronik', 'Giyim', 'Gıda', 'Kitap', 'Ev & Yaşam']
const URUNLER: Record<string, string[]> = {
  Elektronik: ['Telefon', 'Kulaklık', 'Laptop', 'Tablet'],
  Giyim: ['Tişört', 'Pantolon', 'Ayakkabı', 'Ceket'],
  Gıda: ['Kahve', 'Çikolata', 'Çay', 'Bisküvi'],
  Kitap: ['Roman', 'Bilim', 'Çocuk', 'Tarih'],
  'Ev & Yaşam': ['Lamba', 'Yastık', 'Tencere', 'Halı']
}
const BOLGELER = ['Marmara', 'Ege', 'İç Anadolu', 'Akdeniz', 'Karadeniz']

/** YYYY-MM-DD biçiminde tarih (deterministik; baz tarihten geriye gün). */
function dateMinusDays(baseEpochDay: number, days: number): string {
  const d = new Date((baseEpochDay - days) * 86400000)
  return d.toISOString().slice(0, 10)
}

export interface SampleResult {
  filePath: string
  rowCount: number
}

export function createSampleDatabase(filePath: string, rows = 400): SampleResult {
  mkdirSync(dirname(filePath), { recursive: true })
  const db = new Database(filePath)
  try {
    db.exec('DROP TABLE IF EXISTS satislar')
    db.exec(`
      CREATE TABLE satislar (
        id INTEGER PRIMARY KEY,
        tarih TEXT NOT NULL,
        kategori TEXT NOT NULL,
        urun TEXT NOT NULL,
        bolge TEXT NOT NULL,
        tutar REAL NOT NULL,
        adet INTEGER NOT NULL
      )
    `)

    const rng = makeRng(20240627)
    // Sabit baz gün (2025-12-31'e karşılık gelen epoch gün sayısı civarı);
    // gerçek "bugün"e bağlı kalmadan deterministik tarihler üretir.
    const baseEpochDay = Math.floor(Date.UTC(2025, 11, 31) / 86400000)

    const insert = db.prepare(
      'INSERT INTO satislar (tarih, kategori, urun, bolge, tutar, adet) VALUES (?, ?, ?, ?, ?, ?)'
    )
    const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length) % arr.length]

    const tx = db.transaction(() => {
      for (let i = 0; i < rows; i++) {
        const kategori = pick(KATEGORILER)
        const urun = pick(URUNLER[kategori])
        const bolge = pick(BOLGELER)
        const adet = 1 + Math.floor(rng() * 10)
        const birim = 50 + Math.floor(rng() * 950) // 50–1000
        const tutar = adet * birim
        const tarih = dateMinusDays(baseEpochDay, Math.floor(rng() * 365))
        insert.run(tarih, kategori, urun, bolge, tutar, adet)
      }
    })
    tx()

    const count = (db.prepare('SELECT COUNT(*) AS c FROM satislar').get() as { c: number }).c
    return { filePath, rowCount: count }
  } finally {
    db.close()
  }
}
