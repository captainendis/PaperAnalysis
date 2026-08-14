/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */

/**
 * Sürüm servisinin döndürdüğü kayıt ve onun üzerindeki saf yardımcılar
 * (Electron'a bağımlı değil; birim test edilir).
 *
 * GET https://download.paperaxis.com/api/version/paperanalysis
 * → { version, fileName, size, downloadUrl, pageUrl, ... }
 */
export interface VersionInfo {
  version?: string
  fileName?: string
  size?: number
  downloadUrl?: string
  pageUrl?: string
}

/** Sürüm servisi bir adres bildirmezse kullanılacak sabit indirme adresi. */
export const DOWNLOAD_URL = 'https://download.paperaxis.com/download/paperanalysis'

/** Tarayıcıda açılan, herkese açık indirme sayfası. */
export const PAGE_URL = 'https://download.paperaxis.com/f/paperanalysis'

/**
 * Servisin bildirdiği indirme adresini kullanır; yoksa ya da güvenli değilse
 * (https dışı bir adres) sabit adrese düşer.
 */
export function pickDownloadUrl(info: VersionInfo | null | undefined): string {
  const url = info?.downloadUrl?.trim()
  return url && url.startsWith('https://') ? url : DOWNLOAD_URL
}

/**
 * Kullanıcıyı yönlendireceğimiz indirme sayfası; servis bildirmezse sabit adres.
 * (Uygulama içinden indirme yapılamadığında bu adres tarayıcıda açılır.)
 */
export function pickPageUrl(info: VersionInfo | null | undefined): string {
  const url = info?.pageUrl?.trim()
  return url && url.startsWith('https://') ? url : PAGE_URL
}

/** Bayt sayısını "88,8 MB" gibi okunur bir metne çevirir; bilinmiyorsa boş döner. */
export function formatSize(bytes: number | undefined): string {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return ''
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}
