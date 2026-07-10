import { MetaMaskAdapter } from '@metamask/connect-tron'
import { WalletReadyState } from '@tronweb3/tronwallet-abstract-adapter'
import { isTronAddress } from './address'
import { disconnectTronWalletConnect } from './tronWalletConnect'

export type TronWalletId = 'metamask' | 'tokenpocket' | 'tronlink' | 'walletconnect'

export interface TronWalletOption {
  id: TronWalletId
  name: string
}

let metaMaskAdapter: MetaMaskAdapter | null = null

function getMetaMaskAdapter() {
  if (!metaMaskAdapter) {
    metaMaskAdapter = new MetaMaskAdapter()
  }
  return metaMaskAdapter
}

function isMetaMaskInstalled(): boolean {
  const eth = window.ethereum as { isMetaMask?: boolean; isTokenPocket?: boolean } | undefined
  return !!eth?.isMetaMask && !eth?.isTokenPocket
}

function isTokenPocketInstalled(): boolean {
  return !!window.tokenpocket?.tron?.request
}

/** TokenPocket 内置 DApp 浏览器（UA 含 TokenPocket 或已注入 tp.tron） */
export function isTokenPocketInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false
  if (window.tokenpocket?.tron?.request) {
    const ua = navigator.userAgent || ''
    if (/TokenPocket/i.test(ua)) return true
    // 部分 TP 版本 UA 不含 TokenPocket，但仅有 tp 注入且无桌面插件特征
    if (!window.tronLink?.request && !!window.tokenpocket?.tronWeb) return true
  }
  return false
}

function isTronLinkInstalled(): boolean {
  // TP 内置浏览器也会注入 tronWeb，勿误判为 TronLink
  if (isTokenPocketInAppBrowser()) return false
  return !!(window.tronLink?.request || window.tronWeb)
}

/** 检测已安装且支持 TRON 的钱包（TronLink / TP 优先，MetaMask 需支持 TRON） */
export function detectTronWallets(): TronWalletOption[] {
  if (isTokenPocketInAppBrowser()) {
    return [{ id: 'tokenpocket', name: 'TokenPocket' }]
  }

  const wallets: TronWalletOption[] = []

  if (isTronLinkInstalled()) {
    wallets.push({ id: 'tronlink', name: 'TronLink' })
  }
  if (isTokenPocketInstalled()) {
    wallets.push({ id: 'tokenpocket', name: 'TokenPocket' })
  }
  if (isMetaMaskInstalled()) {
    wallets.push({ id: 'metamask', name: 'MetaMask' })
  }

  return wallets
}

export function hasTronWallet(): boolean {
  return detectTronWallets().length > 0
}

/** 等待 TronLink / TP 注入（它们往往比 MetaMask 慢） */
export async function detectTronWalletsWithRetry(maxWaitMs = 2000): Promise<TronWalletOption[]> {
  const deadline = Date.now() + maxWaitMs
  let wallets = detectTronWallets()

  while (Date.now() < deadline) {
    const hasNativeTron = wallets.some((w) => w.id === 'tronlink' || w.id === 'tokenpocket')
    if (hasNativeTron || wallets.length === 0) {
      return wallets
    }
    // 暂时只检测到 MetaMask，再等一等 TronLink / TP
    await new Promise((resolve) => setTimeout(resolve, 120))
    wallets = detectTronWallets()
  }

  return wallets
}

async function waitForTronWebReady(timeoutMs = 8000): Promise<void> {
  const start = Date.now()
  await new Promise<void>((resolve, reject) => {
    const tick = () => {
      const tronWeb = window.tronWeb
      if (tronWeb?.ready && tronWeb.defaultAddress?.base58) {
        resolve()
        return
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('TRON 钱包初始化超时，请刷新页面后重试'))
        return
      }
      setTimeout(tick, 150)
    }
    tick()
  })
}

async function readTronWebAddress(): Promise<string> {
  await waitForTronWebReady()
  const address = window.tronWeb?.defaultAddress?.base58?.trim()
  if (!address || !isTronAddress(address)) {
    throw new Error('未获取到有效的 TRON 地址，请解锁钱包并切换到 TRON 网络')
  }
  return address
}

async function connectTokenPocket(): Promise<string> {
  const tron = window.tokenpocket?.tron
  if (!tron?.request) {
    throw new Error('未检测到 TokenPocket TRON 模块')
  }

  try {
    await tron.request({ method: 'tron_requestAccounts' })
  } catch {
    // 部分 TP 版本仅支持 eth_requestAccounts
  }

  const accounts = (await tron.request({ method: 'eth_requestAccounts' })) as string[]
  const address = accounts?.[0]?.trim()
  if (address && isTronAddress(address)) {
    return address
  }

  const viaTpWeb = window.tokenpocket?.tronWeb?.defaultAddress?.base58?.trim()
  if (viaTpWeb && isTronAddress(viaTpWeb)) {
    return viaTpWeb
  }

  return readTronWebAddress()
}

/** 等待 TP / TronLink 注入 tronWeb（TP 常无 ready 标志，但有 defaultAddress 即可签名） */
export async function waitForWalletTronWeb(
  walletId: 'tokenpocket' | 'tronlink',
  owner: string,
  timeoutMs = 12000,
): Promise<NonNullable<Window['tronWeb']>> {
  const ownerAddr = owner.trim()
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const candidates =
      walletId === 'tokenpocket'
        ? [window.tokenpocket?.tronWeb, window.tronWeb]
        : [window.tronWeb, window.tokenpocket?.tronWeb]

    for (const tw of candidates) {
      if (!tw) continue
      const addr = tw.defaultAddress?.base58?.trim()
      if (addr && addr === ownerAddr) {
        return tw
      }
    }

    for (const tw of candidates) {
      if (!tw) continue
      const addr = tw.defaultAddress?.base58?.trim()
      if (tw.ready || (addr && isTronAddress(addr))) {
        return tw
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  throw new Error(
    walletId === 'tokenpocket'
      ? 'TokenPocket TRON 未就绪，请解锁插件并切换到 TRON 网络后重试'
      : 'TronLink 未就绪，请解锁钱包后重试',
  )
}

async function connectTronLink(): Promise<string> {
  if (!window.tronLink && !window.tronWeb) {
    throw new Error('未检测到 TronLink')
  }

  if (window.tronLink?.request) {
    let res = await window.tronLink.request({ method: 'tron_requestAccounts' })
    if (res.code !== 200) {
      res = await window.tronLink.request({ method: 'eth_requestAccounts' })
    }
    if (res.code !== 200) {
      throw new Error(res.message || 'TRON 钱包连接被拒绝')
    }
  }

  return readTronWebAddress()
}

async function waitForMetaMaskAdapterReady(adapter: MetaMaskAdapter, timeoutMs = 6000): Promise<void> {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (adapter.readyState === WalletReadyState.Found) return
    if (adapter.readyState === WalletReadyState.NotFound) {
      throw new Error('未检测到支持 TRON 的 MetaMask，请更新至最新版并在钱包内启用 TRON 网络')
    }
    await new Promise((resolve) => setTimeout(resolve, 80))
  }

  throw new Error('MetaMask TRON 模块初始化超时，请刷新页面后重试')
}

async function connectMetaMask(): Promise<string> {
  const adapter = getMetaMaskAdapter()
  await waitForMetaMaskAdapterReady(adapter)
  await adapter.connect()
  const address = adapter.address?.trim()
  if (!address || !isTronAddress(address)) {
    throw new Error('MetaMask 未返回有效的 TRON 地址，请在 MetaMask 中切换到 TRON 网络并授权连接')
  }
  return address
}

export async function connectTronWalletById(id: TronWalletId): Promise<string> {
  switch (id) {
    case 'metamask':
      return connectMetaMask()
    case 'tokenpocket':
      return connectTokenPocket()
    case 'tronlink':
      return connectTronLink()
    default:
      throw new Error('不支持的钱包类型')
  }
}

/** 自动连接：仅一种钱包时直连，多种时由调用方展示选择 */
export async function connectTronWalletAuto(): Promise<
  { type: 'connected'; address: string } | { type: 'pick'; wallets: TronWalletOption[] }
> {
  const wallets = await detectTronWalletsWithRetry()
  if (wallets.length === 0) {
    throw new Error('no-tron-wallet')
  }
  if (wallets.length === 1) {
    const address = await connectTronWalletById(wallets[0].id)
    return { type: 'connected', address }
  }
  return { type: 'pick', wallets }
}

/** 断开浏览器插件与 WalletConnect 会话，避免点「连接」时静默恢复旧地址 */
export async function disconnectBrowserTronWallets() {
  const tronLink = window.tronLink as TronLinkInstance & { disconnect?: () => Promise<void> }
  if (typeof tronLink?.disconnect === 'function') {
    try {
      await tronLink.disconnect()
    } catch {
      // ignore
    }
  }

  const tp = window.tokenpocket as TokenPocketInstance & {
    tron?: { disconnect?: () => Promise<void> }
  }
  if (typeof tp?.tron?.disconnect === 'function') {
    try {
      await tp.tron.disconnect()
    } catch {
      // ignore
    }
  }

  await disconnectTronWalletConnect()
}
