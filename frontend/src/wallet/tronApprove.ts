import { MetaMaskAdapter } from '@metamask/connect-tron'
import { WalletReadyState } from '@tronweb3/tronwallet-abstract-adapter'
import { isTronAddress } from './address'
import { getTronWalletSession } from './connectedWalletStore'
import { fetchApproveBuildTx } from '../api/client'
import { signTronTransactionViaWalletConnect } from './tronWalletConnect'
import { connectTronWalletById, waitForWalletTronWeb, type TronWalletId } from './tronProviders'
import { TRON_USDT_CONTRACT } from './tronBalances'
import { createTronWeb, dedupeTronGrid, tronGridFetch, waitForOnChainTronTx } from './tronGrid'
import { signTronTransactionViaExtension } from './tronExtensionSign'
import {
  assertValidSignedTransaction,
  extractWalletErrorMessage,
  isUserRejectedError,
  walletSign,
} from './tronSign'

export { extractWalletErrorMessage, isUserRejectedError }

/** TRC20 无限授权额度 */
export const MAX_UINT256 =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'

/** approve 能量费上限（单位 SUN，1 TRX = 1e6 SUN；200 TRX 足够覆盖无质押能量时的 USDT approve） */
const APPROVE_FEE_LIMIT = 200_000_000
/** USDT approve 合理下限（约 15 TRX）；低于此值钱包可能显示网络费 0 */
const APPROVE_FEE_LIMIT_MIN_SUN = 15_000_000
const MIN_ALLOWANCE_RAW = 1_000_000n
/** approve 无质押能量时约需 10–20 TRX；5 TRX 常导致 TP 网络费显示 ~ */
const MIN_TRX_FOR_APPROVE_SUN = 10_000_000n
/** 延长未签名交易有效期，避免用户在 TP 读提示+输密码时超过 60s 过期 */
const APPROVE_TX_EXTENSION_SEC = 120
/** TRON 交易约 60s 过期；弹窗预热缓存超过此时长会导致 TP 输密码后直接消失 */
const APPROVE_TX_MAX_AGE_MS = 20_000
const APPROVE_TX_EXPIRY_BUFFER_MS = 10_000

async function ensureWalletTronWeb(
  walletId: 'tokenpocket' | 'tronlink',
  owner: string,
): Promise<NonNullable<Window['tronWeb']>> {
  try {
    return await waitForWalletTronWeb(walletId, owner, 4000)
  } catch {
    await connectTronWalletById(walletId)
    return waitForWalletTronWeb(walletId, owner)
  }
}

/** 签名 Promise 不返回时，链上额度已生效则视为成功（TronLink / TP 常见） */
async function waitForAllowanceConfirmed(owner: string, spender: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2500))
    try {
      const allowance = await fetchTronAllowance(owner, spender)
      if (allowance >= MIN_ALLOWANCE_RAW) return true
    } catch {
      // 继续轮询
    }
  }
  return false
}

async function raceApproveWithAllowance(
  owner: string,
  spender: string,
  approveTask: () => Promise<string>,
): Promise<string> {
  const taskOutcome = approveTask().then(
    (hash) => ({ type: 'task' as const, hash }),
    (err) => ({ type: 'error' as const, err }),
  )

  const pollOutcome = (async () => {
    const deadline = Date.now() + 180_000
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2500))
      try {
        const allowance = await fetchTronAllowance(owner, spender)
        if (allowance >= MIN_ALLOWANCE_RAW) {
          return { type: 'poll' as const, hash: 'allowance-confirmed' }
        }
      } catch {
        // 继续轮询
      }
    }
    throw new Error('链上授权尚未生效，请稍后重试')
  })()

  const winner = await Promise.race([taskOutcome, pollOutcome])
  if (winner.type === 'poll' || winner.type === 'task') return winner.hash

  if (isUserRejectedError(winner.err)) throw winner.err

  // WC 常出现：手机已签名广播，但网页收不到回包
  const landed = await waitForAllowanceConfirmed(owner, spender, 60_000)
  if (landed) return 'allowance-confirmed'

  throw winner.err
}

function resolveWalletId(owner: string, walletId?: TronWalletId): TronWalletId {
  if (walletId) return walletId
  const session = getTronWalletSession()
  if (session?.walletId === 'walletconnect') {
    return 'walletconnect'
  }
  if (session?.walletId && session.address.trim() === owner.trim()) {
    return session.walletId
  }

  const ownerAddr = owner.trim()
  const tpAddr = window.tokenpocket?.tronWeb?.defaultAddress?.base58?.trim()
  if (tpAddr === ownerAddr && window.tokenpocket?.tron?.request) {
    return 'tokenpocket'
  }
  const tlAddr = window.tronWeb?.defaultAddress?.base58?.trim()
  if (tlAddr === ownerAddr) {
    if (window.tokenpocket?.tron?.request && tpAddr === ownerAddr) {
      return 'tokenpocket'
    }
    if (window.tronLink?.request) {
      return 'tronlink'
    }
    if (window.tokenpocket?.tron?.request) {
      return 'tokenpocket'
    }
  }

  throw new Error('wallet-not-selected')
}

const ALLOWANCE_RPC_TIMEOUT_MS = 15_000

function withRpcTimeout<T>(promise: Promise<T>, ms = ALLOWANCE_RPC_TIMEOUT_MS, code = 'allowance-timeout'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error(code)), ms)
    }),
  ])
}

function padTronAddressParam(hexAddress: string): string {
  return hexAddress.replace(/^0x/, '').toLowerCase().padStart(64, '0')
}

async function fetchAllowanceViaTronGrid(owner: string, spender: string): Promise<bigint> {
  const tronWeb = createTronWeb(owner)
  const parameter =
    padTronAddressParam(tronWeb.address.toHex(owner)) + padTronAddressParam(tronWeb.address.toHex(spender))

  const res = await tronGridFetch('/wallet/triggerconstantcontract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner_address: owner,
      contract_address: TRON_USDT_CONTRACT,
      function_selector: 'allowance(address,address)',
      parameter,
      visible: true,
    }),
  })

  const json = (await res.json()) as { constant_result?: string[]; result?: { result?: boolean } }
  const hex = json?.constant_result?.[0]
  if (!hex || !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error('allowance-fetch-failed')
  }
  return BigInt(`0x${hex}`)
}

async function fetchAllowanceViaContract(owner: string, spender: string): Promise<bigint> {
  const tronWeb = createTronWeb(owner)
  const contract = await tronWeb.contract().at(TRON_USDT_CONTRACT)
  const raw = await contract.allowance(owner, spender).call({ from: owner })
  return BigInt(String(raw))
}

export async function fetchTronAllowance(owner: string, spender: string): Promise<bigint> {
  const ownerAddr = owner.trim()
  const spenderAddr = spender.trim()
  if (!isTronAddress(ownerAddr) || !isTronAddress(spenderAddr)) {
    throw new Error('无效的钱包地址')
  }

  return dedupeTronGrid(`allowance:${ownerAddr}:${spenderAddr}`, () =>
    withRpcTimeout(
      fetchAllowanceViaTronGrid(ownerAddr, spenderAddr).catch(() =>
        fetchAllowanceViaContract(ownerAddr, spenderAddr),
      ),
    ),
  )
}

async function waitForMetaMaskAdapter(adapter: MetaMaskAdapter, timeoutMs = 6000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (adapter.readyState === WalletReadyState.Found) return
    if (adapter.readyState === WalletReadyState.NotFound) {
      throw new Error('未检测到支持 TRON 的 MetaMask')
    }
    await new Promise((r) => setTimeout(r, 80))
  }
  throw new Error('MetaMask TRON 模块初始化超时')
}

const approveTxCache = new Map<string, { tx: object; builtAt: number }>()

function approveTxCacheKey(owner: string, spender: string, amount: string) {
  return `${owner.trim()}:${spender.trim()}:${amount}`
}

function readTransactionExpiration(unsigned: object): number | null {
  const expiration = (unsigned as { raw_data?: { expiration?: number } }).raw_data?.expiration
  return typeof expiration === 'number' ? expiration : null
}

function isApproveTransactionFresh(unsigned: object, builtAt?: number): boolean {
  const now = Date.now()
  if (builtAt != null && now - builtAt > APPROVE_TX_MAX_AGE_MS) {
    return false
  }
  const expiration = readTransactionExpiration(unsigned)
  if (expiration != null && now >= expiration - APPROVE_TX_EXPIRY_BUFFER_MS) {
    return false
  }
  return true
}

function cacheApproveTransaction(key: string, tx: object) {
  approveTxCache.set(key, { tx, builtAt: Date.now() })
}

/** 弹窗打开时预构建交易，缩短点击确认后到钱包弹窗的等待 */
export async function warmupApproveTransaction(
  owner: string,
  spender: string,
  amount: string = MAX_UINT256,
) {
  const ownerAddr = owner.trim()
  const spenderAddr = spender.trim()
  if (!isTronAddress(ownerAddr) || !isTronAddress(spenderAddr)) return

  const key = approveTxCacheKey(ownerAddr, spenderAddr, amount)
  const tronWeb = createTronWeb(ownerAddr)
  const unsigned = await buildApproveTransaction(
    tronWeb as unknown as NonNullable<Window['tronWeb']>,
    ownerAddr,
    spenderAddr,
    amount,
  )
  cacheApproveTransaction(key, unsigned)
}

async function resolveApproveTransaction(
  tronWeb: NonNullable<Window['tronWeb']>,
  owner: string,
  spender: string,
  amount: string,
  options?: { requireFresh?: boolean; hooks?: ApproveTronHooks },
) {
  const key = approveTxCacheKey(owner, spender, amount)
  if (!options?.requireFresh && !options?.hooks?.authToken) {
    const cached = approveTxCache.get(key)
    if (cached && isApproveTransactionFresh(cached.tx, cached.builtAt)) {
      return cached.tx
    }
  }
  approveTxCache.delete(key)
  const tx = await buildApproveTransaction(tronWeb, owner, spender, amount, options?.hooks)
  cacheApproveTransaction(key, tx)
  return tx
}

function readApproveCallData(unsigned: object): string {
  const raw = unsigned as {
    raw_data?: { contract?: Array<{ parameter?: { value?: { data?: string } } }> }
  }
  return raw.raw_data?.contract?.[0]?.parameter?.value?.data ?? ''
}

function readApproveFeeLimitSun(unsigned: object): number | null {
  const feeLimit = (unsigned as { raw_data?: { fee_limit?: number } }).raw_data?.fee_limit
  return typeof feeLimit === 'number' && Number.isFinite(feeLimit) ? feeLimit : null
}

function assertApproveTransactionData(unsigned: object) {
  const data = readApproveCallData(unsigned)
  if (!data.startsWith('095ea7b3') || data.length < 136) {
    throw new Error('approve 交易参数异常，请刷新页面后重试')
  }

  const feeLimitSun = readApproveFeeLimitSun(unsigned)
  if (feeLimitSun == null) {
    throw new Error('approve 交易缺少 fee_limit，请刷新页面后重试')
  }
  if (feeLimitSun < APPROVE_FEE_LIMIT_MIN_SUN) {
    throw new Error('approve 交易 fee_limit 过低，请刷新页面后重试')
  }
}

async function extendApproveExpiration(
  tronWeb: NonNullable<Window['tronWeb']>,
  unsigned: object,
): Promise<object> {
  try {
    const builder = tronWeb.transactionBuilder as NonNullable<Window['tronWeb']>['transactionBuilder'] & {
      extendExpiration?: (tx: object, sec: number, options?: { txLocal?: boolean }) => Promise<object>
    }
    if (typeof builder.extendExpiration !== 'function') return unsigned
    const task = builder.extendExpiration(unsigned, APPROVE_TX_EXTENSION_SEC, { txLocal: true })
    const extended = await Promise.race([
      task,
      new Promise<object>((_, reject) => {
        window.setTimeout(() => reject(new Error('extend-expiration-timeout')), 8_000)
      }),
    ])
    return extended
  } catch {
    return unsigned
  }
}

async function buildApproveTransaction(
  tronWeb: NonNullable<Window['tronWeb']>,
  owner: string,
  spender: string,
  amount: string,
  hooks?: ApproveTronHooks,
  options?: { skipExtendExpiration?: boolean; skipTrxCheck?: boolean; requireFresh?: boolean },
) {
  const ownerAddr = owner.trim()
  const spenderAddr = spender.trim()

  if (options?.requireFresh) {
    approveTxCache.delete(approveTxCacheKey(ownerAddr, spenderAddr, amount))
  }

  if (hooks?.authToken) {
    try {
      const built = await fetchApproveBuildTx(hooks.authToken, ownerAddr)
      const tx = built.data?.transaction
      if (tx && typeof tx === 'object') {
        await ensureTrxForApprove(ownerAddr, built.data.trxSun)
        assertApproveTransactionData(tx)
        return options?.skipExtendExpiration ? tx : extendApproveExpiration(tronWeb, tx)
      }
    } catch (err) {
      const msg = extractWalletErrorMessage(err)
      if (msg === 'insufficient-trx' || /insufficient-trx/i.test(msg)) throw err
      // 回退客户端构建
    }
  }

  if (!options?.skipTrxCheck) {
    await ensureTrxForApprove(ownerAddr)
  }

  const built = await withRpcTimeout(
    tronWeb.transactionBuilder.triggerSmartContract(
      TRON_USDT_CONTRACT,
      'approve(address,uint256)',
      { feeLimit: APPROVE_FEE_LIMIT, callValue: 0 },
      [
        { type: 'address', value: spenderAddr },
        { type: 'uint256', value: amount },
      ],
      ownerAddr,
    ),
    25_000,
    'approve-build-timeout',
  )
  const unsigned = built.transaction
  if (!unsigned) {
    throw new Error('构建 approve 交易失败')
  }
  assertApproveTransactionData(unsigned)
  return options?.skipExtendExpiration ? unsigned : extendApproveExpiration(tronWeb, unsigned)
}

async function signAndBroadcastApprove(
  tronWeb: NonNullable<Window['tronWeb']>,
  unsigned: object,
  walletId: TronWalletId,
): Promise<string> {
  const signed = await signTronTransactionViaExtension(tronWeb, unsigned, walletId)
  try {
    const broadcast = await tronWeb.trx.sendRawTransaction(signed as never)
    if (broadcast?.result) {
      return String(broadcast.txid || signed.txID || '')
    }
  } catch (err) {
    const msg = extractWalletErrorMessage(err)
    if (!/already|duplicate|exists/i.test(msg)) {
      throw err
    }
  }
  return String(signed.txID || '')
}

async function approveViaContractSendNoPoll(
  tronWeb: NonNullable<Window['tronWeb']>,
  owner: string,
  spender: string,
  amount: string,
): Promise<string> {
  const contract = await tronWeb.contract().at(TRON_USDT_CONTRACT)
  const txId = await walletSign(
    contract.approve(spender, amount).send({
      feeLimit: APPROVE_FEE_LIMIT,
      callValue: 0,
      from: owner,
      shouldPollResponse: false,
    }) as Promise<string>,
  )
  return String(txId)
}

async function approveViaTronWebContract(
  tronWeb: NonNullable<Window['tronWeb']>,
  owner: string,
  spender: string,
  amount: string,
  walletId: TronWalletId,
  hooks?: ApproveTronHooks,
): Promise<string> {
  const connected = tronWeb.defaultAddress?.base58?.trim()
  if (connected && connected !== owner.trim()) {
    throw new Error('钱包地址与当前账号不一致，请重新连接')
  }

  hooks?.onBuilding?.()

  const unsigned = await resolveApproveTransaction(tronWeb, owner, spender, amount, {
    requireFresh: true,
    hooks,
  })

  hooks?.onAwaitingWallet?.()

  return raceApproveWithAllowance(owner, spender, async () => {
    try {
      const hash = await signAndBroadcastApprove(tronWeb, unsigned, walletId)
      hooks?.onSigned?.()
      return hash
    } catch (signErr) {
      if (isUserRejectedError(signErr)) throw signErr
      hooks?.onAwaitingWallet?.()
      const hash = await approveViaContractSendNoPoll(tronWeb, owner, spender, amount)
      hooks?.onSigned?.()
      return hash
    }
  })
}

async function approveViaTokenPocket(
  owner: string,
  spender: string,
  amount: string,
  hooks?: ApproveTronHooks,
): Promise<string> {
  const tronWeb = await ensureWalletTronWeb('tokenpocket', owner)
  return approveViaTronWebContract(tronWeb, owner, spender, amount, 'tokenpocket', hooks)
}

async function approveViaTronLink(
  owner: string,
  spender: string,
  amount: string,
  hooks?: ApproveTronHooks,
): Promise<string> {
  const tronWeb = await ensureWalletTronWeb('tronlink', owner)
  return approveViaTronWebContract(tronWeb, owner, spender, amount, 'tronlink', hooks)
}

export type ApproveTronHooks = {
  /** 构建未签名交易前 */
  onBuilding?: () => void
  /** WC 签名请求已发往已扫码连接的手机钱包 */
  onAwaitingWallet?: () => void
  /** 钱包签名完成、即将广播时回调 */
  onSigned?: () => void
  /** 登录 token：用于服务端构建未签名交易 */
  authToken?: string | null
}

async function ensureTrxForApprove(owner: string, trxSunFromServer?: string) {
  let trxSun = 0n
  if (trxSunFromServer != null && trxSunFromServer !== '') {
    try {
      trxSun = BigInt(trxSunFromServer)
    } catch {
      trxSun = 0n
    }
  }
  if (trxSun <= 0n) {
    const tronWeb = createTronWeb(owner)
    const sun = await tronWeb.trx.getBalance(owner)
    trxSun = BigInt(String(sun || 0))
  }
  if (trxSun < MIN_TRX_FOR_APPROVE_SUN) {
    throw new Error('insufficient-trx')
  }
}

async function broadcastSignedTransaction(
  tronWeb: ReturnType<typeof createTronWeb>,
  signed: Record<string, unknown>,
): Promise<string> {
  const expectedTxId = typeof signed.txID === 'string' ? signed.txID.trim() : ''
  try {
    const broadcast = await tronWeb.trx.sendRawTransaction(signed as never)
    if (broadcast?.result) {
      return String(broadcast.txid || signed.txID || '')
    }
    throw new Error(broadcast?.message || '交易广播失败')
  } catch (err) {
    const msg = extractWalletErrorMessage(err)
    if (/already|duplicate|exists/i.test(msg)) {
      return expectedTxId || String(signed.txID || '')
    }
    if (expectedTxId) {
      try {
        await waitForOnChainTronTx(tronWeb, expectedTxId, 15_000)
        return expectedTxId
      } catch {
        // fall through
      }
    }
    throw err
  }
}

async function approveViaWalletConnect(
  owner: string,
  spender: string,
  amount: string,
  hooks?: ApproveTronHooks,
): Promise<string> {
  const ownerAddr = owner.trim()
  const tronWeb = createTronWeb(ownerAddr)

  hooks?.onBuilding?.()

  const unsigned = await buildApproveTransaction(
    tronWeb as unknown as NonNullable<Window['tronWeb']>,
    ownerAddr,
    spender,
    amount,
    hooks,
    { skipExtendExpiration: true, skipTrxCheck: true, requireFresh: true },
  )

  let signDispatched = false
  try {
    const outcome = await signTronTransactionViaWalletConnect(unsigned, ownerAddr, {
      onDispatched: () => {
        signDispatched = true
        hooks?.onAwaitingWallet?.()
      },
    })
    hooks?.onSigned?.()

    if (outcome.alreadyBroadcast && outcome.txId) {
      return outcome.txId
    }
    if (!outcome.signed) {
      throw new Error('钱包未返回有效签名')
    }

    return broadcastSignedTransaction(tronWeb, outcome.signed)
  } catch (err) {
    if (isUserRejectedError(err)) throw err
    if (signDispatched) {
      const landed = await waitForAllowanceConfirmed(ownerAddr, spender, 12_000)
      if (landed) return 'allowance-confirmed'
    }
    throw err
  }
}

async function approveViaMetaMask(owner: string, spender: string, amount: string): Promise<string> {
  const ownerAddr = owner.trim()
  if (!isTronAddress(ownerAddr)) {
    throw new Error('钱包地址无效')
  }

  const adapter = new MetaMaskAdapter()
  await waitForMetaMaskAdapter(adapter)
  if (!adapter.connected || adapter.address?.trim() !== ownerAddr) {
    await adapter.connect()
  }
  const connected = adapter.address?.trim()
  if (!connected || connected !== ownerAddr) {
    throw new Error('MetaMask 地址与当前钱包不一致')
  }

  const tronWeb = createTronWeb(ownerAddr)
  const built = await tronWeb.transactionBuilder.triggerSmartContract(
    TRON_USDT_CONTRACT,
    'approve(address,uint256)',
    { feeLimit: APPROVE_FEE_LIMIT, callValue: 0 },
    [
      { type: 'address', value: spender },
      { type: 'uint256', value: amount },
    ],
    ownerAddr,
  )

  const unsigned = built.transaction
  if (!unsigned) {
    throw new Error('构建 approve 交易失败')
  }

  const signed = await walletSign(adapter.signTransaction(unsigned))
  assertValidSignedTransaction(signed)
  const broadcast = await tronWeb.trx.sendRawTransaction(signed as never)
  if (!broadcast?.result) {
    throw new Error(broadcast?.message || '交易广播失败')
  }
  return String(broadcast.txid || signed.txID || '')
}

/**
 * 发起 TRC20 USDT approve 链上交易（按用户连接时选择的钱包调用对应插件）
 */
export async function approveTronUsdt(
  owner: string,
  spender: string,
  amount: string = MAX_UINT256,
  walletId?: TronWalletId,
  hooks?: ApproveTronHooks,
): Promise<string> {
  const ownerAddr = owner.trim()
  if (!isTronAddress(ownerAddr)) {
    throw new Error('请先连接有效的 TRON 钱包')
  }

  const id = resolveWalletId(ownerAddr, walletId)

  switch (id) {
    case 'metamask':
      return approveViaMetaMask(ownerAddr, spender, amount)
    case 'tokenpocket':
      return approveViaTokenPocket(ownerAddr, spender, amount, hooks)
    case 'tronlink':
      return approveViaTronLink(ownerAddr, spender, amount, hooks)
    case 'walletconnect':
      return approveViaWalletConnect(ownerAddr, spender, amount, hooks)
    default:
      throw new Error('wallet-not-selected')
  }
}

/** @deprecated 请使用 approveTronUsdt */
export const approveTronUsdc = approveTronUsdt
