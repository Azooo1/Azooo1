import { isEvmAddress } from './address'

export interface TronWalletSession {
  walletId: 'walletconnect' | 'tokenpocket' | 'tronlink' | 'metamask'
  address: string
}

/** 钱包连接成功（插件 / 扫码） */
export const WALLET_CONNECTED_EVENT = 'hec:wallet-connected'

/** 钱包断开（顶部地址应立即清空） */
export const WALLET_DISCONNECTED_EVENT = 'hec:wallet-disconnected'

const DISCONNECTED_KEY = 'hec_wallet_manual_disconnect'
const PENDING_APPROVE_KEY = 'hec_pending_approve_check'
const LAST_NOTIFIED_WALLET_KEY = 'hec_last_notified_wallet'

function normalizeWalletAddress(address: string): string {
  return address.trim().toLowerCase()
}

export function setPendingApproveCheck(address: string) {
  const addr = address.trim()
  if (!addr) return
  sessionStorage.setItem(PENDING_APPROVE_KEY, addr)
}

/** 登录后补跑：登录页先连钱包、后登录时 AppLayout 挂载后消费 */
export function consumePendingApproveCheck(): string | null {
  const addr = sessionStorage.getItem(PENDING_APPROVE_KEY)?.trim()
  if (addr) sessionStorage.removeItem(PENDING_APPROVE_KEY)
  return addr || null
}

export function clearPendingApproveCheck() {
  sessionStorage.removeItem(PENDING_APPROVE_KEY)
  sessionStorage.removeItem(LAST_NOTIFIED_WALLET_KEY)
}

export function notifyWalletDisconnected() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(WALLET_DISCONNECTED_EVENT))
}

export function notifyWalletConnected(address: string) {
  const addr = address.trim()
  if (!addr || typeof window === 'undefined') return
  const normalized = normalizeWalletAddress(addr)
  const last = sessionStorage.getItem(LAST_NOTIFIED_WALLET_KEY)
  if (last === normalized) return
  sessionStorage.setItem(LAST_NOTIFIED_WALLET_KEY, normalized)
  setPendingApproveCheck(addr)
  window.dispatchEvent(new CustomEvent(WALLET_CONNECTED_EVENT, { detail: { address: addr } }))
}

export function clearWalletNotifyCache() {
  sessionStorage.removeItem(LAST_NOTIFIED_WALLET_KEY)
}

/** 用户主动断开钱包后，禁止自动从插件恢复地址 */
export function markWalletManuallyDisconnected() {
  sessionStorage.setItem(DISCONNECTED_KEY, '1')
}

export function clearWalletManuallyDisconnected() {
  sessionStorage.removeItem(DISCONNECTED_KEY)
}

export function isWalletManuallyDisconnected() {
  return sessionStorage.getItem(DISCONNECTED_KEY) === '1'
}

/** 授权/展示时使用的链上地址：优先 wagmi 当前地址 */
export function resolveConnectedOwner(
  displayOwner: string | null | undefined,
  liveAddress?: string | null,
): string | null {
  if (isWalletManuallyDisconnected()) return null

  const live = liveAddress?.trim()
  if (live && isEvmAddress(live)) return live

  const owner = displayOwner?.trim()
  return owner && isEvmAddress(owner) ? owner : null
}

/** @deprecated ETH 迁移后恒为 false，保留兼容旧引用 */
export function isWalletConnectSession() {
  return false
}

/** @deprecated ETH 迁移后不再使用 TRON 会话缓存 */
export function getTronWalletSession(_expectedOwner?: string | null): TronWalletSession | null {
  return null
}

/** @deprecated */
export function saveTronWalletSession(_walletId: unknown, _address: string) {}

/** @deprecated */
export function clearTronWalletSession() {}
