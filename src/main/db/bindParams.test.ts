import { describe, it, expect } from 'vitest'
import { bindParams } from './bindParams'

describe('bindParams', () => {
  const params = { kategori: 'Elektronik', min: 100 }

  it('postgres: :name → $1,$2 ve sıralı değerler', () => {
    const out = bindParams(
      'SELECT * FROM t WHERE k = :kategori AND v > :min',
      params,
      'postgres'
    )
    expect(out.sql).toBe('SELECT * FROM t WHERE k = $1 AND v > $2')
    expect(out.values).toEqual(['Elektronik', 100])
  })

  it('mysql: :name → ? ve sıralı değerler', () => {
    const out = bindParams('SELECT * FROM t WHERE k = :kategori', params, 'mysql')
    expect(out.sql).toBe('SELECT * FROM t WHERE k = ?')
    expect(out.values).toEqual(['Elektronik'])
  })

  it('mssql: :name → @name ve adlandırılmış değerler', () => {
    const out = bindParams('SELECT * FROM t WHERE v > :min', params, 'mssql')
    expect(out.sql).toBe('SELECT * FROM t WHERE v > @min')
    expect(out.named).toEqual({ min: 100 })
  })

  it('sqlite: :name → @name ve adlandırılmış değerler', () => {
    const out = bindParams('SELECT * FROM t WHERE k = :kategori', params, 'sqlite')
    expect(out.sql).toBe('SELECT * FROM t WHERE k = @kategori')
    expect(out.named).toEqual({ kategori: 'Elektronik' })
  })

  it('dizgi literali içindeki :içerik dokunulmaz', () => {
    const out = bindParams(
      "SELECT 'saat 10:00' AS s WHERE k = :kategori",
      params,
      'postgres'
    )
    expect(out.sql).toBe("SELECT 'saat 10:00' AS s WHERE k = $1")
    expect(out.values).toEqual(['Elektronik'])
  })

  it('parametre yoksa SQL değişmeden döner', () => {
    const out = bindParams('SELECT 1', undefined, 'postgres')
    expect(out.sql).toBe('SELECT 1')
    expect(out.values).toEqual([])
  })

  it('tanımsız parametre adı olduğu gibi bırakılır', () => {
    const out = bindParams('WHERE a = :bilinmeyen', { x: 1 }, 'mysql')
    expect(out.sql).toBe('WHERE a = :bilinmeyen')
    expect(out.values).toEqual([])
  })
})
