import { TronWeb } from 'tronweb'
import { isTronAddress } from './address'

export const TRONGRID_HOST =
  (import.meta.env.VITE_TRONGRID_HOST as string | undefined)?.trim() || 'https://api.trongrid.io'

export const tronGridApiKey = (import.meta.env.VITE_TRONGRID_API_KEY as string | undefined)?.trim() || ''

export function tronGridHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  if (tronGridApiKey) {
    headers['TRON-PRO-API-KEY'] = tronGridApiKey
  }
  return headers
}

/** 无 API Key 时 TronGrid 公开接口约 1 RPS */
const PUBLIC_MIN_INTERVAL_MS = 1100

let lastTronGridRequestAt = 0
let queueTail: Promise<void> = Promise.resolve()

function scheduleTronGrid<T>(fn: () => Promise<T>): Promise<T> {
  if (tronGridApiKey) return fn()

  const run = async () => {
    const now = Date.now()
    const wait = Math.max(0, PUBLIC_MIN_INTERVAL_MS - (now - lastTronGridRequestAt))
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait))
    }
    lastTronGridRequestAt = Date.now()
    return fn()
  }

  const task = queueTail.then(run, run)
  queueTail = task.then(
    () => undefined,
    () => undefined,
  )
  return task
}

const inflight = new Map<string, Promise<unknown>>()

export function dedupeTronGrid<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>
  const promise = scheduleTronGrid(fn).finally(() => {
    inflight.delete(key)
  })
  inflight.set(key, promise)
  return promise
}

export async function tronGridFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = path.startsWith('http') ? path : `${TRONGRID_HOST}${path}`
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 20_000)
  try {
    return await scheduleTronGrid(() =>
      fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          ...tronGridHeaders(),
          ...(init?.headers as Record<string, string> | undefined),
        },
      }),
    )
  } finally {
    window.clearTimeout(timer)
  }
}

export function createTronWeb(owner?: string) {
  const tronWeb = new TronWeb({
    fullHost: TRONGRID_HOST,
    headers: tronGridHeaders(),
  })
  const addr = owner?.trim()
  if (addr && isTronAddress(addr)) {
    tronWeb.setAddress(addr)
  }
  return tronWeb
}

/** TP 扫码 WC 常已广播但不回包：用未签名 txID 轮询链上是否已落地 */
export async function waitForOnChainTronTx(
  tronWeb: ReturnType<typeof createTronWeb>,
  txId: string,
  timeoutMs = 120_000,
): Promise<string> {
  const id = txId.trim().toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(id)) {
    throw new Error('invalid-txid')
  }

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const info = (await tronWeb.trx.getTransactionInfo(id)) as {
        id?: string
        blockNumber?: number
      } | null
      if (info?.id || (info?.blockNumber != null && info.blockNumber > 0)) {
        return id
      }
    } catch {
      // 尚未上链
    }

    try {
      const tx = (await tronWeb.trx.getTransaction(id)) as {
        signature?: string[]
        ret?: unknown[]
      } | null
      if (tx?.signature?.length) {
        return id
      }
    } catch {
      // 交易池暂无
    }

    await new Promise((r) => setTimeout(r, 2500))
  }

  throw new Error('approve-timeout')
}
