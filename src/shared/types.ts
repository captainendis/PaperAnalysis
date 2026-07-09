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
  /** Sorgu zaman aşımı (saniye). 0 = sınırsız; tanımsız = varsayılan (300 sn). */
  queryTimeoutSec?: number
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

/** Tablo grafiğine gömülü ayarlar (Düzenle panelinden yapılandırılır, panoyla kaydedilir). */
export interface TableSumColumn {
  id: string
  name: string
  /** Toplanacak kaynak sütun adları. */
  cols: string[]
}

/** Bir sütunun sayı/para/yüzde/tarih biçimi. */
export type ColumnFormatKind = 'auto' | 'number' | 'currency' | 'percent' | 'date'

export interface ColumnFormat {
  kind: ColumnFormatKind
  /** Ondalık basamak (number/currency/percent). */
  decimals?: number
  /** Binlik ayraç (number). */
  thousands?: boolean
  /** Para birimi kodu (currency): 'TRY' | 'USD' | 'EUR' vb. */
  currency?: string
}

/** Koşullu biçimlendirme kuralı (eşleşen hücreye renk uygular). */
export interface ConditionalRule {
  id: string
  column: string
  op: '>' | '<' | '>=' | '<=' | '=' | '<>' | 'contains'
  value: string
  /** Uygulanacak renk (hex). */
  color: string
  /** 'text' = yazı rengi, 'bg' = arka plan. Varsayılan 'text'. */
  mode?: 'text' | 'bg'
}

export interface TableConfig {
  /** Bu sütundaki tekrarlayan değerlere sahip satırları tek satırda birleştir (grupla). */
  groupBy?: string
  /** Ek gruplama sütunları (bileşik/koşullu gruplama): yalnızca groupBy + bu sütunların tümü aynı olan satırlar birleşir (ör. kod + birim aynı). */
  groupByExtra?: string[]
  /** Tekrarlayan değerleri birleştirme açık mı (varsayılan true). false ise groupBy seçili olsa da birleştirilmez. */
  groupEnabled?: boolean
  /** Gruplarken sayısal sütunlar toplansın mı (varsayılan true). false ise toplanmaz. */
  groupSum?: boolean
  /** Toplama açıkken bu sütunlar toplama dışı tutulur (sayısal olsa da ilk değer korunur). */
  groupSumExclude?: string[]
  /** Gruplarken bu sütunların grup içindeki farklı değerleri ", " ile listelenir (ör. barkod → "barkod1, barkod2"). */
  groupConcat?: string[]
  /** Gizlenecek sütun adları. */
  hiddenColumns?: string[]
  /** Sütun görüntüleme sırası (sütun kimlikleri: temel sütun adı ya da toplam sütunu id'si). Listede olmayanlar sona eklenir. */
  columnOrder?: string[]
  /** Alt toplam satırı göster (sayısal sütunların toplamı). */
  showTotals?: boolean
  /** Satır bazında toplam veren (hesaplanan) ekstra sütunlar. */
  sumColumns?: TableSumColumn[]
  /** Sütun adı → biçim (sayı/para/yüzde/tarih). */
  columnFormats?: Record<string, ColumnFormat>
  /** Koşullu renklendirme kuralları. */
  conditionalRules?: ConditionalRule[]
}

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
  /** Tablo türü için gömülü ayarlar (sütun gizleme, alt toplam, toplam sütunları). */
  tableConfig?: TableConfig
  /** Bu grafiğe özel tema (aydınlık/koyu). Tanımsızsa pano/genel tema kullanılır. */
  theme?: 'dark' | 'light'
  /** Bu grafiğe özel renk paleti. Tanımsızsa pano/genel palet kullanılır. */
  palette?: string
  /** Grafik üzerinde veri etiketlerini (değerleri) göster. */
  showValues?: boolean
  /** Lejant (seri açıklaması) konumu. 'hidden' gizler; tanımsız = otomatik (çoklu seride üstte, pastada altta). */
  legendPosition?: 'top' | 'bottom' | 'hidden'
  /** Y ekseni başlığı (bar/çizgi/alan/saçılım). */
  yAxisTitle?: string
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
  /** Panoya özel tema (aydınlık/koyu). Tanımsızsa uygulama genel teması kullanılır. */
  theme?: 'dark' | 'light'
  /** Panoya özel grafik renk paleti. Tanımsızsa genel palet kullanılır. */
  palette?: string
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
