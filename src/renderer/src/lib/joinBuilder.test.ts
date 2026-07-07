import { describe, it, expect } from 'vitest'
import { buildJoinSql, buildUnionSql, type JoinSpec } from './joinBuilder'

const base: JoinSpec = {
  mode: 'join',
  left: { name: 'stok' },
  right: { name: 'olcu' },
  joinType: 'inner',
  keys: [{ left: 'urun_kodu', right: 'urun_kodu' }],
  columns: [],
  filters: []
}

describe('buildJoinSql', () => {
  it('postgres INNER join + LIMIT üretir', () => {
    const sql = buildJoinSql('postgres', { ...base, limit: 1000 })
    expect(sql).toContain('INNER JOIN "olcu" b ON a."urun_kodu" = b."urun_kodu"')
    expect(sql).toContain('SELECT a.*, b.*')
    expect(sql.trim().endsWith('LIMIT 1000')).toBe(true)
  })

  it('MSSQL TOP kullanır (LIMIT değil)', () => {
    const sql = buildJoinSql('mssql', { ...base, limit: 500 })
    expect(sql).toContain('SELECT TOP 500 ')
    expect(sql).not.toContain('LIMIT')
    expect(sql).toContain('[olcu] b ON a.[urun_kodu] = b.[urun_kodu]')
  })

  it('onlyUnmatched → LEFT JOIN + b.key IS NULL', () => {
    const sql = buildJoinSql('postgres', { ...base, onlyUnmatched: true })
    expect(sql).toContain('LEFT JOIN')
    expect(sql).toContain('WHERE b."urun_kodu" IS NULL')
  })

  it('filtreleri biçimlendirir (sayı, metin, IS NULL, LIKE)', () => {
    const sql = buildJoinSql('postgres', {
      ...base,
      filters: [
        { table: 'a', column: 'stok', op: '>', value: '0' },
        { table: 'a', column: 'ad', op: 'LIKE', value: '%kablo%' },
        { table: 'b', column: 'olcu', op: 'IS NULL' }
      ]
    })
    expect(sql).toContain('a."stok" > 0')
    expect(sql).toContain("a.\"ad\" LIKE '%kablo%'")
    expect(sql).toContain('b."olcu" IS NULL')
  })

  it('filtreleri VEYA (OR) ile birleştirir — null veya 0', () => {
    const sql = buildJoinSql('postgres', {
      ...base,
      filters: [
        { table: 'a', column: 'stok', op: 'IS NULL' },
        { table: 'a', column: 'stok', op: '=', value: '0', connector: 'or' }
      ]
    })
    expect(sql).toContain('WHERE a."stok" IS NULL OR a."stok" = 0')
  })

  it('onlyUnmatched ile OR filtresini parantezle gruplar', () => {
    const sql = buildJoinSql('postgres', {
      ...base,
      onlyUnmatched: true,
      filters: [
        { table: 'a', column: 'stok', op: 'IS NULL' },
        { table: 'a', column: 'stok', op: '=', value: '0', connector: 'or' }
      ]
    })
    expect(sql).toContain('WHERE b."urun_kodu" IS NULL AND (a."stok" IS NULL OR a."stok" = 0)')
  })

  it('değeri boş (yarım) filtreyi yok sayar — yanlış "= \'\'" üretmez', () => {
    const sql = buildJoinSql('postgres', {
      ...base,
      filters: [
        { table: 'a', column: 'stok', op: '=', value: '' }, // yarım → elenmeli
        { table: 'a', column: '', op: '=', value: '5' } // sütunsuz → elenmeli
      ]
    })
    expect(sql).not.toContain('WHERE')
    expect(sql).not.toContain("= ''")
  })

  it('IS NULL değersiz de olsa uygulanır', () => {
    const sql = buildJoinSql('postgres', {
      ...base,
      filters: [{ table: 'a', column: 'olcu', op: 'IS NULL' }]
    })
    expect(sql).toContain('WHERE a."olcu" IS NULL')
  })

  it('VE (AND) varsayılan bağlayıcıdır', () => {
    const sql = buildJoinSql('postgres', {
      ...base,
      filters: [
        { table: 'a', column: 'stok', op: '>', value: '0' },
        { table: 'a', column: 'ad', op: 'IS NOT NULL' }
      ]
    })
    expect(sql).toContain('WHERE a."stok" > 0 AND a."ad" IS NOT NULL')
  })

  it("metindeki tek tırnağı kaçırır", () => {
    const sql = buildJoinSql('postgres', {
      ...base,
      filters: [{ table: 'a', column: 'ad', op: '=', value: "O'Brien" }]
    })
    expect(sql).toContain("a.\"ad\" = 'O''Brien'")
  })

  it('MSSQL: collate işaretli anahtarda COLLATE DATABASE_DEFAULT ekler', () => {
    const sql = buildJoinSql('mssql', {
      ...base,
      keys: [{ left: 'malzemekodu', right: 'malzemekodu', collate: true }]
    })
    expect(sql).toContain(
      'a.[malzemekodu] COLLATE DATABASE_DEFAULT = b.[malzemekodu] COLLATE DATABASE_DEFAULT'
    )
  })

  it('MSSQL: collate işaretsiz (sayısal) anahtarda COLLATE eklemez', () => {
    const sql = buildJoinSql('mssql', {
      ...base,
      keys: [{ left: 'id', right: 'id', collate: false }]
    })
    expect(sql).not.toContain('COLLATE')
    expect(sql).toContain('a.[id] = b.[id]')
  })

  it('COLLATE yalnızca MSSQL için — postgres yok sayar', () => {
    const sql = buildJoinSql('postgres', {
      ...base,
      keys: [{ left: 'malzemekodu', right: 'malzemekodu', collate: true }]
    })
    expect(sql).not.toContain('COLLATE')
    expect(sql).toContain('a."malzemekodu" = b."malzemekodu"')
  })

  it('çakışan sütun adında benzersiz alias verir', () => {
    const sql = buildJoinSql('postgres', {
      ...base,
      columns: [
        { table: 'a', column: 'urun_kodu' },
        { table: 'b', column: 'urun_kodu' }
      ]
    })
    expect(sql).toContain('a."urun_kodu" AS "urun_kodu"')
    expect(sql).toContain('b."urun_kodu" AS "urun_kodu_2"')
  })
})

describe('buildUnionSql', () => {
  it('UNION ALL üretir', () => {
    const sql = buildUnionSql('postgres', {
      mode: 'union',
      left: { name: 'a' },
      right: { name: 'b' },
      all: true
    })
    expect(sql).toContain('UNION ALL')
    expect(sql).toContain('SELECT * FROM "a"')
    expect(sql).toContain('SELECT * FROM "b"')
  })

  it('limit ile MSSQL alt sorguyu TOP ile sarar', () => {
    const sql = buildUnionSql('mssql', {
      mode: 'union',
      left: { name: 'a' },
      right: { name: 'b' },
      all: false,
      limit: 100
    })
    expect(sql).toContain('SELECT TOP 100 * FROM (')
    expect(sql).toContain('UNION\n')
  })
})
