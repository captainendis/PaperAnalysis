// Basit sürüm karşılaştırma yardımcıları (semver benzeri: sayısal parçalar).
// Elektron/IO bağımlılığı yoktur; birim test edilebilir.

/** "v0.2.34" → [0, 2, 34]. Sayısal olmayan/eksik parçalar 0 sayılır. */
export function parseVersion(v: string): number[] {
  return String(v ?? '')
    .trim()
    .replace(/^v/i, '')
    .split('.')
    .map((p) => {
      const n = parseInt(p, 10)
      return Number.isFinite(n) ? n : 0
    })
}

/** a<b → -1, a==b → 0, a>b → 1 (parça parça sayısal karşılaştırma). */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  const n = Math.max(pa.length, pb.length)
  for (let i = 0; i < n; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d > 0 ? 1 : -1
  }
  return 0
}

/** Uzak sürüm, yüklü sürümden yeni mi? */
export function isNewerVersion(remote: string, current: string): boolean {
  return compareVersions(remote, current) > 0
}
