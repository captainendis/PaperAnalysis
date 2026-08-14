/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { app } from 'electron'
import { mkdirSync } from 'fs'
import { join } from 'path'

/**
 * Taşınabilir (portable) çalıştırma desteği.
 *
 * electron-builder'ın portable hedefi, tek dosya exe çalıştırıldığında exe'nin
 * bulunduğu dizini `PORTABLE_EXECUTABLE_DIR` ortam değişkeninde verir. Uygulamanın
 * kendisi geçici bir dizine açıldığı için, veriyi varsayılan `userData` yoluna
 * (AppData) yazmak taşınabilirliği bozar: USB bellekteki kopya makinede iz bırakır
 * ve başka bir makinede bağlantılar boş gelir. Bu yüzden taşınabilir kopyada tüm
 * kullanıcı verisi exe'nin yanındaki `PaperAnalysis-Data` klasörüne alınır.
 */

const DATA_DIR_NAME = 'PaperAnalysis-Data'

/** Taşınabilir kopyada exe'nin bulunduğu dizin; kurulu sürümde null. */
export function portableDir(): string | null {
  const dir = process.env['PORTABLE_EXECUTABLE_DIR']?.trim()
  return dir ? dir : null
}

/** Uygulama taşınabilir kopya olarak mı çalışıyor? */
export function isPortable(): boolean {
  return portableDir() !== null
}

/**
 * Taşınabilir kopyada veri yollarını exe'nin yanına taşır.
 * `app.whenReady()` beklenmeden, uygulama açılışının en başında çağrılmalıdır —
 * aksi halde bazı yollar varsayılan konumdan okunmuş olur.
 */
export function setupPortablePaths(): void {
  const dir = portableDir()
  if (!dir) return
  const root = join(dir, DATA_DIR_NAME)
  const userData = join(root, 'userData')
  try {
    mkdirSync(userData, { recursive: true })
    app.setPath('userData', userData)
    app.setPath('sessionData', join(userData, 'session'))
  } catch (err) {
    // Yazma izni yoksa (ör. salt okunur medya) varsayılan yollarla devam et.
    console.error('Taşınabilir veri klasörü hazırlanamadı:', err)
  }
}
