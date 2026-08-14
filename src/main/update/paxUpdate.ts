/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { app, dialog, shell } from 'electron'
import https from 'https'
import { createWriteStream } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { isNewerVersion } from './semver'
import { isPortable } from '../portable'

/**
 * PaperAxis indirme servisi üzerinden otomatik güncelleme.
 *
 * - Sürüm bilgisi: GET /api/version/paperanalysis  → { version, fileName, ... }
 * - Kurulum indirme: GET /download/paperanalysis   → .exe (yönlendirmeleri izler)
 *
 * API anahtarları her sürüme derleme sırasında gömülür (aşağıdaki sabitler).
 * Anahtar, sunucunun hangi biçimi beklediğinden bağımsız olsun diye hem
 * `Authorization: Bearer` hem de `x-api-key` başlığıyla gönderilir.
 */

// Otomatik gömülen API anahtarları (PaperAxis).
const VERSION_API_KEY = 'pax_Zsf0M6RyGCrVvQxdG5SbsOK97ZumwE01'
const DOWNLOAD_API_KEY = 'pax_bnoir2mO85xVs16B65tz8UYtoZbEyMkE'

const VERSION_URL = 'https://download.paperaxis.com/api/version/paperanalysis'
const DOWNLOAD_URL = 'https://download.paperaxis.com/download/paperanalysis'

interface VersionInfo {
  version?: string
  fileName?: string
  size?: number
  downloadUrl?: string
}

function authHeaders(key: string): Record<string, string> {
  // Sunucu hangi biçimi beklerse beklesin çalışsın diye iki yaygın biçim de gönderilir.
  return { Authorization: `Bearer ${key}`, 'x-api-key': key }
}

/** Sürüm bilgisini (JSON) çeker; yönlendirmeleri izler. */
function fetchJson(url: string, key: string, redirects = 0): Promise<VersionInfo> {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Çok fazla yönlendirme'))
    https
      .get(url, { headers: { ...authHeaders(key), Accept: 'application/json' } }, (res) => {
        const code = res.statusCode ?? 0
        if (code >= 300 && code < 400 && res.headers.location) {
          res.resume()
          resolve(fetchJson(new URL(res.headers.location, url).toString(), key, redirects + 1))
          return
        }
        if (code !== 200) {
          res.resume()
          reject(new Error(`HTTP ${code}`))
          return
        }
        let data = ''
        res.setEncoding('utf8')
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as VersionInfo)
          } catch (e) {
            reject(e)
          }
        })
      })
      .on('error', reject)
  })
}

/** Kurulum dosyasını indirir; yönlendirmeleri izler; hedef yola yazar. */
function downloadFile(url: string, key: string, dest: string, redirects = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Çok fazla yönlendirme'))
    const req = https.get(url, { headers: authHeaders(key) }, (res) => {
      const code = res.statusCode ?? 0
      if (code >= 300 && code < 400 && res.headers.location) {
        res.resume()
        resolve(downloadFile(new URL(res.headers.location, url).toString(), key, dest, redirects + 1))
        return
      }
      if (code !== 200) {
        res.resume()
        reject(new Error(`HTTP ${code}`))
        return
      }
      const file = createWriteStream(dest)
      res.pipe(file)
      file.on('finish', () => file.close(() => resolve()))
      file.on('error', reject)
    })
    req.on('error', reject)
  })
}

let checking = false

/**
 * Güncelleme kontrolü: uzak sürümü çeker, daha yeniyse kullanıcıya sorup indirir ve
 * kurulumu başlatır. `silent` true iken hata durumunda kullanıcıya iletişim kutusu
 * göstermez (arka plan kontrolü).
 */
export async function checkForUpdates(silent = true): Promise<void> {
  if (!app.isPackaged) return
  if (checking) return
  checking = true
  try {
    const info = await fetchJson(VERSION_URL, VERSION_API_KEY)
    const remote = String(info?.version ?? '').trim()
    const current = app.getVersion()
    if (!remote || !isNewerVersion(remote, current)) {
      if (!silent) {
        await dialog.showMessageBox({
          type: 'info',
          title: 'Güncel',
          message: `PaperAnalysis güncel (${current}).`,
          detail: 'En son sürümü kullanıyorsunuz.'
        })
      }
      return
    }

    // Taşınabilir kopyada kurulum sihirbazı çalıştırılmaz — kullanıcı exe'yi
    // kendisi değiştirir. Sadece haber verilir.
    if (isPortable()) {
      await dialog.showMessageBox({
        type: 'info',
        buttons: ['Tamam'],
        title: 'Güncelleme var',
        message: `PaperAnalysis ${remote} yayınlandı (bu kopya: ${current}).`,
        detail:
          'Taşınabilir sürüm kendini güncellemez. Yeni sürümü indirip bu dosyanın ' +
          'yerine koymanız yeterli; verileriniz exe’nin yanındaki PaperAnalysis-Data ' +
          'klasöründe kalır.'
      })
      return
    }

    const { response } = await dialog.showMessageBox({
      type: 'info',
      buttons: ['İndir ve kur', 'Sonra'],
      defaultId: 0,
      cancelId: 1,
      title: 'Güncelleme var',
      message: `PaperAnalysis ${remote} yayınlandı (yüklü: ${current}).`,
      detail:
        'Yeni sürümü şimdi indirip kurmak ister misiniz? İndirme bittikten sonra ' +
        'kurulum başlatılacak — silip yeniden kurmanıza gerek yok.'
    })
    if (response !== 0) return

    const fileName = String(info?.fileName || `PaperAnalysis-Setup-${remote}.exe`)
    const dest = join(tmpdir(), fileName)
    await downloadFile(DOWNLOAD_URL, DOWNLOAD_API_KEY, dest)

    const { response: r2 } = await dialog.showMessageBox({
      type: 'info',
      buttons: ['Şimdi kur (uygulama kapanacak)', 'Sonra'],
      defaultId: 0,
      cancelId: 1,
      title: 'Güncelleme indirildi',
      message: `PaperAnalysis ${remote} indirildi.`,
      detail: 'Kurulumu başlatmak için uygulama kapanacak ve kurulum sihirbazı açılacak.'
    })
    if (r2 !== 0) return

    // Kurulumu başlat ve uygulamayı kapat (before-quit temizliği çalışır).
    await shell.openPath(dest)
    setTimeout(() => app.quit(), 800)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('PaperAxis güncelleme hatası:', msg)
    if (!silent) {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Güncelleme hatası',
        message: 'Güncelleme kontrol edilemedi.',
        detail: msg
      })
    }
  } finally {
    checking = false
  }
}

/** Başlangıçta ve saatlik olarak arka planda güncelleme kontrolü kurar. */
export function setupAutoUpdate(): void {
  if (!app.isPackaged) return
  void checkForUpdates(true)
  setInterval(() => void checkForUpdates(true), 60 * 60 * 1000)
}
