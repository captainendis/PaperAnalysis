// Main ve renderer süreçleri arasında paylaşılan tip tanımları.

export type DbKind = 'mssql' | 'postgres' | 'mysql' | 'sqlite'

/** Kullanıcının girdiği bağlantı ayarları (parola dahil). */
export interface ConnectionConfig {
  id: string
  name: string
  kind: DbKind
  host?: string
  port?: number
  user?: string
  password?: string
  database?: string
  /** SQLite için dosya yolu. */
  filePath?: string
  /** TLS/SSL kullanılsın mı (mssql/postgres/mysql). */
  ssl?: boolean
}

/** Renderer'a gönderilen, parolası çıkarılmış bağlantı özeti. */
export type SafeConnection = Omit<ConnectionConfig, 'password'> & {
  hasPassword: boolean
}

export interface QueryColumn {
  name: string
}

export interface QueryResult {
  columns: QueryColumn[]
  rows: Record<string, unknown>[]
  rowCount: number
  /** ms cinsinden süre. */
  elapsedMs: number
}

export interface IpcOk<T> {
  ok: true
  data: T
}

export interface IpcErr {
  ok: false
  error: string
}

export type IpcResult<T> = IpcOk<T> | IpcErr

// ---- Grafik & pano modelleri ----

export type ChartType = 'bar' | 'line' | 'pie'
export type Aggregation = 'none' | 'sum' | 'avg' | 'count' | 'min' | 'max'

export interface ChartConfig {
  type: ChartType
  /** Kategori / X ekseni alanı (sütun adı). */
  dimension: string | null
  /** Değer / Y ekseni alanı (sütun adı). */
  measure: string | null
  aggregation: Aggregation
  title?: string
}

export interface DashboardTile {
  id: string
  title: string
  connectionId: string | null
  sql: string
  chart: ChartConfig
  /** react-grid-layout konumu. */
  layout: { x: number; y: number; w: number; h: number }
}

export interface Dashboard {
  version: 1
  name: string
  tiles: DashboardTile[]
}

export const DEFAULT_PORTS: Record<DbKind, number | undefined> = {
  mssql: 1433,
  postgres: 5432,
  mysql: 3306,
  sqlite: undefined
}
