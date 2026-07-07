import type { ConnectionConfig, QueryResult, SchemaInfo } from '@shared/types'

/** `:name` yer tutucuları için parametre değerleri. */
export type QueryParams = Record<string, unknown> | undefined

/**
 * Tüm veritabanı sürücülerinin uyguladığı ortak arayüz.
 * Her sürücü bir bağlantı havuzu/istemcisi sarmalar.
 */
export interface Driver {
  /** Bağlanmayı dener; başarısızsa hata fırlatır. */
  test(): Promise<void>
  /** SQL çalıştırır ve normalize edilmiş sonuç döndürür. `signal` iptal için. */
  query(sql: string, params?: QueryParams, signal?: AbortSignal): Promise<QueryResult>
  /** Veritabanı tablolarını ve sütunlarını döndürür. */
  introspect(): Promise<SchemaInfo>
  /** Açık kaynakları kapatır. */
  close(): Promise<void>
}

export type DriverFactory = (config: ConnectionConfig) => Driver

/** Varsayılan sorgu zaman aşımı (sn) — büyük veri çekmelerinde erken kesilmeyi önler. */
export const DEFAULT_QUERY_TIMEOUT_SEC = 300

/**
 * Bağlantının sorgu zaman aşımını milisaniyeye çevirir.
 * Tanımsız → varsayılan (300 sn); 0 veya negatif → 0 (sınırsız; sürücü hiç kesmez).
 */
export function resolveTimeoutMs(queryTimeoutSec?: number): number {
  const sec = queryTimeoutSec ?? DEFAULT_QUERY_TIMEOUT_SEC
  return sec <= 0 ? 0 : Math.round(sec * 1000)
}

/**
 * Sütun adı listesi ve satır dizisinden QueryResult oluşturan yardımcı.
 * Sütun adları boş ama satır varsa (bazı sürücüler meta veri vermez, ör. MSSQL),
 * sütunlar ilk satırın anahtarlarından türetilir — böylece alanlar her zaman görünür.
 */
export function buildResult(
  columnNames: string[],
  rows: Record<string, unknown>[],
  elapsedMs: number
): QueryResult {
  let names = columnNames
  if (names.length === 0 && rows.length > 0) {
    names = Object.keys(rows[0])
  }
  return {
    columns: names.map((name) => ({ name })),
    rows,
    rowCount: rows.length,
    elapsedMs
  }
}
