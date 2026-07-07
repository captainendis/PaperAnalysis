import type { ConnectionConfig, QueryResult, SchemaInfo } from '@shared/types'
import type { Driver, QueryParams } from './drivers/types'
import { createSqliteDriver } from './drivers/sqlite'
import { createPostgresDriver } from './drivers/postgres'
import { createMysqlDriver } from './drivers/mysql'
import { createMssqlDriver } from './drivers/mssql'

function makeDriver(config: ConnectionConfig): Driver {
  switch (config.kind) {
    case 'sqlite':
      return createSqliteDriver(config)
    case 'postgres':
      return createPostgresDriver(config)
    case 'mysql':
      return createMysqlDriver(config)
    case 'mssql':
      return createMssqlDriver(config)
    default:
      throw new Error(`Bilinmeyen veritabanı türü: ${(config as ConnectionConfig).kind}`)
  }
}

/**
 * Aktif sürücüleri bağlantı id'sine göre saklayan kayıt defteri.
 * Aynı bağlantı için havuz tekrar kullanılır.
 */
class ConnectionManager {
  private drivers = new Map<string, Driver>()

  /** Geçici (kaydetmeden) bir bağlantıyı test eder; havuzu hemen kapatır. */
  async testEphemeral(config: ConnectionConfig): Promise<void> {
    const driver = makeDriver(config)
    try {
      await driver.test()
    } finally {
      await driver.close().catch(() => undefined)
    }
  }

  private getDriver(config: ConnectionConfig): Driver {
    let driver = this.drivers.get(config.id)
    if (!driver) {
      driver = makeDriver(config)
      this.drivers.set(config.id, driver)
    }
    return driver
  }

  async run(
    config: ConnectionConfig,
    sql: string,
    params?: QueryParams,
    signal?: AbortSignal
  ): Promise<QueryResult> {
    return this.getDriver(config).query(sql, params, signal)
  }

  async introspect(config: ConnectionConfig): Promise<SchemaInfo> {
    return this.getDriver(config).introspect()
  }

  async closeOne(id: string): Promise<void> {
    const driver = this.drivers.get(id)
    if (driver) {
      await driver.close().catch(() => undefined)
      this.drivers.delete(id)
    }
  }

  async closeAll(): Promise<void> {
    await Promise.all(Array.from(this.drivers.values()).map((d) => d.close().catch(() => undefined)))
    this.drivers.clear()
  }
}

export const connectionManager = new ConnectionManager()
