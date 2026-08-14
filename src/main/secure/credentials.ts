/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import { app, safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import type { ConnectionConfig } from '@shared/types'

/**
 * Bağlantıları userData dizininde JSON olarak saklar. Parolalar
 * Electron safeStorage (OS keychain destekli) ile şifrelenir; şifreleme
 * kullanılamıyorsa parola diske yazılmaz.
 */

interface StoredConnection extends Omit<ConnectionConfig, 'password'> {
  /** base64 kodlanmış şifreli parola. */
  encPassword?: string
}

function storePath(): string {
  return join(app.getPath('userData'), 'connections.json')
}

function readStore(): StoredConnection[] {
  const path = storePath()
  if (!existsSync(path)) return []
  try {
    const raw = readFileSync(path, 'utf-8')
    return JSON.parse(raw) as StoredConnection[]
  } catch {
    return []
  }
}

function writeStore(items: StoredConnection[]): void {
  const path = storePath()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(items, null, 2), 'utf-8')
}

function encrypt(password?: string): string | undefined {
  if (!password) return undefined
  if (!safeStorage.isEncryptionAvailable()) return undefined
  return safeStorage.encryptString(password).toString('base64')
}

function decrypt(encPassword?: string): string | undefined {
  if (!encPassword) return undefined
  if (!safeStorage.isEncryptionAvailable()) return undefined
  try {
    return safeStorage.decryptString(Buffer.from(encPassword, 'base64'))
  } catch {
    return undefined
  }
}

export const credentialStore = {
  /** Tüm bağlantıları parolalarıyla (decrypt edilmiş) döndürür - sadece main içi kullanım. */
  listFull(): ConnectionConfig[] {
    return readStore().map(({ encPassword, ...rest }) => ({
      ...rest,
      password: decrypt(encPassword)
    }))
  },

  getFull(id: string): ConnectionConfig | undefined {
    return this.listFull().find((c) => c.id === id)
  },

  save(config: ConnectionConfig): void {
    const items = readStore()
    const { password, ...rest } = config
    const stored: StoredConnection = { ...rest, encPassword: encrypt(password) }
    const idx = items.findIndex((c) => c.id === config.id)
    if (idx >= 0) items[idx] = stored
    else items.push(stored)
    writeStore(items)
  },

  delete(id: string): void {
    writeStore(readStore().filter((c) => c.id !== id))
  }
}
