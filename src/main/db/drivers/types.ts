import type { ConnectionConfig, QueryResult } from '@shared/types'

/**
 * Tüm veritabanı sürücülerinin uyguladığı ortak arayüz.
 * Her sürücü bir bağlantı havuzu/istemcisi sarmalar.
 */
export interface Driver {
  /** Bağlanmayı dener; başarısızsa hata fırlatır. */
  test(): Promise<void>
  /** SQL çalıştırır ve normalize edilmiş sonuç döndürür. */
  query(sql: string): Promise<QueryResult>
  /** Açık kaynakları kapatır. */
  close(): Promise<void>
}

export type DriverFactory = (config: ConnectionConfig) => Driver

/** Sütun adı listesi ve satır dizisinden QueryResult oluşturan yardımcı. */
export function buildResult(
  columnNames: string[],
  rows: Record<string, unknown>[],
  elapsedMs: number
): QueryResult {
  return {
    columns: columnNames.map((name) => ({ name })),
    rows,
    rowCount: rows.length,
    elapsedMs
  }
}
