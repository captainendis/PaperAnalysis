/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
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

  it('introspect tabloları ve sütunları döndürür', async () => {
    const driver = createSqliteDriver(config)
    const schema = await driver.introspect()
    const tablo = schema.tables.find((t) => t.name === 'satislar')
    expect(tablo).toBeDefined()
    expect(tablo!.columns.map((c) => c.name)).toEqual(['id', 'kategori', 'tutar'])
    await driver.close()
  })

  it('parametreli sorgu (:param) doğru satırları süzer', async () => {
    const driver = createSqliteDriver(config)
    const res = await driver.query(
      'SELECT * FROM satislar WHERE kategori = :kategori AND tutar > :min',
      { kategori: 'Elektronik', min: 150 }
    )
    expect(res.rowCount).toBe(1)
    expect(res.rows[0].tutar).toBe(250)
    await driver.close()
  })
})
