import type { ChartConfig, Dashboard, DashboardTile } from '@shared/types'
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
 * Örnek `satislar` şemasını hedefleyen "Satış Genel Bakış" panosu.
 * sampleData.ts ile üretilen veritabanıyla birlikte kullanılır.
 */
export function salesOverviewTemplate(connectionId: string): Dashboard {
  const seeds: TileSeed[] = [
    {
      title: 'Toplam Ciro',
      sql: 'SELECT SUM(tutar) AS ciro FROM satislar',
      chart: { type: 'kpi', dimension: null, measure: 'ciro', aggregation: 'sum', title: 'Toplam Ciro' },
      layout: { x: 0, y: 0, w: 3, h: 4 }
    },
    {
      title: 'Toplam Adet',
      sql: 'SELECT SUM(adet) AS adet FROM satislar',
      chart: { type: 'kpi', dimension: null, measure: 'adet', aggregation: 'sum', title: 'Toplam Adet' },
      layout: { x: 3, y: 0, w: 3, h: 4 }
    },
    {
      title: 'Kategoriye Göre Ciro',
      sql: 'SELECT kategori, SUM(tutar) AS ciro FROM satislar GROUP BY kategori ORDER BY ciro DESC',
      chart: {
        type: 'bar',
        dimension: 'kategori',
        measure: 'ciro',
        measures: ['ciro'],
        aggregation: 'sum'
      },
      layout: { x: 6, y: 0, w: 6, h: 8 }
    },
    {
      title: 'Aya Göre Ciro Trendi',
      sql: "SELECT strftime('%Y-%m', tarih) AS ay, SUM(tutar) AS ciro FROM satislar GROUP BY ay ORDER BY ay",
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
      sql: 'SELECT bolge, SUM(tutar) AS ciro FROM satislar GROUP BY bolge ORDER BY ciro DESC',
      chart: { type: 'pie', dimension: 'bolge', measure: 'ciro', aggregation: 'sum' },
      layout: { x: 6, y: 8, w: 6, h: 8 }
    },
    {
      title: 'En Çok Satan Ürünler',
      sql: 'SELECT urun, SUM(adet) AS toplam_adet, SUM(tutar) AS ciro FROM satislar GROUP BY urun ORDER BY ciro DESC LIMIT 10',
      chart: { type: 'table', dimension: null, measure: null, aggregation: 'none' },
      layout: { x: 0, y: 12, w: 6, h: 8 }
    }
  ]

  return {
    version: 1,
    name: 'Satış Genel Bakış',
    tiles: seeds.map((s) => tile(connectionId, s))
  }
}
