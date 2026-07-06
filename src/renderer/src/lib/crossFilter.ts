/**
 * Çapraz filtre değeri değişimi: bir grafikte bir kategoriye tıklanınca ilgili
 * pano parametresine atanacak yeni değeri hesaplar. Aynı değere tekrar tıklamak
 * filtreyi temizler (boş dizgi).
 */
export function toggleCrossFilter(current: string, clicked: string): string {
  return current === clicked ? '' : clicked
}
