import { describe, it, expect, afterAll } from 'vitest'
import { tmpdir } from 'os'
import { join } from 'path'
import { rmSync } from 'fs'
import { createSqliteDriver } from './sqlite'
import { aggregateRows } from '../../../renderer/src/lib/chartSpec'
import type { ConnectionConfig } from '@shared/types'

const dbPath = join(tmpdir(), `pb-test-${process.pid}.sqlite`)
const config: ConnectionConfig = {
  id: 'test',
  name: 'test',
  kind: 'sqlite',
  filePath: dbPath
}

describe('SQLite sürücüsü uçtan uca veri yolu', () => {
  afterAll(() => {
    try {
      rmSync(dbPath)
    } catch {
      /* yoksay */
    }
  })

  it('tablo oluşturur, veri ekler, sorgular ve grafiğe indirger', async () => {
    const driver = createSqliteDriver(config)
    await driver.test()

    await driver.query(
      'CREATE TABLE satislar (id INTEGER PRIMARY KEY, kategori TEXT, tutar REAL)'
    )
    await driver.query(
      "INSERT INTO satislar (kategori, tutar) VALUES ('Elektronik', 100), ('Elektronik', 250), ('Giyim', 80), ('Gıda', 40)"
    )

    const result = await driver.query(
      'SELECT kategori, tutar FROM satislar ORDER BY id'
    )
    expect(result.columns.map((c) => c.name)).toEqual(['kategori', 'tutar'])
    expect(result.rowCount).toBe(4)

    // Grafik boru hattı: kategori bazında toplam tutar.
    const points = aggregateRows(result, {
      type: 'bar',
      dimension: 'kategori',
      measure: 'tutar',
      aggregation: 'sum'
    })
    expect(points).toEqual([
      { category: 'Elektronik', value: 350 },
      { category: 'Giyim', value: 80 },
      { category: 'Gıda', value: 40 }
    ])

    await driver.close()
  })
})
