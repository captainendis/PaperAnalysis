import { ipcMain } from 'electron'
import { createServer, type Server } from 'http'
import { networkInterfaces } from 'os'
import { CH } from '@shared/channels'
import type { IpcResult, PublishStatus } from '@shared/types'
import { pickLanIp } from '../net/lanIp'

let server: Server | null = null
let currentHtml = ''
let currentPort = 0
let currentIp = '127.0.0.1'

function statusOf(): PublishStatus {
  return server
    ? { active: true, url: `http://${currentIp}:${currentPort}`, port: currentPort }
    : { active: false, url: null, port: null }
}

export function stopPublishServer(): void {
  if (server) {
    server.close()
    server = null
  }
}

/** İstenen porttan başlayıp müsait olanı bulana kadar (10 deneme) dinler. */
function startListening(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    let attempt = 0
    const tryPort = (p: number): void => {
      const s = createServer((req, res) => {
        if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'text/plain' })
          res.end('ok')
          return
        }
        if (req.method === 'GET' && (req.url === '/' || (req.url ?? '').startsWith('/?'))) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(currentHtml)
          return
        }
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('Not found')
      })
      s.on('error', (e: NodeJS.ErrnoException) => {
        if (e.code === 'EADDRINUSE' && attempt < 9) {
          attempt++
          tryPort(p + 1)
        } else {
          reject(e)
        }
      })
      s.listen(p, () => {
        server = s
        currentPort = p
        resolve(p)
      })
    }
    tryPort(startPort)
  })
}

export function registerPublishIpc(): void {
  ipcMain.handle(
    CH.publishStart,
    async (
      _e,
      payload: { html: string; port: number }
    ): Promise<IpcResult<PublishStatus>> => {
      try {
        stopPublishServer()
        currentHtml = payload.html
        currentIp = pickLanIp(networkInterfaces())
        await startListening(payload.port > 0 ? payload.port : 8080)
        return { ok: true, data: statusOf() }
      } catch (err) {
        stopPublishServer()
        return { ok: false, error: (err as Error).message }
      }
    }
  )

  ipcMain.handle(
    CH.publishRepublish,
    async (_e, payload: { html: string }): Promise<IpcResult<PublishStatus>> => {
      if (!server) return { ok: false, error: 'Yayın aktif değil.' }
      currentHtml = payload.html
      return { ok: true, data: statusOf() }
    }
  )

  ipcMain.handle(CH.publishStop, async (): Promise<IpcResult<PublishStatus>> => {
    stopPublishServer()
    return { ok: true, data: statusOf() }
  })

  ipcMain.handle(CH.publishStatus, async (): Promise<IpcResult<PublishStatus>> => {
    return { ok: true, data: statusOf() }
  })
}
