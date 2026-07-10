const USER_REJECTED_CODES = new Set([4001, 5000, 5002, '4001', '5000', '5002'])

/** 仅用于极少数 Promise 永不 settle 的兜底，不映射为用户拒绝 */
const SAFETY_HANG_TIMEOUT_MS = 300_000
/** WalletConnect 扫码签名：等待手机确认 + 中继回包 */
export const WC_SIGN_TIMEOUT_MS = 60_000

function withSafetyTimeout<T>(promise: Promise<T>, timeoutMs = SAFETY_HANG_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('approve-failed'))
    }, timeoutMs)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

/** 从钱包 / WalletConnect / viem 等嵌套结构提取可读错误 */
export function extractWalletErrorMessage(err: unknown, depth = 0): string {
  if (depth > 6 || err == null) return ''
  if (typeof err === 'string') return err.trim()

  if (err instanceof Error) {
    const anyErr = err as Error & {
      code?: unknown
      data?: unknown
      cause?: unknown
      details?: unknown
      shortMessage?: string
    }
    return [
      anyErr.shortMessage,
      anyErr.message,
      extractWalletErrorMessage(anyErr.cause, depth + 1),
      extractWalletErrorMessage(anyErr.details, depth + 1),
      extractWalletErrorMessage(anyErr.data, depth + 1),
    ]
      .filter(Boolean)
      .join(' ')
      .trim()
  }

  if (typeof err === 'object') {
    const o = err as Record<string, unknown>
    return [
      o.shortMessage,
      o.message,
      o.msg,
      o.reason,
      typeof o.code !== 'undefined' ? `code:${o.code}` : '',
      extractWalletErrorMessage(o.data, depth + 1),
      extractWalletErrorMessage(o.error, depth + 1),
      extractWalletErrorMessage(o.cause, depth + 1),
      extractWalletErrorMessage(o.details, depth + 1),
    ]
      .filter(Boolean)
      .join(' ')
      .trim()
  }

  return String(err)
}

export function isUserRejectedError(err: unknown, depth = 0): boolean {
  if (depth > 6 || err == null) return false

  const msg = extractWalletErrorMessage(err)
  if (
    /user rejected|user denied|confirmation declined|denied by user|declined by user|user cancel|cancelled|canceled|declined|reject|拒绝|取消|关闭|details:\s*cancel|wallet sign failed|user rejected request|request rejected|action_rejected|user closed/i.test(
      msg,
    )
  ) {
    return true
  }

  if (typeof err === 'object') {
    const o = err as Record<string, unknown>
    const code = o.code
    if (code != null && USER_REJECTED_CODES.has(code as number | string)) return true

    const nested = [o.data, o.error, o.cause, o.details]
    for (const item of nested) {
      if (isUserRejectedError(item, depth + 1)) return true
    }
  }

  return false
}

export function toWalletSignError(err: unknown): Error {
  const msg = extractWalletErrorMessage(err)
  if (/no matching key|pending session not found|session not found|unknown session/i.test(msg)) {
    return new Error('walletconnect-session-missing')
  }
  if (isUserRejectedError(err)) {
    return new Error('user-rejected')
  }
  if (/transaction expired|expired transaction|已过期|tx expired|expiration/i.test(msg)) {
    return new Error('approve-transaction-expired')
  }
  if (msg) return new Error(msg)
  return new Error('approve-failed')
}

export interface WalletSignOptions {
  /** 为 true 时启用安全超时（默认关闭，拒绝应立即返回） */
  safetyTimeout?: boolean
  /** 安全超时毫秒数，默认 5 分钟 */
  timeoutMs?: number
}

export async function walletSign<T>(promise: Promise<T>, options?: WalletSignOptions): Promise<T> {
  try {
    const wrapped = options?.safetyTimeout
      ? withSafetyTimeout(promise, options.timeoutMs ?? SAFETY_HANG_TIMEOUT_MS)
      : promise
    return await wrapped
  } catch (err) {
    throw toWalletSignError(err)
  }
}

/** 部分钱包拒绝时不抛错，而是返回空对象 / 错误体 */
export function assertValidSignedTransaction(signed: unknown): asserts signed is Record<string, unknown> {
  if (signed == null || signed === false) {
    throw new Error('user-rejected')
  }

  if (typeof signed !== 'object') {
    throw new Error('user-rejected')
  }

  const s = signed as Record<string, unknown>
  if (s.error) {
    throw toWalletSignError(s.error)
  }
  if (typeof s.code === 'number' && (s.code >= 4000 || USER_REJECTED_CODES.has(s.code))) {
    throw toWalletSignError(signed)
  }
  if (typeof s.result === 'object' && s.result != null) {
    assertValidSignedTransaction(s.result)
    return
  }
  if (s.signature || s.txID || s.raw_data || s.raw_data_hex) {
    return
  }
  if (Object.keys(s).length === 0) {
    throw new Error('user-rejected')
  }

  throw new Error('user-rejected')
}
