import type { ChartConfig, Dashboard, DashboardParameter, DashboardTile } from '@shared/types'
import { uid } from './serialize'

interface TileSeed {
  title: string
  sql: string
  chart: ChartConfig
  layout: { x: number; y: number; w: number; h: number }
}

function tile(connectionId: string, seed: TileSeed): DashboardTile {
  return {
    id: uid('tile'),
    title: seed.title,
    connectionId,
    sql: seed.sql,
    chart: seed.chart,
    layout: seed.layout
  }
}

/**
 * Verilen parametreler için koruyucu WHERE koşulu üretir. Parametre boş/null
 * iken tüm satırlar döner; değer atandığında o kolona göre süzülür.
 * Örn: guard(['kategori']) → "WHERE (:kategori IS NULL OR kategori = :kategori)"
 */
function guard(cols: string[]): string {
  const parts = cols.map((c) => `(:${c} IS NULL OR ${c} = :${c})`)
  return `WHERE ${parts.join(' AND ')}`
}

/**
 * Örnek `satislar` şemasını hedefleyen "Satış Genel Bakış" panosu.
 * Çapraz filtreye hazırdır: kategori bar'ına tıklamak `kategori` parametresini,
 * bölge pastasına tıklamak `bolge` parametresini ayarlar; diğer grafikler süzülür.
 */
export function salesOverviewTemplate(connectionId: string): Dashboard {
  const parameters: DashboardParameter[] = [
    { name: 'kategori', label: 'Kategori', type: 'text', value: '' },
    { name: 'bolge', label: 'Bölge', type: 'text', value: '' }
  ]

  const seeds: TileSeed[] = [
    {
      title: 'Toplam Ciro',
      sql: `SELECT SUM(tutar) AS ciro FROM satislar ${guard(['kategori', 'bolge'])}`,
      chart: { type: 'kpi', dimension: null, measure: 'ciro', aggregation: 'sum', title: 'Toplam Ciro' },
      layout: { x: 0, y: 0, w: 3, h: 4 }
    },
    {
      title: 'Toplam Adet',
      sql: `SELECT SUM(adet) AS adet FROM satislar ${guard(['kategori', 'bolge'])}`,
      chart: { type: 'kpi', dimension: null, measure: 'adet', aggregation: 'sum', title: 'Toplam Adet' },
      layout: { x: 3, y: 0, w: 3, h: 4 }
    },
    {
      title: 'Kategoriye Göre Ciro',
      // Kendi boyutuna (kategori) göre süzülmez; yalnızca bölge filtresine tabidir.
      sql: `SELECT kategori, SUM(tutar) AS ciro FROM satislar ${guard(['bolge'])} GROUP BY kategori ORDER BY ciro DESC`,
      chart: {
        type: 'bar',
        dimension: 'kategori',
        measure: 'ciro',
        measures: ['ciro'],
        aggregation: 'sum',
        crossFilterParam: 'kategori'
      },
      layout: { x: 6, y: 0, w: 6, h: 8 }
    },
    {
      title: 'Aya Göre Ciro Trendi',
      sql: `SELECT strftime('%Y-%m', tarih) AS ay, SUM(tutar) AS ciro FROM satislar ${guard(['kategori', 'bolge'])} GROUP BY ay ORDER BY ay`,
      chart: {
        type: 'line',
        dimension: 'ay',
        measure: 'ciro',
        measures: ['ciro'],
        aggregation: 'sum'
      },
      layout: { x: 0, y: 4, w: 6, h: 8 }
    },
    {
      title: 'Bölgeye Göre Dağılım',
      // Kendi boyutuna (bolge) göre süzülmez; yalnızca kategori filtresine tabidir.
      sql: `SELECT bolge, SUM(tutar) AS ciro FROM satislar ${guard(['kategori'])} GROUP BY bolge ORDER BY ciro DESC`,
      chart: {
        type: 'pie',
        dimension: 'bolge',
        measure: 'ciro',
        aggregation: 'sum',
        crossFilterParam: 'bolge'
      },
      layout: { x: 6, y: 8, w: 6, h: 8 }
    },
    {
      title: 'En Çok Satan Ürünler',
      sql: `SELECT urun, SUM(adet) AS toplam_adet, SUM(tutar) AS ciro FROM satislar ${guard(['kategori', 'bolge'])} GROUP BY urun ORDER BY ciro DESC LIMIT 10`,
      chart: { type: 'table', dimension: null, measure: null, aggregation: 'none' },
      layout: { x: 0, y: 12, w: 6, h: 8 }
    }
  ]

  return {
    version: 1,
    name: 'Satış Genel Bakış',
    parameters,
    tiles: seeds.map((s) => tile(connectionId, s))
  }
}
