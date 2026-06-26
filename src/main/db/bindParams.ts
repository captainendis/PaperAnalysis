import type { DbKind } from '@shared/types'

/**
 * SQL içindeki `:name` adlandırılmış yer tutucularını sürücüye özgü bağlama
 * söz dizimine dönüştürür ve sıralı değer dizisi üretir. Bağlama, sürücünün
 * native parametre mekanizmasıyla yapıldığından SQL injection riski yoktur.
 *
 * Yer tutucu yalnızca `:` + harf/rakam/alt çizgi olarak eşleşir; tek tırnaklı
 * dizgi literalleri içindeki `:` atlanır (basit tarama).
 */

export interface BoundQuery {
  sql: string
  /** Sıralı değerler (postgres/mysql). */
  values: unknown[]
  /** Adlandırılmış değerler (mssql/sqlite). */
  named: Record<string, unknown>
  /** Kullanılan parametre adları (sırayla). */
  usedNames: string[]
}

const PLACEHOLDER = /:([a-zA-Z_][a-zA-Z0-9_]*)/g

/** Tek tırnaklı dizgi literali içinde olup olmadığını kabaca belirler. */
function scanLiteralMask(sql: string): boolean[] {
  const mask = new Array<boolean>(sql.length).fill(false)
  let inStr = false
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    if (ch === "'") {
      // Kaçışlı '' çiftini tek karakter gibi geç.
      if (inStr && sql[i + 1] === "'") {
        mask[i] = true
        mask[i + 1] = true
        i++
        continue
      }
      inStr = !inStr
    }
    mask[i] = inStr
  }
  return mask
}

export function bindParams(
  sql: string,
  params: Record<string, unknown> | undefined,
  kind: DbKind
): BoundQuery {
  const values: unknown[] = []
  const named: Record<string, unknown> = {}
  const usedNames: string[] = []

  if (!params || Object.keys(params).length === 0) {
    return { sql, values, named, usedNames }
  }

  const mask = scanLiteralMask(sql)

  const replaced = sql.replace(PLACEHOLDER, (match, name: string, offset: number) => {
    // Dizgi literali içindeyse dokunma.
    if (mask[offset]) return match
    // Tanımlı olmayan parametreyi olduğu gibi bırak (ör. mssql `@x` zaten farklı).
    if (!(name in params)) return match

    const value = params[name]
    usedNames.push(name)

    switch (kind) {
      case 'postgres':
        values.push(value)
        return `$${values.length}`
      case 'mysql':
        values.push(value)
        return '?'
      case 'mssql':
        named[name] = value
        return `@${name}`
      case 'sqlite':
        named[name] = value
        return `@${name}`
      default:
        return match
    }
  })

  return { sql: replaced, values, named, usedNames }
}
