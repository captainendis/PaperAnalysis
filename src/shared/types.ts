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

// ---- Şema (introspection) modelleri ----

export interface ColumnInfo {
  name: string
  type: string
}

export interface TableInfo {
  name: string
  /** Şema adı (postgres/mssql); sqlite/mysql için opsiyonel. */
  schema?: string
  columns: ColumnInfo[]
}

export interface SchemaInfo {
  tables: TableInfo[]
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

export type ChartType =
  | 'bar'
  | 'line'
  | 'area'
  | 'scatter'
  | 'stackedBar'
  | 'pie'
  | 'kpi'
  | 'table'
export type Aggregation = 'none' | 'sum' | 'avg' | 'count' | 'min' | 'max'

export interface ChartConfig {
  type: ChartType
  /** Kategori / X ekseni alanı (sütun adı). */
  dimension: string | null
  /** Değer / Y ekseni alanı (tekil ölçü; geriye dönük uyum). */
  measure: string | null
  /** Çoklu seri için ölçü listesi. Doluysa `measure` yerine bu kullanılır. */
  measures?: string[]
  /** Scatter için sayısal X ekseni alanı. */
  xMeasure?: string | null
  aggregation: Aggregation
  title?: string
  /** Bu grafiğe tıklanınca ayarlanacak pano parametresi (çapraz filtre). */
  crossFilterParam?: string | null
  /** Drill-down seviyeleri (sıralı boyut sütunları). Örn: ['kategori','urun']. */
  drillLevels?: string[]
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

export type ParamType = 'text' | 'number' | 'date'

/** Pano genelinde tile SQL'lerinde `:name` ile referans verilen parametre. */
export interface DashboardParameter {
  name: string
  label: string
  type: ParamType
  value: string
}

export interface Dashboard {
  version: 1
  name: string
  tiles: DashboardTile[]
  /** Pano genel parametreleri (filtre çubuğu). */
  parameters?: DashboardParameter[]
  /** Otomatik yenileme aralığı (saniye); 0 / tanımsız = kapalı. */
  refreshIntervalSec?: number
}

/** LAN yayın durumu. */
export interface PublishStatus {
  active: boolean
  url: string | null
  port: number | null
}

/** Zamanlanmış rapor durumu. */
export interface ReportStatus {
  active: boolean
  folder: string
  intervalMinutes: number
  baseName: string
  lastAt: number | null
  lastFile: string | null
}

export const DEFAULT_PORTS: Record<DbKind, number | undefined> = {
  mssql: 1433,
  postgres: 5432,
  mysql: 3306,
  sqlite: undefined
}
