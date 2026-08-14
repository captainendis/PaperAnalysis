/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
/**
 * Çapraz filtre değeri değişimi: bir grafikte bir kategoriye tıklanınca ilgili
 * pano parametresine atanacak yeni değeri hesaplar. Aynı değere tekrar tıklamak
 * filtreyi temizler (boş dizgi).
 */
export function toggleCrossFilter(current: string, clicked: string): string {
  return current === clicked ? '' : clicked
}
