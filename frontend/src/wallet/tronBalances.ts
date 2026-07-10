import { createTronWeb, dedupeTronGrid, tronGridFetch } from './tronGrid'

/** TRON 主网 USDT (TRC20) 合约 */
export const TRON_USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'

export interface TronBalances {
  trx: number
  usdt: number
}

const BALANCE_FETCH_TIMEOUT_MS = 20_000

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms)
    }),
  ])
}

function parseUsdtFromTrc20(trc20: unknown): number {
  if (!trc20) return 0
  if (Array.isArray(trc20)) {
    for (const item of trc20) {
      if (!item || typeof item !== 'object') continue
      for (const [contract, raw] of Object.entries(item as Record<string, string>)) {
        if (contract === TRON_USDT_CONTRACT) {
          return Number(raw) / 1e6
        }
      }
    }
    return 0
  }
  if (typeof trc20 === 'object') {
    const raw = (trc20 as Record<string, string>)[TRON_USDT_CONTRACT]
    if (raw != null) return Number(raw) / 1e6
  }
  return 0
}

async function fetchViaTronGridRest(address: string): Promise<TronBalances> {
  const res = await tronGridFetch(`/v1/accounts/${address}`)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (/allowed_rps|rate of/i.test(body)) {
      throw new Error('TronGrid 请求过于频繁，请稍后重试')
    }
    throw new Error('TronGrid 请求失败')
  }
  const json = (await res.json()) as { data?: Array<{ balance?: number; trc20?: unknown }> }
  const account = json.data?.[0]
  if (!account) {
    return { trx: 0, usdt: 0 }
  }
  return {
    trx: Number(account.balance || 0) / 1e6,
    usdt: parseUsdtFromTrc20(account.trc20),
  }
}

/** 通过 TronGrid JSON-RPC 读链上余额，不依赖浏览器注入的 tronWeb（WC 扫码时注入钱包常会挂死） */
async function fetchViaTronWebRpc(address: string): Promise<TronBalances> {
  const tronWeb = createTronWeb(address)
  const contract = await tronWeb.contract().at(TRON_USDT_CONTRACT)
  const [trxSun, usdtRaw] = await Promise.all([
    tronWeb.trx.getBalance(address),
    contract.balanceOf(address).call(),
  ])
  return {
    trx: Number(trxSun) / 1e6,
    usdt: Number(usdtRaw) / 1e6,
  }
}

export async function fetchTronBalances(address: string): Promise<TronBalances> {
  return withTimeout(
    dedupeTronGrid(`account:${address}`, async () => {
      // 优先 REST，避免 contract().at → getcontract 触发 429
      try {
        return await fetchViaTronGridRest(address)
      } catch {
        return fetchViaTronWebRpc(address)
      }
    }),
    BALANCE_FETCH_TIMEOUT_MS,
    'balance-timeout',
  )
}

export async function fetchTrxBalance(address: string): Promise<number> {
  const balances = await fetchTronBalances(address)
  return balances.trx
}

export interface TronAccountResources {
  /** 可用能量（质押能量 − 已用） */
  energyAvailable: number
  /** 可用免费带宽 */
  freeNetAvailable: number
}

/** USDT approve 约需 32k–65k 能量；无能量时需烧 TRX（通常 10–20 TRX） */
export const APPROVE_MIN_TRX = 10
export const APPROVE_MIN_ENERGY = 32_000

export async function fetchTronAccountResources(address: string): Promise<TronAccountResources> {
  const res = await tronGridFetch('/wallet/getaccountresource', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, visible: true }),
  })
  const json = (await res.json()) as {
    EnergyLimit?: number
    EnergyUsed?: number
    freeNetLimit?: number
    freeNetUsed?: number
    NetLimit?: number
    NetUsed?: number
  }
  const energyLimit = Number(json.EnergyLimit || 0)
  const energyUsed = Number(json.EnergyUsed || 0)
  const freeNetLimit = Number(json.freeNetLimit || 0) + Number(json.NetLimit || 0)
  const freeNetUsed = Number(json.freeNetUsed || 0) + Number(json.NetUsed || 0)
  return {
    energyAvailable: Math.max(0, energyLimit - energyUsed),
    freeNetAvailable: Math.max(0, freeNetLimit - freeNetUsed),
  }
}

export function canAffordApprove(trx: number, energyAvailable: number): boolean {
  return trx >= APPROVE_MIN_TRX || energyAvailable >= APPROVE_MIN_ENERGY
}

/** 无链上 estimate 时，按能量余额给出 USDT approve 烧 TRX 区间（用于 WC 扫码页展示） */
export function estimateApproveFeeTrxRange(energyAvailable: number): { minTrx: number; maxTrx: number } {
  if (energyAvailable >= 65_000) return { minTrx: 0.5, maxTrx: 2 }
  if (energyAvailable >= 32_000) return { minTrx: 5, maxTrx: 15 }
  return { minTrx: 14, maxTrx: 27 }
}
