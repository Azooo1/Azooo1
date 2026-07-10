import { WalletConnectChainID, WalletConnectWallet } from '@tronweb3/walletconnect-tron'
import { isTronAddress } from './address'
import { clearTronWalletSession } from './connectedWalletStore'
import { wcProjectId } from './config'
import { createTronWeb, waitForOnChainTronTx } from './tronGrid'
import { canonicalizeWcTransaction } from './wcTronTransaction'
import {
  assertValidSignedTransaction,
  extractWalletErrorMessage,
  isUserRejectedError,
  toWalletSignError,
  walletSign,
  WC_SIGN_TIMEOUT_MS,
} from './tronSign'

const APPROVE_TX_EXPIRY_BUFFER_MS = 10_000

function assertTransactionNotExpired(transaction: object) {
  const expiration = (transaction as { raw_data?: { expiration?: number } }).raw_data?.expiration
  if (typeof expiration === 'number' && Date.now() >= expiration - APPROVE_TX_EXPIRY_BUFFER_MS) {
    throw new Error('approve-transaction-expired')
  }
}

let walletInstance: WalletConnectWallet | null = null

export function isWalletConnectStaleSessionError(err: unknown): boolean {
  const msg = extractWalletErrorMessage(err)
  return /pending session not found|session not found|no matching key|session expired|session_expire|pairing topic doesn't exist|unknown session/i.test(
    msg,
  )
}

/** 仅清理网页侧 WC 记录，不向手机钱包发送 disconnect（避免误踢 TP） */
export function clearWalletConnectLocalSession() {
  clearTronWalletSession()
}

/** 主动断开 WC；notifyWallet=false 时只清本地，不通知手机端 */
export async function invalidateWalletConnectSession(options?: { notifyWallet?: boolean }) {
  const notifyWallet = options?.notifyWallet !== false
  try {
    const wallet = walletInstance
    if (wallet && notifyWallet) {
      await wallet.disconnect().catch(() => {})
    }
  } catch {
    // ignore
  } finally {
    clearTronWalletSession()
  }
}

/** WalletConnect v2 Tron 会话属性（扁平 transaction，非 legacy 嵌套） */
const WC2_TRON_SESSION_PROPERTIES = {
  tron_method_version: 'v1',
} as const


function getWc2OptionalNamespaces() {
  return {
    tron: {
      chains: [WalletConnectChainID.Mainnet],
      methods: ['tron_signTransaction', 'tron_signMessage'],
      events: [] as string[],
    },
  }
}

function isWc2TronSession(session: WcSessionRef | null): boolean {
  // 有 topic 即视为有效 WC v2 会话；TP 等钱包常不回传 tron_method_version
  return !!session?.topic
}

function stripEmptySignature(transaction: object): Record<string, unknown> {
  const tx = JSON.parse(JSON.stringify(transaction)) as Record<string, unknown>
  if (Array.isArray(tx.signature) && tx.signature.length === 0) {
    delete tx.signature
  }
  return tx
}

/**
 * WC v2 / TP 文档均要求：visible=false、hex 地址、txID 与 raw_data_hex 一致。
 * @see https://docs.walletconnect.network/wallet-sdk/chain-support/tron
 * @see https://help.tokenpocket.pro/developer-en/scan-protocol/tron
 */
function prepareWcTransaction(transaction: object, owner: string): Record<string, unknown> {
  return canonicalizeWcTransaction(stripEmptySignature(transaction), owner)
}

function isTpWalletConnectSession(wallet: WalletConnectWallet): boolean {
  const peer = readWalletSession(wallet)?.peer?.metadata?.name
  return !!(peer && /tokenpocket|token pocket/i.test(peer))
}

type WcTronSignFormat = 'legacy' | 'v1'

type WcSignParamOptions = {
  useTronHeader?: boolean
}

function buildTronSignParams(
  transaction: object,
  address: string,
  format: WcTronSignFormat,
  options?: WcSignParamOptions,
): Record<string, unknown> {
  const base =
    format === 'v1'
      ? { address, transaction }
      : { address, transaction: { transaction } }
  return options?.useTronHeader ? { ...base, useTronHeader: true } : base
}

function ensureFlatTronSessionProps(wallet: WalletConnectWallet) {
  const internal = wallet as unknown as { _session?: WcSessionRef }
  if (!internal._session?.topic) return
  internal._session = {
    ...internal._session,
    sessionProperties: {
      ...internal._session.sessionProperties,
      tron_method_version: 'v1',
    },
  }
}

function isSignFormatError(err: unknown): boolean {
  const msg = extractWalletErrorMessage(err)
  return /invalid params|invalid transaction|malformed|unsupported|method not found|parse|decode|format/i.test(msg)
}

async function requestTronSignViaClient(
  wallet: WalletConnectWallet,
  transaction: object,
  address: string,
  format: WcTronSignFormat,
  options?: WcSignParamOptions,
): Promise<unknown> {
  const session = readWalletSession(wallet)
  if (!session?.topic) {
    throw new Error('walletconnect-session-missing')
  }

  const client = wallet.client as unknown as WcClient
  const params = buildTronSignParams(transaction, address, format, options)
  const result = await client.request({
    chainId: WalletConnectChainID.Mainnet,
    topic: session.topic,
    request: {
      method: 'tron_signTransaction',
      params,
    },
  })
  return (result as { result?: unknown })?.result ?? result
}

/**
 * WC v2 扁平 + canonical 交易；TP 额外带 useTronHeader（官方扫码协议同款字段）。
 */
async function requestTronSignTransaction(
  wallet: WalletConnectWallet,
  transaction: Record<string, unknown>,
  address: string,
): Promise<unknown> {
  ensureFlatTronSessionProps(wallet)

  if (isTpWalletConnectSession(wallet)) {
    const attempts: Array<{ format: WcTronSignFormat; useTronHeader: boolean }> = [
      { format: 'v1', useTronHeader: true },
      { format: 'v1', useTronHeader: false },
      { format: 'legacy', useTronHeader: true },
    ]
    let lastErr: unknown = null
    for (const attempt of attempts) {
      try {
        return await requestTronSignViaClient(wallet, transaction, address, attempt.format, {
          useTronHeader: attempt.useTronHeader,
        })
      } catch (err) {
        lastErr = err
        if (!isSignFormatError(err)) throw err
      }
    }
    throw lastErr ?? new Error('walletconnect-sign-failed')
  }

  return wallet.signTransaction(transaction)
}

type WcUniversalProvider = {
  client: WcClient & {
    find: (params: { requiredNamespaces: ReturnType<typeof getWc2OptionalNamespaces> }) => WcSessionRef[]
  }
  connect: (params: {
    pairingTopic?: string
    optionalNamespaces: ReturnType<typeof getWc2OptionalNamespaces>
    sessionProperties: typeof WC2_TRON_SESSION_PROPERTIES
  }) => Promise<unknown>
  once: (event: string, listener: (...args: unknown[]) => void) => void
  off: (event: string, listener: (...args: unknown[]) => void) => void
}

async function getUniversalProvider(wallet: WalletConnectWallet): Promise<WcUniversalProvider> {
  const internal = wallet as unknown as { getProvider: () => Promise<WcUniversalProvider> }
  return internal.getProvider()
}

/** WC v2 连接（带 sessionProperties，自定义二维码） */
async function connectWc2TronWithUri(wallet: WalletConnectWallet, onUri: (uri: string) => void) {
  const provider = await getUniversalProvider(wallet)
  const client = provider.client
  const onDisplayUri = (uri: unknown) => {
    if (typeof uri === 'string' && uri.trim()) onUri(uri.trim())
  }
  provider.once('display_uri', onDisplayUri)
  try {
    const session = (await provider.connect({
      pairingTopic: undefined,
      optionalNamespaces: getWc2OptionalNamespaces(),
      sessionProperties: WC2_TRON_SESSION_PROPERTIES,
    })) as WcSessionRef

    const internal = wallet as unknown as {
      _session?: WcSessionRef
      _client?: WcClient
      address?: string
    }
    if (session?.topic) {
      internal._session = session
      internal._client = client
    }
  } finally {
    provider.off('display_uri', onDisplayUri)
  }

  const status = await wallet.checkConnectStatus()
  if (!status.address?.trim()) {
    throw new Error('walletconnect-connect-failed')
  }
}

async function ensureWc2TronSession(wallet: WalletConnectWallet) {
  await wallet.checkConnectStatus()
  const session = readWalletSession(wallet)
  if (!session?.topic) {
    throw new Error('walletconnect-session-missing')
  }
}

async function signTronTransactionWithWcFormats(
  wallet: WalletConnectWallet,
  transaction: object,
  owner: string,
  options?: {
    onDispatched?: () => void
    abort: { promise: Promise<never> }
    userAbort: { promise: Promise<never> }
  },
): Promise<unknown> {
  await ensureWc2TronSession(wallet)

  const prepared = prepareWcTransaction(transaction, owner)
  const feeLimitSun = (prepared as { raw_data?: { fee_limit?: number } }).raw_data?.fee_limit
  if (typeof feeLimitSun !== 'number' || feeLimitSun < 15_000_000) {
    throw new Error('walletconnect-transaction-fee-limit-missing')
  }
  const txId = (prepared as { txID?: string }).txID
  const rawHex = (prepared as { raw_data_hex?: string }).raw_data_hex
  if (typeof txId !== 'string' || !/^[a-f0-9]{64}$/i.test(txId) || typeof rawHex !== 'string' || !rawHex.trim()) {
    throw new Error('walletconnect-transaction-incomplete')
  }

  const race = <T>(task: Promise<T>) =>
    Promise.race([task, options?.abort.promise ?? new Promise<T>(() => {}), options?.userAbort.promise ?? new Promise<T>(() => {})])

  options?.onDispatched?.()

  return walletSign(race(requestTronSignTransaction(wallet, prepared, owner)), {
    safetyTimeout: true,
    timeoutMs: WC_SIGN_TIMEOUT_MS,
  })
}

/** 扫码签名 UI 等待上限（毫秒） */
export const WC_SIGN_UI_TIMEOUT_MS = 65_000

let abortActiveWalletConnectSign: (() => void) | null = null

/** 用户在网页点「取消」或关闭弹窗时中断 WC 签名等待 */
export function abortWalletConnectSign() {
  abortActiveWalletConnectSign?.()
  abortActiveWalletConnectSign = null
}

function createUserSignAbort(): { promise: Promise<never>; cleanup: () => void } {
  let rejectFn: ((e: Error) => void) | null = null
  let settled = false

  const promise = new Promise<never>((_, reject) => {
    rejectFn = reject
  })

  const abort = () => {
    if (settled) return
    settled = true
    rejectFn?.(new Error('user-rejected'))
  }

  abortActiveWalletConnectSign = abort

  return {
    promise,
    cleanup: () => {
      if (abortActiveWalletConnectSign === abort) {
        abortActiveWalletConnectSign = null
      }
    },
  }
}

export type WcSignOutcome = {
  signed?: Record<string, unknown>
  txId?: string
  alreadyBroadcast?: boolean
}

type WcSessionRef = {
  topic: string
  sessionProperties?: { tron_method_version?: string }
  peer?: { metadata?: { name?: string } }
}

function readWalletSession(wallet: WalletConnectWallet): WcSessionRef | null {
  const internal = wallet as unknown as {
    _session?: WcSessionRef
    address?: string
  }
  if (internal._session?.topic) {
    return internal._session
  }

  try {
    const client = wallet.client
    const sessions = client.find({
      requiredNamespaces: getWc2OptionalNamespaces(),
    }).filter((s) => s.topic)
    return sessions.length ? sessions[sessions.length - 1] : null
  } catch {
    return null
  }
}

type WcClient = {
  on: (event: string, listener: (...args: unknown[]) => void) => void
  off: (event: string, listener: (...args: unknown[]) => void) => void
  request: (args: {
    chainId: string
    topic: string
    request: { method: string; params: Record<string, unknown> }
  }) => Promise<unknown>
  find: (params: { requiredNamespaces: ReturnType<typeof getWc2OptionalNamespaces> }) => WcSessionRef[]
}

function getWalletInstance() {
  if (!wcProjectId) {
    throw new Error('missing-project-id')
  }
  if (!walletInstance) {
    walletInstance = new WalletConnectWallet({
      network: WalletConnectChainID.Mainnet,
      options: {
        relayUrl: 'wss://relay.walletconnect.com',
        projectId: wcProjectId,
        metadata: {
          name: 'HEC Mining',
          description: '云算力挖矿平台',
          url:
            import.meta.env.VITE_WC_APP_URL ||
            (typeof window !== 'undefined' ? window.location.origin : 'https://hecminai.cloud'),
          icons: [
            import.meta.env.VITE_WC_APP_URL
              ? `${import.meta.env.VITE_WC_APP_URL}/favicon.ico`
              : typeof window !== 'undefined'
                ? `${window.location.origin}/favicon.ico`
                : 'https://hecminai.cloud/favicon.ico',
          ],
        },
      },
      themeMode: 'dark',
      allWallets: 'HIDE',
    })
  }
  return walletInstance
}

export async function connectTronViaWalletConnect(options?: {
  onUri?: (uri: string) => void
}): Promise<string> {
  const wallet = getWalletInstance()
  try {
    const status = await wallet.checkConnectStatus()
    const existing = status.address?.trim()
    if (existing && isTronAddress(existing) && isWc2TronSession(readWalletSession(wallet))) {
      return existing
    }
    if (existing) {
      await wallet.disconnect().catch(() => {})
    }
  } catch {
    // 首次连接或旧会话已失效
  }

  if (!options?.onUri) {
    throw new Error('walletconnect-uri-required')
  }

  await connectWc2TronWithUri(wallet, options.onUri)

  const addr = (await wallet.checkConnectStatus()).address?.trim()
  if (!addr || !isTronAddress(addr)) {
    throw new Error('未获取到有效的 TRON 地址')
  }
  if (!readWalletSession(wallet)?.topic) {
    throw new Error('walletconnect-session-missing')
  }
  return addr
}

export async function disconnectTronWalletConnect() {
  if (!wcProjectId) {
    walletInstance = null
    return
  }
  try {
    const wallet = walletInstance ?? getWalletInstance()
    const status = await wallet.checkConnectStatus().catch(() => ({ address: '' }))
    if (status.address) {
      await wallet.disconnect()
    }
  } catch {
    // ignore
  } finally {
    walletInstance = null
  }
}

function withWcTimeout<T>(promise: Promise<T>, timeoutMs: number, code = 'wc-probe-timeout'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error(code)), timeoutMs)
    }),
  ])
}

async function refreshWalletConnectSessionWithTimeout(
  wallet: WalletConnectWallet,
  timeoutMs = 10_000,
): Promise<string> {
  return withWcTimeout(refreshWalletConnectSession(wallet), timeoutMs, 'wc-probe-timeout')
}

async function refreshWalletConnectSession(wallet: WalletConnectWallet) {
  const status = await wallet.checkConnectStatus()
  const address = status.address?.trim()
  if (!address || !isTronAddress(address)) {
    throw new Error('walletconnect-session-missing')
  }
  await ensureWc2TronSession(wallet)
  return address
}

/** 探测 WC 是否仍在线（localStorage 会话丢失时兜底） */
export async function probeWalletConnectAddress(timeoutMs = 10_000): Promise<string | null> {
  if (!wcProjectId) return null
  try {
    const wallet = getWalletInstance()
    return await refreshWalletConnectSessionWithTimeout(wallet, timeoutMs)
  } catch {
    return null
  }
}

export async function getWalletConnectForApprove(expectedOwner: string) {
  const owner = expectedOwner.trim()
  if (!isTronAddress(owner)) {
    throw new Error('请先连接有效的 TRON 钱包')
  }

  const wallet = getWalletInstance()
  const address = await refreshWalletConnectSessionWithTimeout(wallet, 12_000)
  if (address !== owner) {
    throw new Error('钱包地址与当前账号不一致，请重新扫码连接')
  }
  return wallet
}

/** 页面刷新后从 WC 存储恢复会话，避免 topic 与内存单例脱节 */
export async function restoreWalletConnectSession(timeoutMs = 6_000): Promise<string | null> {
  if (!wcProjectId) return null
  try {
    const wallet = getWalletInstance()
    return await refreshWalletConnectSessionWithTimeout(wallet, timeoutMs)
  } catch {
    return null
  }
}

/** 签名前预热中继连接（不 ping，避免 TP 无响应导致误判断开） */
export async function prepareWalletConnectForSign(expectedOwner: string): Promise<WalletConnectWallet> {
  const wallet = await getWalletConnectForApprove(expectedOwner)
  const internal = wallet as unknown as { getProvider?: () => Promise<unknown> }
  if (typeof internal.getProvider === 'function') {
    await withWcTimeout(internal.getProvider(), 8_000, 'wc-probe-timeout')
  }
  await ensureWc2TronSession(wallet)
  return wallet
}

function extractTxId(value: unknown): string | null {
  if (typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value.trim())) {
    return value.trim()
  }
  if (value != null && typeof value === 'object') {
    const o = value as Record<string, unknown>
    for (const key of ['txID', 'txid', 'tx_id', 'hash']) {
      const id = o[key]
      if (typeof id === 'string' && /^[a-f0-9]{64}$/i.test(id.trim())) {
        return id.trim()
      }
    }
  }
  return null
}

/** 兼容 TP / WC 多种签名回包；部分钱包在钱包内已广播，只返回 txId */
export function normalizeSignedTronTransaction(unsigned: object, result: unknown): WcSignOutcome {
  if (result == null || result === false) {
    throw new Error('user-rejected')
  }

  const directId = extractTxId(result)
  if (directId) {
    return { txId: directId, alreadyBroadcast: true }
  }

  let payload = result as Record<string, unknown>
  if (payload.error) {
    throw toWalletSignError(payload.error)
  }
  if (typeof payload.code === 'number' && payload.code >= 4000) {
    throw toWalletSignError(result)
  }
  if (payload.result != null) {
    const nestedId = extractTxId(payload.result)
    if (nestedId && typeof payload.result !== 'object') {
      return { txId: nestedId, alreadyBroadcast: true }
    }
    payload = payload.result as Record<string, unknown>
  }

  if (payload.signedTransaction != null && typeof payload.signedTransaction === 'object') {
    payload = payload.signedTransaction as Record<string, unknown>
  }

  if (typeof payload.signature === 'string' && payload.signature.trim()) {
    payload = { ...payload, signature: [payload.signature.trim()] }
  }

  if (payload.transaction != null && typeof payload.transaction === 'object') {
    const wrapped = payload.transaction as Record<string, unknown>
    payload =
      wrapped.transaction != null && typeof wrapped.transaction === 'object'
        ? (wrapped.transaction as Record<string, unknown>)
        : wrapped
  }

  const txIdOnly = extractTxId(payload)
  if (txIdOnly && !payload.signature && !payload.raw_data && !payload.raw_data_hex) {
    return { txId: txIdOnly, alreadyBroadcast: true }
  }

  assertValidSignedTransaction(payload)

  const u = unsigned as Record<string, unknown>
  const signed = {
    ...u,
    ...payload,
    raw_data: payload.raw_data ?? u.raw_data,
    raw_data_hex: payload.raw_data_hex ?? u.raw_data_hex,
    txID: payload.txID ?? u.txID,
  }

  return { signed: signed as Record<string, unknown> }
}

function watchWalletConnectSignAbort(
  wallet: WalletConnectWallet,
  client: WcClient,
): { promise: Promise<never>; cleanup: () => void } {
  let rejectFn: ((e: Error) => void) | null = null
  let settled = false

  const settle = (err: Error) => {
    if (settled) return
    settled = true
    rejectFn?.(err)
  }

  const promise = new Promise<never>((_, reject) => {
    rejectFn = reject
  })

  const onDelete = () => settle(new Error('walletconnect-session-missing'))

  const onSessionEvent = (event: unknown) => {
    const msg = extractWalletErrorMessage(event)
    if (isUserRejectedError(event) || /reject|cancel|denied|拒绝|取消/i.test(msg)) {
      settle(new Error('user-rejected'))
    }
  }

  client.on('session_delete', onDelete)
  client.on('session_event', onSessionEvent)
  const unsubDisconnect = wallet.on('disconnect', onDelete)

  return {
    promise,
    cleanup: () => {
      client.off('session_delete', onDelete)
      client.off('session_event', onSessionEvent)
      unsubDisconnect?.()
    },
  }
}

async function signTronTransactionDirect(
  wallet: WalletConnectWallet,
  transaction: object,
  owner: string,
  options?: { onDispatched?: () => void },
): Promise<WcSignOutcome> {
  if (!readWalletSession(wallet)?.topic) {
    throw new Error('walletconnect-session-missing')
  }

  assertTransactionNotExpired(transaction)

  const pendingTxId = extractTxId(transaction)
  const tronWeb = createTronWeb(owner)
  const client = wallet.client as unknown as WcClient
  const abort = watchWalletConnectSignAbort(wallet, client)
  const userAbort = createUserSignAbort()

  const signTask = (async (): Promise<{ kind: 'sign'; outcome: WcSignOutcome }> => {
    try {
      const raw = await signTronTransactionWithWcFormats(wallet, transaction, owner, {
        onDispatched: options?.onDispatched,
        abort,
        userAbort,
      })
      return { kind: 'sign', outcome: normalizeSignedTronTransaction(transaction, raw) }
    } finally {
      abort.cleanup()
      userAbort.cleanup()
    }
  })()

  const chainTask = pendingTxId
    ? waitForOnChainTronTx(tronWeb, pendingTxId, WC_SIGN_TIMEOUT_MS).then((txId) => ({
        kind: 'chain' as const,
        txId,
      }))
    : null

  try {
    if (!chainTask) {
      return (await signTask).outcome
    }

    const winner = await Promise.race([signTask, chainTask])
    if (winner.kind === 'chain') {
      return { txId: winner.txId, alreadyBroadcast: true }
    }
    return winner.outcome
  } catch (err) {
    if (isUserRejectedError(err)) throw err
    if (pendingTxId) {
      try {
        const landed = await waitForOnChainTronTx(tronWeb, pendingTxId, 8_000)
        return { txId: landed, alreadyBroadcast: true }
      } catch {
        // 链上仍未出现该 tx
      }
    }
    throw err
  }
}

export async function signTronTransactionViaWalletConnect(
  transaction: object,
  expectedOwner: string,
  options?: { onDispatched?: () => void },
): Promise<WcSignOutcome> {
  const wallet = await prepareWalletConnectForSign(expectedOwner)
  try {
    return await signTronTransactionDirect(wallet, transaction, expectedOwner.trim(), options)
  } catch (err) {
    const msg = extractWalletErrorMessage(err)
    if (
      isWalletConnectStaleSessionError(err) ||
      /no matching key/i.test(msg)
    ) {
      await invalidateWalletConnectSession({ notifyWallet: false })
      throw new Error('walletconnect-session-missing')
    }
    throw toWalletSignError(err)
  }
}
