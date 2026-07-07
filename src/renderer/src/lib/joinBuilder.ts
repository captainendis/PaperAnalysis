import type { DbKind } from '@shared/types'
import { quoteIdent } from './sqlDialect'

export type JoinType = 'inner' | 'left' | 'right' | 'full'
export type FilterOp =
  | '='
  | '<>'
  | '>'
  | '<'
  | '>='
  | '<='
  | 'LIKE'
  | 'IS NULL'
  | 'IS NOT NULL'

export interface TableRef {
  schema?: string
  name: string
}

export interface JoinKey {
  left: string
  right: string
  /** MSSQL'de farklı collation'lı metin sütunlarında COLLATE DATABASE_DEFAULT uygula. */
  collate?: boolean
}

export interface FilterCond {
  table: 'a' | 'b'
  column: string
  op: FilterOp
  value?: string
}

export interface JoinSpec {
  mode: 'join'
  left: TableRef
  right: TableRef
  joinType: JoinType
  keys: JoinKey[]
  /** LEFT JOIN + eşleşmeyenler (B tarafı boş). */
  onlyUnmatched?: boolean
  /** Seçili çıktı sütunları. Boşsa a.* , b.* kullanılır. */
  columns: { table: 'a' | 'b'; column: string }[]
  filters: FilterCond[]
  limit?: number
}

export interface UnionSpec {
  mode: 'union'
  left: TableRef
  right: TableRef
  /** UNION ALL (tekrarlar korunur) vs UNION. */
  all: boolean
  limit?: number
}

const JOIN_KEYWORD: Record<JoinType, string> = {
  inner: 'INNER JOIN',
  left: 'LEFT JOIN',
  right: 'RIGHT JOIN',
  full: 'FULL JOIN'
}

/** Tam nitelikli tablo adı. */
function qualified(kind: DbKind, t: TableRef): string {
  return t.schema
    ? `${quoteIdent(kind, t.schema)}.${quoteIdent(kind, t.name)}`
    : quoteIdent(kind, t.name)
}

/** Bir filtre değerini güvenli biçimde biçimlendirir (sayı tırnaksız, metin tek tırnak). */
function renderValue(value: string): string {
  const trimmed = value.trim()
  if (trimmed !== '' && !Number.isNaN(Number(trimmed))) return trimmed
  return `'${value.replace(/'/g, "''")}'`
}

function renderFilter(kind: DbKind, f: FilterCond): string {
  const col = `${f.table}.${quoteIdent(kind, f.column)}`
  if (f.op === 'IS NULL' || f.op === 'IS NOT NULL') return `${col} ${f.op}`
  return `${col} ${f.op} ${renderValue(f.value ?? '')}`
}

/** İki tabloyu JOIN ile birleştiren SQL üretir. */
export function buildJoinSql(kind: DbKind, spec: JoinSpec): string {
  const joinType: JoinType = spec.onlyUnmatched ? 'left' : spec.joinType

  // Çıktı sütunları — ad çakışmalarında benzersiz alias.
  const cols = spec.columns.length > 0 ? spec.columns : null
  const seen = new Map<string, number>()
  const selectList = cols
    ? cols
        .map(({ table, column }) => {
          const n = (seen.get(column) ?? 0) + 1
          seen.set(column, n)
          const alias = n === 1 ? column : `${column}_${n}`
          return `${table}.${quoteIdent(kind, column)} AS ${quoteIdent(kind, alias)}`
        })
        .join(', ')
    : 'a.*, b.*'

  const top = kind === 'mssql' && spec.limit ? `TOP ${spec.limit} ` : ''
  // MSSQL'de farklı collation'lı metin anahtarlarında karşılaştırmayı ortak
  // collation'a zorla (yalnızca collate işaretli anahtarlarda; sayısal anahtarlarda
  // COLLATE hata verirdi).
  const side = (alias: 'a' | 'b', col: string, collate?: boolean): string => {
    const c = `${alias}.${quoteIdent(kind, col)}`
    return collate && kind === 'mssql' ? `${c} COLLATE DATABASE_DEFAULT` : c
  }
  const on =
    spec.keys.length > 0
      ? spec.keys
          .map((k) => `${side('a', k.left, k.collate)} = ${side('b', k.right, k.collate)}`)
          .join(' AND ')
      : '1 = 1'

  const wheres: string[] = []
  if (spec.onlyUnmatched && spec.keys.length > 0) {
    wheres.push(`b.${quoteIdent(kind, spec.keys[0].right)} IS NULL`)
  }
  for (const f of spec.filters) wheres.push(renderFilter(kind, f))

  let sql = `SELECT ${top}${selectList}\nFROM ${qualified(kind, spec.left)} a\n${JOIN_KEYWORD[joinType]} ${qualified(kind, spec.right)} b ON ${on}`
  if (wheres.length > 0) sql += `\nWHERE ${wheres.join(' AND ')}`
  if (kind !== 'mssql' && spec.limit) sql += `\nLIMIT ${spec.limit}`
  return sql
}

/** İki tabloyu alt alta ekleyen (UNION) SQL üretir. */
export function buildUnionSql(kind: DbKind, spec: UnionSpec): string {
  const op = spec.all ? 'UNION ALL' : 'UNION'
  const union = `SELECT * FROM ${qualified(kind, spec.left)}\n${op}\nSELECT * FROM ${qualified(kind, spec.right)}`
  if (!spec.limit) return union
  if (kind === 'mssql') {
    return `SELECT TOP ${spec.limit} * FROM (\n${union}\n) t`
  }
  return `SELECT * FROM (\n${union}\n) t\nLIMIT ${spec.limit}`
}
