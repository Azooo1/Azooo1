import type { TronWalletId } from './tronProviders'
import {
  assertValidSignedTransaction,
  extractWalletErrorMessage,
  isUserRejectedError,
  toWalletSignError,
  walletSign,
} from './tronSign'

type TronSignRequestResult = {
  code?: number
  message?: string
  transaction?: Record<string, unknown>
  result?: Record<string, unknown>
}

function listenTronWalletReject(): { promise: Promise<never>; cleanup: () => void } {
  let rejectFn: ((e: Error) => void) | null = null
  const promise = new Promise<never>((_, reject) => {
    rejectFn = reject
  })

  const onMessage = (event: MessageEvent) => {
    const data = event.data
    if (!data || typeof data !== 'object') return
    const payload = (data as { message?: unknown }).message ?? data
    if (isUserRejectedError(payload)) {
      rejectFn?.(new Error('user-rejected'))
    }
  }

  window.addEventListener('message', onMessage)
  return {
    promise,
    cleanup: () => window.removeEventListener('message', onMessage),
  }
}

function parseSignRequestResult(res: TronSignRequestResult): Record<string, unknown> | null {
  if (res.code != null && res.code !== 200) {
    if (res.code === 4001 || res.code === 5000 || res.code === 5002) {
      throw new Error('user-rejected')
    }
    throw new Error(res.message || 'approve-failed')
  }

  const tx = res.transaction ?? res.result
  if (tx && typeof tx === 'object') {
    assertValidSignedTransaction(tx)
    return tx
  }
  return null
}

/** TronLink / TokenPocket 优先走 tron_signTransaction，避免 trx.sign 确认后不返回 */
export async function signTronTransactionViaExtension(
  tronWeb: NonNullable<Window['tronWeb']>,
  unsigned: object,
  walletId: TronWalletId,
): Promise<Record<string, unknown>> {
  const rejectListener = listenTronWalletReject()

  const signTask = async (): Promise<Record<string, unknown>> => {
    if (walletId === 'tokenpocket' && window.tokenpocket?.tron?.request) {
      try {
        const res = (await window.tokenpocket.tron.request({
          method: 'tron_signTransaction',
          params: { transaction: unsigned },
        })) as TronSignRequestResult
        const parsed = parseSignRequestResult(res)
        if (parsed) return parsed
      } catch (err) {
        if (isUserRejectedError(err)) throw err
        const msg = extractWalletErrorMessage(err)
        if (msg && !/not support|unsupported|method/i.test(msg)) {
          throw toWalletSignError(err)
        }
      }
    }

    if (window.tronLink?.request) {
      const res = (await window.tronLink.request({
        method: 'tron_signTransaction',
        params: { transaction: unsigned },
      })) as TronSignRequestResult
      const parsed = parseSignRequestResult(res)
      if (parsed) return parsed
    }

    const signed = await tronWeb.trx.sign(unsigned)
    assertValidSignedTransaction(signed)
    return signed
  }

  try {
    return await walletSign(Promise.race([signTask(), rejectListener.promise]))
  } finally {
    rejectListener.cleanup()
  }
}
