/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */

/**
 * PaperAxis künyesi — tek kaynak. Hakkında ekranı, alt bilgi ve yayınlanan
 * sayfalar metinleri buradan alır; hiçbir yerde elle yazılmaz. Sürüm burada
 * tutulmaz: o, package.json'dan (app.getVersion) okunur.
 */
export const BRAND = {
  company: 'PaperAxis',
  product: 'PaperAnalysis',
  /** Telif yılı — ürünün ilk yayın yılı. */
  copyrightYear: 2026,
  site: 'https://paperaxis.com',
  contactEmail: 'info@paperaxis.com',
  privacyUrl: 'https://paperaxis.com/gizlilik'
} as const

/** "© 2026 PaperAxis. Tüm hakları saklıdır." */
export function copyrightLine(): string {
  return `© ${BRAND.copyrightYear} ${BRAND.company}. Tüm hakları saklıdır.`
}

/** "© 2026 PaperAxis · PaperAnalysis v0.3.0" (sürüm boşsa sürümsüz). */
export function footerLine(version = ''): string {
  const v = version.trim() ? ` v${version.trim()}` : ''
  return `© ${BRAND.copyrightYear} ${BRAND.company} · ${BRAND.product}${v}`
}
