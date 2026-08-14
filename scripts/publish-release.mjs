/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
// Derlenen Windows kurulumunu PaperAxis indirme servisine yükler.
//
//   PUT https://download.paperaxis.com/api/v1/files/paperanalysis
//   Authorization: Bearer <PAX_API_TOKEN>
//   multipart/form-data: version=<sürüm>, file=<kurulum .exe>
//
// Sürüm package.json'dan okunur (tek kaynak), dosya release/ klasöründen seçilir.
// Bağımlılık yok: Node 20'nin fetch/FormData/Blob API'leri kullanılır.

import { readdir, readFile } from 'node:fs/promises'
import { openAsBlob } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_URL = 'https://download.paperaxis.com/api/v1/files/paperanalysis'
const ATTEMPTS = 4

/**
 * Dosya adları arasından bu sürüme ait kurulum (.exe) dosyasını seçer.
 * Taşınabilir (Portable) sürüm ve güncelleme meta dosyaları dışarıda kalır.
 */
export function pickSetupFile(names, version) {
  const setups = names.filter((n) => /-Setup-.*\.exe$/i.test(n))
  return setups.find((n) => n.includes(`-Setup-${version}.`)) ?? setups[0] ?? null
}

/** İstek başarısızsa yeniden denenmeli mi? (ağ hatası ve 5xx evet, 4xx hayır) */
export function shouldRetry(status) {
  return status === null || status >= 500
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function upload({ url, token, version, filePath, fileName }) {
  // Büyük dosyayı belleğe almamak için diskten Blob açılır; desteklenmiyorsa
  // (eski Node) dosya okunarak Blob'a sarılır.
  let blob
  try {
    blob = await openAsBlob(filePath)
  } catch {
    blob = new Blob([await readFile(filePath)])
  }

  const form = new FormData()
  form.append('version', version)
  form.append('file', blob, fileName)

  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  })
  const text = await res.text().catch(() => '')
  return { status: res.status, ok: res.ok, text: text.slice(0, 500) }
}

export async function main() {
  const token = process.env.PAX_API_TOKEN?.trim()
  if (!token) {
    console.error(
      'PAX_API_TOKEN tanımlı değil. PaperAxis API tokenini ortam değişkeni olarak\n' +
        'verin; CI için depo ayarlarından Settings → Secrets and variables → Actions\n' +
        'altına PAX_API_TOKEN adıyla ekleyin.'
    )
    process.exit(1)
  }

  const url = process.env.PAX_UPLOAD_URL?.trim() || DEFAULT_URL
  const pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'))
  const version = pkg.version

  const outDir = join(ROOT, 'release')
  let names = []
  try {
    names = await readdir(outDir)
  } catch {
    console.error(`release/ klasörü yok. Önce paketleyin: npm run package:win`)
    process.exit(1)
  }

  const fileName = pickSetupFile(names, version)
  if (!fileName) {
    console.error(
      `release/ içinde kurulum dosyası (*-Setup-*.exe) bulunamadı.\n` +
        `Bulunanlar: ${names.join(', ') || '(boş)'}`
    )
    process.exit(1)
  }

  console.log(`PaperAxis'e yükleniyor: ${fileName} (sürüm ${version}) → ${url}`)

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    let result
    try {
      result = await upload({ url, token, version, filePath: join(outDir, fileName), fileName })
    } catch (err) {
      result = { status: null, ok: false, text: err instanceof Error ? err.message : String(err) }
    }

    if (result.ok) {
      console.log(`Yükleme tamam (HTTP ${result.status}). ${result.text}`)
      return
    }

    const where = result.status === null ? 'ağ hatası' : `HTTP ${result.status}`
    if (!shouldRetry(result.status) || attempt === ATTEMPTS) {
      console.error(`Yükleme başarısız (${where}): ${result.text}`)
      process.exit(1)
    }

    const waitMs = 2000 * 2 ** (attempt - 1)
    console.warn(`Yükleme başarısız (${where}); ${waitMs / 1000} sn sonra yeniden denenecek…`)
    await sleep(waitMs)
  }
}

// Doğrudan çalıştırıldığında yükle; test dosyası yalnızca yardımcıları içe aktarır.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  await main()
}
