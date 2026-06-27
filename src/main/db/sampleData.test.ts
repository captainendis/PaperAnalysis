import { describe, it, expect, afterAll } from 'vitest'
import { tmpdir } from 'os'
import { join } from 'path'
import { rmSync } from 'fs'
import { createSampleDatabase } from './sampleData'
import { createSqliteDriver } from './drivers/sqlite'
import { aggregateRows, computeKpi } from '../../renderer/src/lib/chartSpec'

const dbPath = join(tmpdir(), `pb-sample-${process.pid}.sqlite`)

describe('createSampleDatabase', () => {
  afterAll(() => {
    try {
      rmSync(dbPath)
    } catch {
      /* yoksay */
    }
  })

  it('örnek veritabanını oluşturur ve beklenen satır sayısına sahiptir', () => {
    const res = createSampleDatabase(dbPath)
    expect(res.filePath).toBe(dbPath)
    expect(res.rowCount).toBe(400)
  })

  it('deterministiktir (tekrar üretimde aynı toplam)', async () => {
    createSampleDatabase(dbPath)
    const driver = createSqliteDriver({ id: 's', name: 's', kind: 'sqlite', filePath: dbPath })
    const r1 = await driver.query('SELECT SUM(tutar) AS toplam FROM satislar')
    await driver.close()

    createSampleDatabase(dbPath)
    const driver2 = createSqliteDriver({ id: 's', name: 's', kind: 'sqlite', filePath: dbPath })
    const r2 = await driver2.query('SELECT SUM(tutar) AS toplam FROM satislar')
    await driver2.close()

    expect(r1.rows[0].toplam).toBe(r2.rows[0].toplam)
    expect(Number(r1.rows[0].toplam)).toBeGreaterThan(0)
  })

  it('şablon sorgusu grafiğe indirgenebilir (uçtan uca)', async () => {
    createSampleDatabase(dbPath)
    const driver = createSqliteDriver({ id: 's', name: 's', kind: 'sqlite', filePath: dbPath })

    const bar = await driver.query(
      'SELECT kategori, SUM(tutar) AS ciro FROM satislar GROUP BY kategori ORDER BY ciro DESC'
    )
    const points = aggregateRows(bar, {
      type: 'bar',
      dimension: 'kategori',
      measure: 'ciro',
      aggregation: 'sum'
    })
    expect(points.length).toBeGreaterThan(0)
    expect(points.every((p) => p.value > 0)).toBe(true)

    const kpiRes = await driver.query('SELECT SUM(tutar) AS ciro FROM satislar')
    const kpi = computeKpi(kpiRes, {
      type: 'kpi',
      dimension: null,
      measure: 'ciro',
      aggregation: 'sum'
    })
    expect(kpi).toBeGreaterThan(0)

    await driver.close()
  })
})
