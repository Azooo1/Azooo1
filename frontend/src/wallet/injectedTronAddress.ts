import { isTronAddress } from './address'
import type { TronWalletId } from './tronProviders'

/** 读取 TP / TronLink 当前注入的 TRON 地址（切换账户后会变化） */
export function readActiveInjectedTronAddress(): string | null {
  const candidates = [
    window.tokenpocket?.tronWeb?.defaultAddress?.base58,
    window.tronWeb?.defaultAddress?.base58,
  ]
  for (const raw of candidates) {
    const addr = typeof raw === 'string' ? raw.trim() : ''
    if (addr && isTronAddress(addr)) return addr
  }
  return null
}

export function resolveInjectedWalletIdForAddress(address: string): TronWalletId {
  const addr = address.trim()
  const tpAddr = window.tokenpocket?.tronWeb?.defaultAddress?.base58?.trim()
  if (tpAddr === addr && window.tokenpocket?.tron?.request) return 'tokenpocket'
  if (window.tronLink?.request) return 'tronlink'
  if (window.tokenpocket?.tron?.request) return 'tokenpocket'
  return 'tokenpocket'
}

/** TronLink / TP 账户切换时常见的 postMessage action */
export function isTronAccountChangeMessage(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const payload = (data as { message?: unknown }).message ?? data
  if (!payload || typeof payload !== 'object') return false
  const action = String((payload as { action?: string }).action ?? '')
  return action === 'setAccount' || action === 'accountsChanged' || action === 'disconnectWeb'
}
